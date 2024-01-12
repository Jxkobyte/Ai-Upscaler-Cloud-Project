const crypto = require('crypto');

const syncCalculateHash = (image) => {
    try {
        const hash = crypto.createHash('sha256');
        hash.update(image);
        return hash.digest('hex');
    } catch (error) {
        console.error('Error calculating hash:', error);
        throw error;
    }
};

const asyncCalculateHash = (image) => {
    return new Promise((resolve, reject) => {
        try {
            const hash = crypto.createHash('sha256');
            hash.update(image);
            resolve(hash.digest('hex'));
        } catch (error) {
            console.error('Error calculating hash:', error);
            reject(error);
        }
    });
};

module.exports = { syncCalculateHash, asyncCalculateHash };