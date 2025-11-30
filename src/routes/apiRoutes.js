const express = require('express');
const router = express.Router();
const CityController = require('../controllers/cityController');
const ReadingController = require('../controllers/readingController');

// Rotas de Cidades
router.get('/cities', CityController.listCities);
router.post('/cities', CityController.addCity);

// Rotas de Leituras (Histórico)
router.get('/cities/:id/readings', ReadingController.getHistory);

module.exports = router;