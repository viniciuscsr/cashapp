const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const pool = require('./db');
const sessions = require('client-sessions');
const users = require('./routes/users');
const dashboard = require('./routes/money');

app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// cookie settings for authentication sessions
app.use(
  sessions({
    cookieName: 'cashAppSession', // cookie name dictates the key name added to the request object
    secret: 'cashAppSecret', // should be a large unguessable string
    duration: 10 * 60 * 1000, // 30 min
    httpOnly: true, //don't let JS code access cookies
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

app.get('/', (req, res) => {
  pool.query('SELECT * FROM users', (err, result) => {
    if (err) {
      console.log(err);
    }
    res.json(result.rows);
  });
});

app.use('/users', users);
app.use('/dashboard', dashboard);

app.listen(3000, (err, res) => {
  console.log('Server is running on port 3000');
});
