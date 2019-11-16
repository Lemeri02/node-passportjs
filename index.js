const [{ Server: h1 }, x] = [require('http'), require('express')];
const request = require('request');
const url = require('url');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const passportLocal = require('passport-local');
const { u: User } = require('./models/User');
const bcrypt = require('bcrypt');
const salt = bcrypt.genSaltSync(10);

const ensureAuth = (r, res, done) => {
  if (!r.isAuthenticated()) return res.redirect('/locallogin');
  return done();
};

passport.use(new passportLocal.Strategy({
  usernameField: 'login',
  passwordField: 'password',
},
async (login, password, done) => {
  let user;
  const cryptedPassword = bcrypt.hashSync(password, salt);
  try {
    user = await User.findOne({ login });
  } catch (e) {
    return done('!! ' + e);
  }
  if (!user || bcrypt.hashSync(user.password, salt) !== cryptedPassword) {
    return done(null, false); // оба случая не найден юзер и неверен пароль
  }
  return done(null, user);
}
));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((_id, done) => User.findById(_id, (err, user) => done(err, user)));

const Router = x.Router();
const PORT = 4001;
const { log } = console;
const hu = { 'Content-Type': 'text/html; charset=utf-8' };
const app = x();
Router
  .route('/')
  .get(r => r.res.end(`<a href="/locallogin">Авторизоваться по этой ссылке</a><p><a href="/users">Users из базы данных</a></p>`));
Router
  .route('/err')
  .get(r => r.res.end('Увы, не получилось! Ещё раз: <a href="/profile">Профиль</a>'));
app
  .use((r, rs, n) => rs.status(200).set(hu) && n())
  .use(x.static('.'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true }))
  .use(session({ secret: 'mysecret', resave: true, saveUninitialized: true }))
  .use(passport.initialize())
  .use(passport.session())

  .use('/', Router)

  .get('/locallogin', (req, res) => res.render('login'))
  .post('/locallogin/check', passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/err' }))

  .get('/profile', ensureAuth, r => r.res.send(`<a href="/logout">Хотите выйти, ${r.user.login}?</a>`))

  .get('/logout', (r, res) => {
    r.logout();
    res.redirect('/');
  })
  .get('/users', async (req, res) => {
    const users = await User.find();
    const answer = users.map(item =>{
        return {login: item.login, password: item.password}
    });
    res.render('users', {users: answer});
  })

  .use(({ res: r }) => r.status(404).end('Пока нет!'))
  .use((e, r, rs, n) => rs.status(500).end(`Ошибка: ${e}`))
  .set('view engine', 'pug')
  .set('x-powered-by', false);
const s = h1(app)
  .listen(process.env.PORT || PORT, () => log(process.pid));