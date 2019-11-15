const bodyParser = require('body-parser');
const session = require('express-session');
const { u: User } = require('./models/User');
const [{ Server: h1 }, x] = [require('http'), require('express')];

const Router = x.Router();
const PORT = 4321;
const { log } = console;
const hu = { 'Content-Type': 'text/html; charset=utf-8' };
const app = x();

const checkAuth = (req, res, next) => {
  if (req.session.auth == 'ok') {
    next();
  } else {
    res.redirect('/login');
  }
};

Router
  .route('/')
  .get(r => r.res.end('Привет мир!'))
app
  .use((r, rs, n) => rs.status(200).set(hu) && n())
  .use(x.static('.'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true}))
  .use(session({ secret: 'mysecret', resave: true, saveUninitialized: true}))
  .use('/', Router)
  .get('/login', r => r.res.render('login'))
  .post('/login/check/', async r => {
    const { body: { login }} = r;
    const user = await User.findOne({ login });
    if (user) {
      if (user.password === r.body.pass){
        r.session.auth = 'ok';
        r.session.login = login;
        r.res.send('Вы авторизованы! Доступен закрытый маршрут!');
      } else {
        r.res.send('Неверный пароль!');
      }
    } else {
      r.res.send('Нет такого пользователя!');
    }
  })
  .get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) console.log(err);
    });
    res.send('Вы успешно разлогинились');
  })
  .get('/users', async (req, res) => {
    const users = await User.find();
    const answer = users.map(item =>{
        return {login: item.login, password: item.password}
    });
    res.render('users', {users: answer});
  })
  .get('/profile', checkAuth, r => r.res.send(r.session.login))
  .use(({ res: r }) => r.status(404).end('Пока нет!'))
  .use((e, r, rs, n) => rs.status(500).end(`Ошибка: ${e}`))
  .set('view engine', 'pug')
  .set('x-powered-by', false);
module.exports = h1(app)
  .listen(process.env.PORT || PORT, () => log(process.pid));
