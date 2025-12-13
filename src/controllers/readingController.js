const db = require('../config/database');

const ReadingController = {
    // GET /api/cities/readings - Histórico global (todas as cidades)
    getAllReadings: (req, res) => {
        const { start_date, end_date, limit } = req.query;

        // JOIN para incluir o nome da cidade nos resultados globais
        // Usamos alias 'r' para readings e 'c' para cities
        let sql = `
            SELECT r.*, c.display_name as city_name 
            FROM aqi_readings r
            JOIN monitored_cities c ON r.city_id = c.id
            WHERE 1=1
        `;
        const params = [];

        if (start_date) {
            sql += ` AND r.measured_at >= ?`;
            params.push(start_date);
        }

        if (end_date) {
            sql += ` AND r.measured_at <= ?`;
            params.push(end_date);
        }

        // Ordenação por data decrescente
        sql += ` ORDER BY r.measured_at DESC`;

        // Limite
        sql += ` LIMIT ?`;
        params.push(limit ? parseInt(limit) : 50);

        db.all(sql, params, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                status: 'success',
                filters: { start_date, end_date, limit },
                count: rows.length,
                data: rows
            });
        });
    },
    
    // GET /cities/:id/readings - Histórico de uma cidade com filtros
    getHistory: (req, res) => {
        const cityId = req.params.id;
        
        // 1. Capturar os parâmetros da query string (URL)
        // Exemplo: /readings?start_date=2025-10-01&limit=100
        const { start_date, end_date, limit } = req.query;

        // 2. Iniciar a query base e o array de parâmetros
        let sql = `SELECT * FROM aqi_readings WHERE city_id = ?`;
        const params = [cityId];

        // 3. Adicionar filtros dinamicamente se eles existirem
        if (start_date) {
            // Assume formato YYYY-MM-DD ou ISO8601
            sql += ` AND measured_at >= ?`;
            params.push(start_date);
        }

        if (end_date) {
            sql += ` AND measured_at <= ?`;
            params.push(end_date);
        }

        // 4. Adicionar ordenação (do mais recente para o mais antigo)
        sql += ` ORDER BY measured_at DESC`;

        // 5. Adicionar Limite (se não for passado, assume 50)
        sql += ` LIMIT ?`;
        params.push(limit ? parseInt(limit) : 50);

        // 6. Executar a query final
        db.all(sql, params, (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                status: 'success',
                city_id: cityId,
                filters: { start_date, end_date, limit }, // Útil para debug
                count: rows.length,
                data: rows
            });
        });
    },

    // PATCH /readings/:id - Adicionar Nota (Update)
    addNote: (req, res) => {
        const readingId = req.params.id;
        const { user_notes } = req.body;

        if (!user_notes) {
            return res.status(400).json({ error: "O campo 'user_notes' é obrigatório." });
        }

        const sql = `UPDATE aqi_readings SET user_notes = ? WHERE id = ?`;
        
        db.run(sql, [user_notes, readingId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Leitura não encontrada." });

            res.json({
                status: 'success',
                message: 'Nota adicionada com sucesso.',
                changes: { id: readingId, note: user_notes }
            });
        });
    },

    // DELETE /readings/:id - Apagar Leitura (Delete)
    deleteReading: (req, res) => {
        const readingId = req.params.id;
        const sql = `DELETE FROM aqi_readings WHERE id = ?`;

        db.run(sql, [readingId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Leitura não encontrada." });

            res.json({
                status: 'success',
                message: 'Leitura apagada com sucesso.'
            });
        });
    }
};

module.exports = ReadingController;