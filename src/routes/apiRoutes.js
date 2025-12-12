const express = require('express');
const router = express.Router();
const apiKeyAuth = require('../middlewares/authMiddleware');
const CityController = require('../controllers/cityController');
const ReadingController = require('../controllers/readingController');
const AdminController = require('../controllers/adminController');

// --- Rota de Administração (Geração de Chaves) ---
// Esta rota valida a ADMIN_API_KEY internamente
router.post('/admin/generate-key', AdminController.generateKey);
router.delete('/admin/api-keys/:id', AdminController.deleteKey);

// --- Rotas Protegidas (Requerem API Key) ---
// Aplicamos o middleware a todas as rotas abaixo desta linha
router.use(apiKeyAuth);

// Status da api
router.get('/status', (req, res) => res.json({ status: 'online' }));

// Cidades
router.get('/cities', CityController.listCities);
router.post('/cities', CityController.addCity);
router.patch('/cities/:id/active', CityController.updateActive);
router.get('/cities/top/best', CityController.getTopBest);
router.get('/cities/top/worst', CityController.getTopWorst);

// Leituras
router.get('/cities/:id/readings', ReadingController.getHistory);
router.patch('/readings/:id', ReadingController.addNote);      
router.delete('/readings/:id', ReadingController.deleteReading); 
module.exports = router;