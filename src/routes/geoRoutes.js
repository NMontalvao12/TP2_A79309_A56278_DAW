const express = require('express');
const geoController = require('../controllers/geoController');
// const securityMiddleware = require('../lib/security'); // Implementar na Fase 3

const router = express.Router();

// Rota 1: GET /api/geo/dados -> Para consultar os dados armazenados localmente
router.get('/geo/dados', 
    // securityMiddleware.authenticate, // Aplicar segurança na Fase 3
    geoController.listGeoData
); 

// Rota 2: POST /api/geo/sync -> Para iniciar a importação/sincronização
router.post('/geo/sync', 
    // securityMiddleware.authorize, // Aplicar segurança na Fase 3
    geoController.initiateDataSync
);

module.exports = router;