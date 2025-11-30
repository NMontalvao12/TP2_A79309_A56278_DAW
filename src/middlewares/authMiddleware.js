const db = require('../config/database');

const apiKeyAuth = (req, res, next) => {
    // 1. Procurar a chave no Header x-api-key
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Acesso negado. Forneça uma api key.' 
        });
    }

    // 2. Verificar se a chave existe e está ativa na BD
    const sql = 'SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1';
    
    db.get(sql, [apiKey], (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Erro interno na validação de segurança.' });
        }

        if (!row) {
            return res.status(401).json({ 
                status: 'error', 
                message: 'Acesso negado. API Key inválida.' 
            });
        }

        // 3. Se encontrou, anexa a info do cliente ao pedido e deixa passar
        req.client = row;
        next();
    });
};

module.exports = apiKeyAuth;