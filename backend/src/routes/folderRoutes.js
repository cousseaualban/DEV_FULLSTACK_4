const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { listFolders, createFolder, updateFolder, deleteFolder } = require('../controllers/folderController');

const router = express.Router();
router.use(authenticateToken);
router.get('/', listFolders);
router.post('/', createFolder);
router.patch('/:id', updateFolder);
router.delete('/:id', deleteFolder);

module.exports = router;
