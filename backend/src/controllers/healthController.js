const getHealth = (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Backend opérationnel'
    });
};

module.exports = {
    getHealth
};