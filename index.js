const bodyParser = require('body-parser');
const session = require('express-session');
const { u: User } = require('./models/User');
const [{ Server: h1 }, x] = [require('http'), require('express')];

const request = require('request');
const url = require('url');
const passport = require('passport');
const passportLocal = require('passport-local');

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

const ensureAuth = (r, res, done) => {
  if (!r.isAuthenticated()) return res.redirect('/login');
  return done();
};

passport.use(new passportLocal.Strategy({
  usernameField: 'login',
  passwordField: 'password',
},
async (login, password, done) => {
  let user;
  try {
    user = await User.findOne({ login });
    console.log(user, password) 
  } catch (e) { 
    console.log(e) 
    return done('!! ' + e);
    
  }
  console.log(user, password) 
  if (!user || user.password !== password)  {
    console.log(user, password) 
    return done(null, false); // оба случая не найден юзер и неверен пароль
  } console.log(user, password) 
  return done(null, user);

}
));
console.log(user, password)

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser((_id, done) => User.findById(_id, (err, user) => done(err, user)));

Router
  .route('/')
  .get(r => r.res.end('Привет мир!'));
Router
  .route('/err')
  .get(r => r.res.end('Увы, не получилось! Ещё раз: <a href="/profile">Профиль</a>'));
app
  .use((r, rs, n) => rs.status(200).set(hu) && n())
  .use(x.static('.'))
  .use(bodyParser.json())
  .use(bodyParser.urlencoded({ extended: true}))
  .use(session({ secret: 'mysecret', resave: true, saveUninitialized: true}))
  .use(passport.initialize())
  .use(passport.session())

  .use('/', Router)

  .get('/login', (req, res) => res.render('login'))
  .post('/login/check/', passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/err' }))
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
  .get('/profile', ensureAuth, r => r.res.send(`<a href="/logout">Хотите выйти, ${r.user.login}?</a>`))
  .use(({ res: r }) => r.status(404).end('Пока нет!'))
  .use((e, r, rs, n) => rs.status(500).end(`Ошибка: ${e}`))
  .set('view engine', 'pug')
  .set('x-powered-by', false);
const s = h1(app)
  .listen(process.env.PORT || PORT, () => log(process.pid));
