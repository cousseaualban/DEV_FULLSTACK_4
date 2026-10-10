const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const {
    getDocumentAccess,
    hasPermission,
    touchDocument,
    serializeDocument,
    saveUploadedFile,
    removeStoredFile
} = require('../services/documentService');

const parseId = (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const validName = (name) => typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 255;

const listDocuments = async (req, res) => {
    const folderId = req.query.folderId ? parseId(req.query.folderId) : null;
    if (req.query.folderId && !folderId) return res.status(400).json({ message: 'Identifiant de dossier invalide' });
    const documents = await prisma.document.findMany({
        where: {
            folderId,
            OR: [
                { ownerId: req.user.id },
                { permissions: { some: { userId: req.user.id } } }
            ]
        },
        include: { lastModifiedBy: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { updatedAt: 'desc' }
    });
    res.json({ documents });
};

const createDocument = async (req, res) => {
    const { name, folderId } = req.body;
    const parsedFolderId = folderId === undefined || folderId === null ? null : parseId(folderId);
    if (!validName(name)) return res.status(400).json({ message: 'Le nom du document est obligatoire' });
    if (folderId !== undefined && folderId !== null && !parsedFolderId) return res.status(400).json({ message: 'Identifiant de dossier invalide' });

    if (folderId !== undefined && folderId !== null) {
        const folder = await prisma.folder.findFirst({ where: { id: parsedFolderId, ownerId: req.user.id } });
        if (!folder) return res.status(404).json({ message: 'Dossier introuvable' });
    }

    const document = await prisma.document.create({
        data: { name: name.trim(), ownerId: req.user.id, folderId: parsedFolderId, lastModifiedById: req.user.id },
        include: { lastModifiedBy: { select: { id: true, firstName: true, lastName: true } }, files: true }
    });
    res.status(201).json({ document: serializeDocument(document) });
};

const getDocument = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (!hasPermission(access, 'READ')) return res.status(403).json({ message: 'Accès refusé' });

    const document = await prisma.document.findUnique({
        where: { id: access.document.id },
        include: {
            files: { select: { id: true, originalName: true, mimeType: true, size: true, createdAt: true, updatedAt: true, uploadedById: true } },
            lastModifiedBy: { select: { id: true, firstName: true, lastName: true } }
        }
    });
    res.json({ document });
};


const updateDocument = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (!hasPermission(access, 'WRITE')) return res.status(403).json({ message: 'Droit d’écriture requis' });
    if (req.body.name !== undefined && !validName(req.body.name)) {
        return res.status(400).json({ message: 'Nom de document invalide' });
    }
    if (req.body.content !== undefined && typeof req.body.content !== 'string') {
        return res.status(400).json({ message: 'Contenu du document invalide' });
    }

    const data = { lastModifiedById: req.user.id };

    if (req.body.name !== undefined) data.name = req.body.name.trim();
    if (req.body.content !== undefined) data.content = req.body.content;

    if (req.body.folderId !== undefined) {
        const parsedFolderId = req.body.folderId === null ? null : parseId(req.body.folderId);

        if (req.body.folderId !== null && !parsedFolderId) {
            return res.status(400).json({ message: 'Identifiant de dossier invalide' });
        }

        const folder = parsedFolderId === null
            ? null
            : await prisma.folder.findFirst({
                where: {
                    id: parsedFolderId,
                    ownerId: access.document.ownerId
                }
            });

        if (req.body.folderId !== null && !folder) {
            return res.status(404).json({ message: 'Dossier introuvable' });
        }

        data.folderId = parsedFolderId === null ? null : folder.id;
    }

    const document = await prisma.document.update({
        where: { id: access.document.id },
        data,
        include: {
            lastModifiedBy: {
                select: { id: true, firstName: true, lastName: true }
            }
        }
    });

    res.json({ document });
};


const deleteDocument = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (!hasPermission(access, 'DELETE')) return res.status(403).json({ message: 'Droit de suppression requis' });

    const document = await prisma.document.findUnique({ where: { id: access.document.id }, include: { files: true } });
    await prisma.document.delete({ where: { id: document.id } });
    await Promise.all(document.files.map(removeStoredFile));
    res.status(204).send();
};

const listFiles = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (!hasPermission(access, 'READ')) return res.status(403).json({ message: 'Accès refusé' });
    const files = await prisma.file.findMany({ where: { documentId: access.document.id }, orderBy: { createdAt: 'desc' } });
    res.json({ files: files.map(({ storagePath, storedName, ...file }) => file) });
};

const addFile = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (!hasPermission(access, 'WRITE')) return res.status(403).json({ message: 'Droit d’écriture requis' });
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });
    const file = await saveUploadedFile({ documentId: access.document.id, userId: req.user.id, file: req.file });
    const { storagePath, storedName, ...publicFile } = file;
    res.status(201).json({ file: publicFile });
};

