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
    addCity: async (req, res) => {
        const { search_query, display_name } = req.body;

        if (!search_query) {
            return res.status(400).json({ error: "O campo 'search_query' é obrigatório." });
        }

        try {
            // ✅ 1. Validar se a cidade existe na API externa
            const exists = await AqiService.validateCity(search_query);
            if (!exists) {
                return res.status(404).json({ error: `Cidade '${search_query}' não encontrada na API externa.` });
            }

            // ✅ 2. Inserir na BD
            const sql = `INSERT INTO monitored_cities (search_query, display_name) VALUES (?, ?)`;
            const params = [search_query, display_name || search_query];

            db.run(sql, params, function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(409).json({ error: "Esta cidade já está a ser monitorizada." });
                    }
                    return res.status(500).json({ error: err.message });
                }

                const newCityId = this.lastID;

                // ✅ 3. Sincronizar dados imediatamente
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
        } catch (err) {
            res.status(500).json({ error: "Erro ao validar cidade na API externa." });
        }
    },

    updateActive: (req, res) => {
        const cityId = req.params.id;
        const { is_active } = req.body;

        if (is_active === undefined) {
            return res.status(400).json({ error: "O campo 'is_active' é obrigatório." });
        }

        let value;
        if (typeof is_active === 'boolean') {
            value = is_active ? 1 : 0;
        } else if (typeof is_active === 'number') {
            value = is_active ? 1 : 0;
        } else if (typeof is_active === 'string') {
            const s = is_active.toLowerCase();
            if (s === '1' || s === 'true') value = 1;
            else if (s === '0' || s === 'false') value = 0;
            else return res.status(400).json({ error: "Valor inválido para 'is_active'." });
        } else {
            return res.status(400).json({ error: "Valor inválido para 'is_active'." });
        }

        const sql = 'UPDATE monitored_cities SET is_active = ? WHERE id = ?';
        db.run(sql, [value, cityId], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: 'Cidade não encontrada.' });

            res.json({
                status: 'success',
                message: 'Estado atualizado.',
                data: { id: cityId, is_active: value }
            });
        });
    },
    getTopBest: (req, res) => {
        const sql = `
            SELECT mc.id AS city_id, mc.display_name, mc.search_query, ar.aqi, ar.measured_at
            FROM monitored_cities mc
            JOIN (
                SELECT r.city_id, r.aqi, r.measured_at
                FROM aqi_readings r
                JOIN (
                    SELECT city_id, MAX(measured_at) AS max_measured_at
                    FROM aqi_readings
                    GROUP BY city_id
                ) latest ON latest.city_id = r.city_id AND latest.max_measured_at = r.measured_at
            ) ar ON ar.city_id = mc.id
            ORDER BY ar.aqi ASC
            LIMIT 3
        `;
        db.all(sql, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: 'success', data: rows });
        });
    },
    getTopWorst: (req, res) => {
        const sql = `
            SELECT mc.id AS city_id, mc.display_name, mc.search_query, ar.aqi, ar.measured_at
            FROM monitored_cities mc
            JOIN (
                SELECT r.city_id, r.aqi, r.measured_at
                FROM aqi_readings r
                JOIN (
                    SELECT city_id, MAX(measured_at) AS max_measured_at
                    FROM aqi_readings
                    GROUP BY city_id
                ) latest ON latest.city_id = r.city_id AND latest.max_measured_at = r.measured_at
            ) ar ON ar.city_id = mc.id
            ORDER BY ar.aqi DESC
            LIMIT 3
        `;
        db.all(sql, [], (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ status: 'success', data: rows });
        });
    }
};

module.exports = CityController;