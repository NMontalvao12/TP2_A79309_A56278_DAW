const axios = require('axios');
const GeoData = require('../models/GeoData');

const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL; 

const syncDataFromExternalAPI = async (distritoNome) => {

    const endpoint = `/distrito/${distritoNome}`; 
    console.log(`A sincronizar dados de ${endpoint}...`);

    try {
        const url = `${EXTERNAL_API_BASE_URL}${endpoint}`;
        const response = await axios.get(url);
        
        const rawData = response.data;
        
        if (!rawData || !rawData.distrito) {
             throw new Error("Formato de dados inesperado ou distrito não encontrado na GeoAPI.");
        }
        
        // Processamento e Filtragem
        const processedItem = {
            // Usamos o código INE como chave única (mais robusto que o nome)
            external_id: rawData.codigoine, 
            nome_local: rawData.distrito,
            
            censos_2011: rawData.censos2011,
            censos_2021: rawData.censos2021,
            geojson: rawData.geojson || null // Certifica-se de que se for nulo, armazena null
        };

        // 2. Armazenamento (Upsert)
        const [data, created] = await GeoData.findOrCreate({
            where: { external_id: processedItem.external_id }, 
            defaults: processedItem 
        });

        if (!created) {
            // Operação UPDATE: Atualiza todos os campos de censo/geojson
            await data.update(processedItem); 
        }
        
        return { 
            message: `Sincronização do distrito ${distritoNome} concluída.`, 
            operation: created ? 'INSERT' : 'UPDATE'
        };

    } catch (error) { // Para perceber melhor os erros fazer request via postman (codigo detalhado do erro)
        console.error("Erro na integração com a GeoAPI:", error.message);
        throw new Error("Falha na sincronização de dados do distrito.");
    }
};

// Adicionar aqui a função para consultar os dados armazenados
const getGeoData = async (query = {}) => {
    // Consulta no Sequelize
    return GeoData.findAll({ where: query });
};

module.exports = {
    syncDataFromExternalAPI,
    getGeoData
};