const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Cria ou abre o ficheiro da base de dados
const dbPath = path.resolve(__dirname, '../aqi_database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar à base de dados:', err.message);
    } else {
        console.log('Conectado à base de dados SQLite.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // 1. Tabela de Cidades Monitorizadas
        db.run(`CREATE TABLE IF NOT EXISTS monitored_cities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            search_query VARCHAR(100) NOT NULL UNIQUE,
            display_name VARCHAR(100),
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Tabela de Leituras (Dados Históricos)
        db.run(`CREATE TABLE IF NOT EXISTS aqi_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city_id INTEGER NOT NULL,
            aqi INTEGER,
            aqi_category VARCHAR(50),
            co DECIMAL(10, 2),
            no2 DECIMAL(10, 2),
            o3 DECIMAL(10, 2),
            pm10 DECIMAL(10, 2),
            pm25 DECIMAL(10, 2),
            so2 DECIMAL(10, 2),
            latitude DECIMAL(10, 6),
            longitude DECIMAL(10, 6),
            measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_notes TEXT,
            FOREIGN KEY(city_id) REFERENCES monitored_cities(id) ON DELETE CASCADE
        )`);

        // 3. Tabela de Chaves de API (Segurança)
        db.run(`CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_name VARCHAR(100),
            key_hash VARCHAR(64) NOT NULL UNIQUE,
            is_active BOOLEAN DEFAULT 1
        )`);
        
        console.log("Tabelas verificadas/criadas com sucesso.");
    });
}

module.exports = db;