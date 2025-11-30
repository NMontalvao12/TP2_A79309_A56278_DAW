require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Para permitir acessos externos se necessário
const db = require('./src/config/database');
const initScheduler = require('./src/services/scheduler');
const apiRoutes = require('./src/routes/apiRoutes');

// Importações do Swagger
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');                  

const app = express();
const PORT = process.env.PORT || 3000;

// Carregar o ficheiro YAML
const swaggerDocument = YAML.load('./docs/swagger.yaml');

// Middlewares
app.use(cors());
app.use(express.json()); // Permite ler JSON no Body dos pedidos

// Rota da Documentação
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Registar Rotas
app.use('/api', apiRoutes);

app.get('/', (req, res) => {
    res.json({ 
        message: "API de Monitorização de Ar v1.0",
        docs: "Aceda a documentação em /api-docs"
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor a correr na porta ${PORT}`);
    console.log(`📄 Documentação disponível em http://localhost:${PORT}/api-docs`);
    initScheduler();
});