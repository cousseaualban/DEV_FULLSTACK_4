const crypto = require('crypto');

const hashPassword = (password) => {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');

        crypto.scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
};

const verifyPassword = (password, storedHash) => {
    return new Promise((resolve, reject) => {
        const [salt, hash] = storedHash.split(':');

        crypto.scrypt(password, salt, 64, (error, derivedKey) => {
            if (error) {
                reject(error);
                return;
            }

            const storedKey = Buffer.from(hash, 'hex');

            resolve(
                storedKey.length === derivedKey.length &&
                crypto.timingSafeEqual(storedKey, derivedKey)
            );
        });
    });
};

module.exports = {
    hashPassword,
    verifyPassword
};