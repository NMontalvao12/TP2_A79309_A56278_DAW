const dataService = require('../utils/dataService');

const DISTRICT_NAME = 'Faro';

//Endpoint POST para iniciar a sincronização de dados do Distrito para a BD local.
const initiateDataSync = async (req, res) => {
    try {
        const result = await dataService.syncDataFromExternalAPI(DISTRICT_NAME); 
        
        res.status(200).json({
            message: `Sincronização do distrito ${DISTRICT_NAME} iniciada com sucesso.`,
            details: result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

//Endpoint GET para listar os dados processados e armazenados localmente.
const listGeoData = async (req, res) => {
    // adicionar controlo de acesso
    try {
        const data = await dataService.getGeoData();
        
        res.status(200).json({ 
            count: data.length, 
            data: data 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    initiateDataSync,
    listGeoData
};