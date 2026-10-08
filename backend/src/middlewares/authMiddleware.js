const {
    verifyToken
} = require('../services/tokenService');

const authenticateToken = (req, res, next) => {
    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            message: 'Token d’authentification manquant'
        });
    }

    const [type, token] = authorization.split(' ');

    if (type !== 'Bearer' || !token) {
        return res.status(401).json({
            message: 'Format du token invalide'
        });
    }

    try {
        const decodedToken = verifyToken(token);

        req.user = {
            id: decodedToken.userId
        };

        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Token d’authentification invalide ou expiré'
        });
    }
};

module.exports = {
    authenticateToken
};