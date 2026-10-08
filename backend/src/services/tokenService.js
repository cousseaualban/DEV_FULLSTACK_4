const jwt = require('jsonwebtoken');

const generateToken = (user) => {
    return jwt.sign(
        {
            userId: user.id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    );
};

const generateTwoFactorToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            twoFactorPending: true
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '5m'
        }
    );
};

const verifyTwoFactorToken = (token) => {
    const decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    if (!decodedToken.twoFactorPending) {
        throw new Error('Token 2FA invalide');
    }

    return decodedToken;
};

const verifyToken = (token) => {
    return jwt.verify(
        token,
        process.env.JWT_SECRET
    );
};

module.exports = {
    generateToken,
    verifyToken,
    generateTwoFactorToken,
    verifyTwoFactorToken
};