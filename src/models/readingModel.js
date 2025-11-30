const db = require('../config/database');

const ReadingModel = {
    // Busca todas as cidades ativas para iterar sobre elas
    getActiveCities: () => {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM monitored_cities WHERE is_active = 1';
            db.all(sql, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    },

    // Insere uma nova leitura processada
    createReading: (data) => {
        return new Promise((resolve, reject) => {
            const sql = `
                INSERT INTO aqi_readings 
                (city_id, aqi, aqi_category, co, no2, o3, pm10, pm25, so2, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const params = [
                data.city_id, data.aqi, data.aqi_category, 
                data.co, data.no2, data.o3, data.pm10, data.pm25, data.so2, 
                data.latitude, data.longitude
            ];
            
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
};

module.exports = ReadingModel;