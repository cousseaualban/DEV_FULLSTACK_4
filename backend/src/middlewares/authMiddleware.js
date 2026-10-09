const {
    verifyToken
} = require('../services/tokenService');

const {
    getUserById
} = require('../services/userService');

const authenticateToken = async (req, res, next) => {
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

        const user = await getUserById(
            decodedToken.userId
        );

        if (!user) {
            return res.status(401).json({
                message: 'Utilisateur introuvable'
            });
        }

        req.user = {
            id: user.id,
            role: user.role
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