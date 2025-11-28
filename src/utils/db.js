const { Sequelize } = require('sequelize');

// Cria uma instância do Sequelize
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_NAME, 
    logging: false, 
});

// sincroniza o modelo de dados com a base de dados
const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Conexão à base de dados SQLite estabelecida.');
        require('../models/GeoData');
        // Sincroniza todos os modelos definidos (cria tabelas se não existirem)
        await sequelize.sync({ alter: true }); 
        console.log('✅ Modelos sincronizados com a base de dados.');
    } catch (err) {
        console.error('❌ Falha na conexão/sincronização com a base de dados:', err.message);
        process.exit(1); 
    }
};

module.exports = {
    sequelize,
    connectDB
};