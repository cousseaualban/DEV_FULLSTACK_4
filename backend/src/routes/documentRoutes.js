const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const {
    listDocuments, createDocument, getDocument, updateDocument, deleteDocument,
    listFiles, addFile, replaceFile, downloadFile, deleteFile,
    listPermissions, listCollaborators, setPermission, removePermission
} = require('../controllers/documentController');

const router = express.Router();
router.use(authenticateToken);

router.get('/', listDocuments);
router.post('/', createDocument);
router.get('/:id/collaborators', listCollaborators);
router.get('/:id', getDocument);
router.patch('/:id', updateDocument);
router.delete('/:id', deleteDocument);

router.get('/:id/files', listFiles);
router.post('/:id/files', upload.single('file'), addFile);
router.put('/:id/files/:fileId', upload.single('file'), replaceFile);
router.get('/:id/files/:fileId/download', downloadFile);
router.delete('/:id/files/:fileId', deleteFile);

router.get('/:id/permissions', listPermissions);
router.put('/:id/permissions/:userId', setPermission);
router.delete('/:id/permissions/:userId', removePermission);

module.exports = router;
