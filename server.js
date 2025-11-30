require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Para permitir acessos externos se necessário
const db = require('./src/config/database');
const initScheduler = require('./src/services/scheduler');
const apiRoutes = require('./src/routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json()); // Permite ler JSON no Body dos pedidos

// Registar Rotas
app.use('/api', apiRoutes);

// Rota base
app.get('/', (req, res) => {
    res.json({ 
        message: "API de Monitorização de Ar v1.0",
        endpoints: {
            list_cities: "GET /api/cities",
            add_city: "POST /api/cities",
            history: "GET /api/cities/:id/readings"
        }
    });
});

// Inicialização
app.listen(PORT, () => {
    console.log(`🚀 Servidor a correr na porta ${PORT}`);
    
    // Inicia o Cron Job (Sincronização Agendada)
    initScheduler();
});