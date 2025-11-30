const db = require('../config/database');

const ReadingController = {
    // GET /cities/:id/readings - Histórico de uma cidade
    getHistory: (req, res) => {
        const cityId = req.params.id;
        
        const sql = `
            SELECT * FROM aqi_readings 
            WHERE city_id = ? 
            ORDER BY measured_at DESC 
            LIMIT 50
        `;
        
        db.all(sql, [cityId], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                status: 'success',
                city_id: cityId,
                count: rows.length,
                data: rows
            });
        });
    }
};

module.exports = ReadingController;