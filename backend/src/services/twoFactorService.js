const {
    generateSecret,
    generateURI,
    verify
} = require('otplib');

const createSecret = () => {
    return generateSecret();
};

const generateOtpAuthUrl = ({
    email,
    secret
}) => {
    return generateURI({
        issuer: 'Projet Spé 4',
        label: email,
        secret
    });
};

const verifyCode = async ({
    code,
    secret
}) => {
    const result = await verify({
        secret,
        token: code
    });

    return result.valid === true;
};

module.exports = {
    createSecret,
    generateOtpAuthUrl,
    verifyCode
};