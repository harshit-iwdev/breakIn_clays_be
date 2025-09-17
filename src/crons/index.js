const cron = require('node-cron');
const dayCron = require('./onEventDayNotification');
const dayBeforeCron = require('./dayBeforeNotification');

cron.schedule('58 7 * * *', () => {//'0 10 * * *'
  dayCron.getDayEvent();
  console.log('Task running for same day:', new Date().toLocaleString());
});

cron.schedule('1 8 * * *', () => {//'0 10 * * *'
  dayBeforeCron.getNextDayEvent();
  console.log('Task running for day before:', new Date().toLocaleString());
});