const replaceFile = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (!hasPermission(access, 'WRITE')) return res.status(403).json({ message: 'Droit d’écriture requis' });
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

    const fileId = parseId(req.params.fileId);
    if (!fileId) return res.status(400).json({ message: 'Identifiant de fichier invalide' });
    const file = await prisma.file.findFirst({ where: { id: fileId, documentId: access.document.id } });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable' });

    const temporaryFile = await saveUploadedFile({ documentId: access.document.id, userId: req.user.id, file: req.file });
    const updatedFile = await prisma.file.update({
        where: { id: file.id },
        data: {
            originalName: temporaryFile.originalName,
            storedName: temporaryFile.storedName,
            storagePath: temporaryFile.storagePath,
            mimeType: temporaryFile.mimeType,
            size: temporaryFile.size,
            uploadedById: req.user.id
        }
    });
    await prisma.file.delete({ where: { id: temporaryFile.id } });
    await removeStoredFile(file);
    const { storagePath, storedName, ...publicFile } = updatedFile;
    res.json({ file: publicFile });
};

const downloadFile = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (!hasPermission(access, 'READ')) return res.status(403).json({ message: 'Accès refusé' });
    const fileId = parseId(req.params.fileId);
    if (!fileId) return res.status(400).json({ message: 'Identifiant de fichier invalide' });
    const file = await prisma.file.findFirst({ where: { id: fileId, documentId: access.document.id } });
    if (!file || !fs.existsSync(file.storagePath)) return res.status(404).json({ message: 'Fichier introuvable' });
    res.type(file.mimeType).download(file.storagePath, file.originalName);
};

const deleteFile = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (!hasPermission(access, 'DELETE')) return res.status(403).json({ message: 'Droit de suppression requis' });
    const fileId = parseId(req.params.fileId);
    if (!fileId) return res.status(400).json({ message: 'Identifiant de fichier invalide' });
    const file = await prisma.file.findFirst({ where: { id: fileId, documentId: access.document.id } });
    if (!file) return res.status(404).json({ message: 'Fichier introuvable' });
    await prisma.file.delete({ where: { id: file.id } });
    await removeStoredFile(file);
    await touchDocument(access.document.id, req.user.id);
    res.status(204).send();
};

const listPermissions = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (access.level !== 'OWNER') return res.status(403).json({ message: 'Seul le propriétaire peut gérer les droits' });
    const permissions = await prisma.documentPermission.findMany({
        where: { documentId: access.document.id },
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } }
    });
    res.json({ permissions });
};

const listCollaborators = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (!hasPermission(access, 'READ')) return res.status(403).json({ message: 'Accès refusé' });

    const document = await prisma.document.findUnique({
        where: { id: access.document.id },
        include: {
            owner: { select: { id: true, email: true, firstName: true, lastName: true } },
            permissions: {
                orderBy: { createdAt: 'asc' },
                include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } }
            }
        }
    });

    const users = [
        {
            id: document.owner.id,
            userId: document.owner.id,
            firstName: document.owner.firstName,
            lastName: document.owner.lastName,
            name: `${document.owner.firstName} ${document.owner.lastName}`.trim(),
            email: document.owner.email,
            role: 'owner',
            status: 'active'
        },
        ...document.permissions.map((permission) => ({
            id: permission.user.id,
            userId: permission.user.id,
            firstName: permission.user.firstName,
            lastName: permission.user.lastName,
            name: `${permission.user.firstName} ${permission.user.lastName}`.trim(),
            email: permission.user.email,
            role: permission.level === 'READ' ? 'viewer' : 'editor',
            status: 'active'
        }))
    ];

    res.json({ users, collaborators: users });
};

const setPermission = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (access.level !== 'OWNER') return res.status(403).json({ message: 'Seul le propriétaire peut gérer les droits' });
    const userId = parseId(req.params.userId || req.body.userId);
    const level = req.body.level;
    if (!userId || !['READ', 'WRITE', 'DELETE'].includes(level)) return res.status(400).json({ message: 'Utilisateur ou niveau de droit invalide' });
    if (userId === req.user.id) return res.status(400).json({ message: 'Le propriétaire possède déjà tous les droits' });
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const permission = await prisma.documentPermission.upsert({
        where: { documentId_userId: { documentId: access.document.id, userId } },
        create: { documentId: access.document.id, userId, level },
        update: { level }
    });
    res.status(200).json({ permission });
};

const removePermission = async (req, res) => {
    const access = await getDocumentAccess(parseId(req.params.id), req.user.id);
    if (!access) return res.status(404).json({ message: 'Document introuvable' });
    if (access.level !== 'OWNER') return res.status(403).json({ message: 'Seul le propriétaire peut gérer les droits' });
    const userId = parseId(req.params.userId);
    await prisma.documentPermission.deleteMany({ where: { documentId: access.document.id, userId } });
    res.status(204).send();
};

module.exports = {
    listDocuments, createDocument, getDocument, updateDocument, deleteDocument,
    listFiles, addFile, replaceFile, downloadFile, deleteFile,
    listPermissions, listCollaborators, setPermission, removePermission
};
