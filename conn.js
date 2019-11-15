const m = require('mongoose');

m.set('debug', true);

async function getConn(){
  await m.connect('mongodb://reader:123321@kodaktor.ru/readusers', { useNewUrlParser: true});
}
getConn().catch(e => console.error('Соединиться с БД не удалось. На этом все!'));
module.exports = m
