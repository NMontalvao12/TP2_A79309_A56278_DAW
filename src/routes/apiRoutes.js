const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middlewares/authMiddleware'); // Importar o middleware
const CityController = require('../controllers/cityController');
const ReadingController = require('../controllers/readingController');

// --- Rotas Protegidas (Requerem API Key) ---
// Aplicamos o middleware a todas as rotas abaixo desta linha
router.use(apiKeyAuth);

// --- Rotas Públicas (Ex: ver status) ---
router.get('/status', (req, res) => res.json({ status: 'online' }));

// Cidades
router.get('/cities', CityController.listCities);
router.post('/cities', CityController.addCity);

// Leituras
router.get('/cities/:id/readings', ReadingController.getHistory);
router.patch('/readings/:id', ReadingController.addNote);      
router.delete('/readings/:id', ReadingController.deleteReading); 
module.exports = router;