const { DataTypes } = require('sequelize');
const { sequelize } = require('../utils/db');

const GeoData = sequelize.define('GeoData', {

    external_id: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        // Usamos o 'codigoine' como external_id, que é mais estável
        field: 'codigo_ine' 
    },
    nome_local: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    
    // 2. Armazenamento dos Dados Processados (Censos)
    // Usamos JSON para armazenar a estrutura completa do censo, 
    censos_2011: {
        type: DataTypes.JSON, 
        allowNull: true,
    },
    censos_2021: {
        type: DataTypes.JSON, 
        allowNull: true,
    },

    // Manter as coordenadas, mas torná-las opcionais ou mudar para JSON/String 
    // se o geojson for mais complexo ou se não vierem no nível superior.
    geojson: {
        type: DataTypes.JSON, 
        allowNull: true,
    }
    
}, {
    tableName: 'distrito_data',
    // Manter 'createdAt' e 'updatedAt' para rastrear a sincronização
});

module.exports = GeoData;