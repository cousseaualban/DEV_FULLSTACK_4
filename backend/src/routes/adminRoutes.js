const express = require('express');

const {
    createUserAccount,
    getUsers,
    setUserBlockedStatus,
    setUserRoleStatus
} = require('../controllers/adminController');

const {
    authenticateToken
} = require('../middlewares/authMiddleware');

const adminMiddleware = require('../middlewares/adminMiddleware');

const router = express.Router();

router.post('/users', authenticateToken, adminMiddleware, createUserAccount);
router.get('/users', authenticateToken, adminMiddleware, getUsers);
router.put('/users/:id/block', authenticateToken, adminMiddleware, setUserBlockedStatus);
router.put('/users/:id/role', authenticateToken, adminMiddleware, setUserRoleStatus);

module.exports = router;