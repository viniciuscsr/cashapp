const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const pool = require('./db');
const sessions = require('client-sessions');
const users = require('./routes/users');
const money = require('./routes/money');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(cookieParser());
app.use(
  session({
    secret: 'flashSecret',
    saveUninitialized: true,
    resave: true,
  })
);
app.use(flash());

// cookie settings for authentication sessions
app.use(
  sessions({
    cookieName: 'cashAppSession', // cookie name dictates the key name added to the request object
    secret: 'cashAppSecret', // should be a large unguessable string
    duration: 10 * 60 * 1000, // 30 min
    httpOnly: false, //don't let JS code access cookies
    // secure: true, // only set cookies over https
    ephemeral: true, // destroy cookies when the browser closes
  })
);

app.use((req, res, next) => {
  if (!(req.cashAppSession && req.cashAppSession.userId)) {
    return next();
  }
  pool.query(
    'SELECT * FROM users WHERE id=$1',
    [req.cashAppSession.userId],
    (err, result) => {
      if (err) {
        return next(err);
      }
      if (!result.rows[0]) {
        return next();
      }
      result.rows[0].password = undefined;
      req.user = result.rows[0];
      res.locals.user = result.rows[0];
      next();
    }
  );
});

// app.use(function (req, res, next) {
//   res.locals.success = req.flash('success');
//   res.locals.error = req.flash('error');
//   next();
// });

app.get('/', (req, res) => {
  res.render('home');
});

app.use('/users', users);
app.use('/money', money);

app.listen(process.env.PORT || 3000, (err, res) => {
  console.log('Server is running on port 3000');
});
