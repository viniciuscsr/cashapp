const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');
const { check } = require('express-validator');
const sessions = require('client-sessions');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const userController = require('../controllers/userController');

router.use(cookieParser());

//--------------------
//     SIGNUP
//--------------------

router.get('/signup', (req, res) => {
  res.render('users/signup', {
    message: req.flash('error')[0],
  });
});

router.post(
  '/signup',
  check('email').isEmail(),
  check('password').isLength({ min: 6 }),
  check('name').notEmpty(),
  userController.signup
);
//--------------------
//     LOGIN
//--------------------

router.get('/login', csrfProtection, (req, res) => {
  res.render('users/login', { csrfToken: req.csrfToken() });
});

router.post('/login', userController.login);

//--------------------
//     LOGOUT
//--------------------

router.get('/logout', (req, res) => {
  if (req.cookies.cashAppSession) {
    res.clearCookie('cashAppSession');
    res.redirect('/');
  } else {
    console.log('false');
    res.redirect('/');
  }
});

module.exports = router;
