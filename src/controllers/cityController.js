const db = require('../config/database');
const AqiService = require('../services/aqiService');

const CityController = {
    // GET /cities - Listar todas as cidades
    listCities: (req, res) => {
        const sql = 'SELECT * FROM monitored_cities';
        db.all(sql, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json({
                status: 'success',
                data: rows
            });
        });
    },

    // POST /cities - Adicionar nova cidade
    addCity: (req, res) => {
        const { search_query, display_name } = req.body;

        if (!search_query) {
            return res.status(400).json({ error: "O campo 'search_query' é obrigatório." });
        }

        const sql = `INSERT INTO monitored_cities (search_query, display_name) VALUES (?, ?)`;
        const params = [search_query, display_name || search_query];

        db.run(sql, params, function (err) {
            if (err) {
                // Erro comum: cidade duplicada (UNIQUE constraint)
                if (err.message.includes('UNIQUE')) {
                    return res.status(409).json({ error: "Esta cidade já está a ser monitorizada." });
                }
                return res.status(500).json({ error: err.message });
            }

            const newCityId = this.lastID;

            // --- REQUISITO DE TEMPO REAL ---
            // Assim que adicionamos a cidade, forçamos a sincronização para obter dados imediatamente
            // sem esperar pela próxima hora do Cron Job.
            AqiService.syncData(); 

            res.status(201).json({
                status: 'success',
                message: 'Cidade adicionada e sincronização iniciada.',
                data: {
                    id: newCityId,
                    search_query,
                    display_name
                }
            });
        });
    }
};

module.exports = CityController;