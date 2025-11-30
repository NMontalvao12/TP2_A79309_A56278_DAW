const cron = require('node-cron');
const AqiService = require('./aqiService');

const initScheduler = () => {
    // Agenda para rodar a cada 1 hora (minuto 0)
    // '*/2 * * * *' para rodar a cada 2 minutos durante os testes
    cron.schedule('0 * * * *', () => {
        console.log('Running scheduled task: AQI Sync');
        AqiService.syncData();
    });

    console.log('Scheduler iniciado. Tarefa de sincronização agendada.');
};

module.exports = initScheduler;