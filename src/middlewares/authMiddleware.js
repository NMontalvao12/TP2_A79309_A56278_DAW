const db = require('../config/database');
const { hashApiKey } = require('../utils/security');

const apiKeyAuth = (req, res, next) => {
    const incomingKey = req.headers['x-api-key'];

    if (!incomingKey) {
        return res.status(401).json({ status: 'error', message: 'API Key em falta.' });
    }

    // 1. Converter a chave recebida para Hash
    const hashedIncoming = hashApiKey(incomingKey);

    // 2. Procurar na BD pelo HASH, não pela chave original
    const sql = 'SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1';
    
    db.get(sql, [hashedIncoming], (err, row) => {
        if (err) return res.status(500).json({ error: 'Erro interno.' });

        if (!row) {
            return res.status(401).json({ status: 'error', message: 'API Key inválida.' });
        }

        req.client = row;
        next();
    });
};

module.exports = apiKeyAuth;