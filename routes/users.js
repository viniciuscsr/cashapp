const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const { check, validationResult } = require('express-validator');
const sessions = require('client-sessions');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

router.use(cookieParser());

//--------------------
//     SIGNUP
//--------------------

router.get('/signup', (req, res) => {
  res.render('users/signup');
});

router.post(
  '/signup',
  check('email').isEmail(),
  check('password').isLength({ min: 6 }),
  check('name').notEmpty(),
  async (req, res) => {
    // DATA VALIDATION

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // CHECK IF EMAIL IS UNIQUE

    try {
      const emailUnique = await pool.query(
        'SELECT email FROM users WHERE email=$1',
        [email]
      );
      if (emailUnique.rows[0]) {
        res.json({ message: 'Email already being used' });
        return;
      }
    } catch (err) {
      console.log(err);
    }

    //PASSWORD ENCRYPTION
    let encryptedPassword;
    try {
      encryptedPassword = await bcrypt.hash(password, 10);
    } catch (err) {
      console.log(err);
    }

    // SAVING NEW USER IN THE DATABASE
    let newUser;
    try {
      newUser = await pool.query(
        'INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING id',
        [name, email, encryptedPassword]
      );
      res.redirect('/money/');
    } catch (err) {
      console.log(err);
    }

    //ADDING NEW USER TO THE BALANCE TABLE

    try {
      const balanceRow = await pool.query(
        'INSERT INTO balance(user_id, balance) VALUES ($1, $2)',
        [newUser.rows[0].id, 0]
      );
    } catch (err) {
      console.log(err);
    }
  }
);
//--------------------
//     LOGIN
//--------------------

router.get('/login', csrfProtection, (req, res) => {
  res.render('users/login', { csrfToken: req.csrfToken() });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // FINDING EMAIL IN THE DB
  let result;
  try {
    result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  } catch (err) {
    console.log(err);
  }

  if (
    !result.rows[0] ||
    !bcrypt.compareSync(password, result.rows[0].password)
  ) {
    return res.json({
      message: 'Something went wrong. Incorrect email or password',
    });
  }

  // adding the user ID to the cookie in the response header
  req.cashAppSession.userId = result.rows[0].id;

  res.redirect('/money');
});

//--------------------
//     LOGOUT
//--------------------

router.get('/logout', (req, res) => {
  console.log(req.cookies);
  //   if (req.cookies.cashAppSession) {
  //     req.cookies.cashAppSession.reset();
  //     console.log(req.cookies);
  //     res.redirect('/');
  //   } else {
  //     console.log('false');
  //   }
});

module.exports = router;
