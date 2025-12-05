const axios = require('axios');
const ReadingModel = require('../models/readingModel');
require('dotenv').config();

// Helper para determinar a categoria
function calculateCategory(aqi) {
    if (aqi <= 50) return "Bom";
    if (aqi <= 100) return "Moderado";
    if (aqi <= 150) return "Insalubre para Grupos Sensíveis";
    if (aqi <= 200) return "Insalubre";
    if (aqi <= 300) return "Muito Insalubre";
    return "Perigoso";
}

const AqiService = {
    syncData: async () => {
        console.log('--- A iniciar sincronização de dados ---');
        
        try {
            // 1. Obter cidades configuradas na BD
            const cities = await ReadingModel.getActiveCities();
            
            if (cities.length === 0) {
                console.log('Nenhuma cidade configurada para monitorizar.');
                return;
            }

            // 2. Iterar sobre cada cidade
            for (const city of cities) {
                try {
                    console.log(`A consultar dados para: ${city.search_query}...`);
                    
                    // Chamada à API da JuheAPI
                    const response = await axios.get('https://hub.juheapi.com/aqi/v1/city', {
                        params: {
                            q: city.search_query,
                            apikey: process.env.JUHE_API_KEY
                        }
                    });

                    // 3. Filtrar e Processar os dados
                    // A API retorna algo como { code: "0", data: { ... } }
                    if (response.data && response.data.code === "0" && response.data.data) {
                        const apiData = response.data.data;

                        // Objeto preparado para inserção
                        const readingToSave = {
                            city_id: city.id,
                            aqi: parseInt(apiData.aqi),
                            aqi_category: calculateCategory(parseInt(apiData.aqi)), // O nosso processamento customizado
                            co: parseFloat(apiData.co),
                            no2: parseFloat(apiData.no2),
                            o3: parseFloat(apiData.o3),
                            pm10: parseFloat(apiData.pm10),
                            pm25: parseFloat(apiData.pm25),
                            so2: parseFloat(apiData.so2),
                            latitude: parseFloat(apiData.geo.lat),
                            longitude: parseFloat(apiData.geo.lon)
                        };

                        // 4. Guardar na BD
                        await ReadingModel.createReading(readingToSave);
                        console.log(`Dados guardados para ${city.display_name || city.search_query}`);
                    } else {
                        console.error(`Erro na resposta da API para ${city.search_query}:`, response.data);
                    }

                } catch (cityError) {
                    console.error(`Falha ao processar cidade ${city.search_query}:`, cityError.message);
                }
            }
        } catch (error) {
            console.error('Erro geral no serviço de sincronização:', error);
        }
    }
};

module.exports = AqiService;