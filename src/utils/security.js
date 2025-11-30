const crypto = require('crypto');

/**
 * Gera um hash SHA-256 de uma string.
 * @param {string} key - A chave original.
 * @returns {string} - O hash em hexadecimal (64 caracteres).
 */
const hashApiKey = (key) => {
    return crypto.createHash('sha256').update(key).digest('hex');
};

module.exports = { hashApiKey };