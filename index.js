// index.js
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const dotenv = require('dotenv');
dotenv.config();
const { connectDB } = require('./src/utils/db');
const geoRoutes = require('./src/routes/geoRoutes');

app.use(express.json());

// Rota base (default)
app.get('/', (req, res) => {
    res.status(200).send({ message: "Sistema de Integração de Informação Ativo!" });
});

// LIGAÇÃO DAS ROTAS DA API REST (Fase 3)
// Todos os endpoints vão começar por /api
app.use('/api', geoRoutes);

// faz ligação a DB e inicia o servidor
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Servidor a correr na porta ${PORT}`);
        console.log(`Acesse: http://localhost:${PORT}`);
    });
}).catch(error => {
    console.error("Falha ao iniciar o servidor após erro na BD:", error.message);
    process.exit(1);
});