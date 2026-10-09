const prisma = require('../config/prisma');

const isValidName = (name) => typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 255;
const parseId = (value) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;

const listFolders = async (req, res) => {
    const parentId = req.query.parentId === undefined ? null : parseId(req.query.parentId);
    if (req.query.parentId !== undefined && !parentId) return res.status(400).json({ message: 'Identifiant de dossier invalide' });
    const folders = await prisma.folder.findMany({
        where: { ownerId: req.user.id, parentId },
        orderBy: { name: 'asc' }
    });
    res.json({ folders });
};

const createFolder = async (req, res) => {
    const { name, parentId } = req.body;
    if (!isValidName(name)) return res.status(400).json({ message: 'Le nom du dossier est obligatoire' });

    if (parentId !== undefined && parentId !== null) {
        const parsedParentId = parseId(parentId);
        if (!parsedParentId) return res.status(400).json({ message: 'Identifiant de dossier invalide' });
        const parent = await prisma.folder.findFirst({ where: { id: parsedParentId, ownerId: req.user.id } });
        if (!parent) return res.status(404).json({ message: 'Dossier parent introuvable' });
        req.body.parentId = parsedParentId;
    }

    const folder = await prisma.folder.create({
        data: { name: name.trim(), ownerId: req.user.id, parentId: parentId ? parseId(parentId) : null }
    });
    res.status(201).json({ folder });
};

const updateFolder = async (req, res) => {
    const folderId = parseId(req.params.id);
    if (!folderId) return res.status(400).json({ message: 'Identifiant de dossier invalide' });
    const folder = await prisma.folder.findFirst({ where: { id: folderId, ownerId: req.user.id } });
    if (!folder) return res.status(404).json({ message: 'Dossier introuvable' });
    if (!isValidName(req.body.name)) return res.status(400).json({ message: 'Le nom du dossier est obligatoire' });

    const updatedFolder = await prisma.folder.update({
        where: { id: folder.id },
        data: { name: req.body.name.trim() }
    });
    res.json({ folder: updatedFolder });
};

const deleteFolder = async (req, res) => {
    const folderId = parseId(req.params.id);
    if (!folderId) return res.status(400).json({ message: 'Identifiant de dossier invalide' });
    const folder = await prisma.folder.findFirst({ where: { id: folderId, ownerId: req.user.id } });
    if (!folder) return res.status(404).json({ message: 'Dossier introuvable' });

    const children = await prisma.folder.count({ where: { parentId: folder.id } });
    if (children > 0) return res.status(409).json({ message: 'Le dossier contient des sous-dossiers' });

    await prisma.folder.delete({ where: { id: folder.id } });
    res.status(204).send();
};

module.exports = { listFolders, createFolder, updateFolder, deleteFolder };
