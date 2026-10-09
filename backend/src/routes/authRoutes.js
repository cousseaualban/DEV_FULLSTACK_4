const express = require('express');

const {
    login,
    loginTwoFactor,
    changePassword,
    setupTwoFactor,
    verifyTwoFactor,
    logout
} = require('../controllers/authController');

const {
    getCurrentUser,
    updateCurrentUser
} = require('../controllers/userController');

const {authenticateToken} = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/2fa/login', loginTwoFactor);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/me', authenticateToken, updateCurrentUser);
router.put('/password', authenticateToken, changePassword);
router.post('/2fa/setup', authenticateToken, setupTwoFactor);
router.post('/2fa/verify', authenticateToken, verifyTwoFactor);
router.post('/logout', authenticateToken, logout);

module.exports = router;