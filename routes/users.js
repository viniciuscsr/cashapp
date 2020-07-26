const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });
const userController = require('../controllers/userController');

router.use(cookieParser());

//--------------------
//     SIGNUP
//--------------------

router.get('/signup', userController.getSignup);

router.post(
  '/signup',
  check('email').isEmail(),
  check('password').isLength({ min: 6 }),
  check('name').notEmpty(),
  userController.postSignup
);

//--------------------
//     LOGIN
//--------------------

router.get('/login', csrfProtection, userController.getLogin);

router.post('/login', userController.postLogin);

//--------------------
//     LOGOUT
//--------------------

router.get('/logout', userController.logout);

module.exports = router;
