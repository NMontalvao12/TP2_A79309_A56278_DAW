const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { hashApiKey } = require('../utils/security');
require('dotenv').config();

const AdminController = {
    generateKey: (req, res) => {
        // Validação da ADMIN_API_KEY
        const incomingKey = req.headers['x-api-key'];
        if (incomingKey !== process.env.ADMIN_API_KEY) {
            return res.status(403).json({ status: 'error', message: 'Proibido.' });
        }

        const { client_name } = req.body;
        if (!client_name) return res.status(400).json({ error: "Nome obrigatório." });

        // 1. Gerar a chave original (UUID)
        const plainApiKey = uuidv4();

        // 2. Criar o Hash para guardar na BD
        const hashedKeyToStore = hashApiKey(plainApiKey);

        // 3. Guardar o HASH na BD
        const sql = `INSERT INTO api_keys (client_name, key_hash, is_active) VALUES (?, ?, 1)`;
        
        db.run(sql, [client_name, hashedKeyToStore], function(err) {
            if (err) return res.status(500).json({ error: err.message });

            // 4. Retornar a PLAIN KEY ao utilizador (Apenas agora!)
            res.status(201).json({
                status: 'success',
                message: 'Chave gerada. Guarde-a agora, ela não será mostrada novamente.',
                data: {
                    client_id: this.lastID,
                    client_name: client_name,
                    api_key: plainApiKey // <--- O utilizador recebe a chave que funciona
                }
            });
        });
    }
};

module.exports = AdminController;