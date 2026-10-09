const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const prisma = require('../config/prisma');

const uploadDirectory = path.resolve(__dirname, '../../storage/uploads');

const permissionRank = {
    READ: 1,
    WRITE: 2,
    DELETE: 3
};

const ensureUploadDirectory = async () => {
    await fs.mkdir(uploadDirectory, { recursive: true });
};

const getDocumentAccess = async (documentId, userId) => {
    if (!Number.isInteger(documentId) || documentId <= 0) return null;

    const document = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
            permissions: {
                where: { userId },
                select: { level: true }
            }
        }
    });

    if (!document) return null;

    const level = document.ownerId === userId
        ? 'OWNER'
        : document.permissions[0]?.level || null;

    return { document, level };
};

const hasPermission = (access, requiredLevel) => {
    if (!access?.level) return false;
    if (access.level === 'OWNER') return true;
    return permissionRank[access.level] >= permissionRank[requiredLevel];
};

const touchDocument = (documentId, userId) => prisma.document.update({
    where: { id: documentId },
    data: { lastModifiedById: userId, updatedAt: new Date() }
});

const serializeDocument = (document) => ({
    ...document,
    files: document.files?.map(({ storagePath, storedName, ...file }) => file)
});

const saveUploadedFile = async ({ documentId, userId, file }) => {
    await ensureUploadDirectory();

    const extension = path.extname(file.originalname).toLowerCase();
    const storedName = `${crypto.randomUUID()}${extension}`;
    const storagePath = path.join(uploadDirectory, storedName);

    await fs.writeFile(storagePath, file.buffer);

    try {
        const savedFile = await prisma.file.create({
            data: {
                documentId,
                originalName: file.originalname,
                storedName,
                storagePath,
                mimeType: file.mimetype || 'application/octet-stream',
                size: file.size,
                uploadedById: userId
            }
        });

        await touchDocument(documentId, userId);
        return savedFile;
    } catch (error) {
        await fs.rm(storagePath, { force: true });
        throw error;
    }
};

const removeStoredFile = async (file) => {
    if (file?.storagePath) await fs.rm(file.storagePath, { force: true });
};

module.exports = {
    uploadDirectory,
    getDocumentAccess,
    hasPermission,
    touchDocument,
    serializeDocument,
    saveUploadedFile,
    removeStoredFile
};
