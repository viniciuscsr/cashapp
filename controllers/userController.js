const userController = {};
const { validationResult } = require('express-validator');
const pool = require('../db');
const bcrypt = require('bcrypt');

//--------------------
//     SIGNUP
//--------------------

userController.getSignup = (req, res) => {
  res.render('users/signup', {
    error_message: req.flash('error')[0],
  });
};

userController.postSignup = async (req, res) => {
  // DATA VALIDATION

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // console.log(errors.array());
    // req.flash('error', errors.array());
    return res.status(422).json({ errors: errors.array() });
  }

  const { name, email, password, confirmPassword } = req.body;

  // CHECK IF EMAIL IS UNIQUE

  try {
    const emailUnique = await pool.query(
      'SELECT email FROM users WHERE email=$1',
      [email]
    );
    if (emailUnique.rows[0]) {
      req.flash('error', 'Email already being used');
      return res.redirect('/users/signup');
    }
  } catch (err) {
    console.log(err);
  }

  // PASSWORD MATCH
  try {
    if (password !== confirmPassword) {
      req.flash('error', 'Passwords must match. Please try again');
      return res.redirect('signup/');
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
};

//--------------------
//     LOGIN
//--------------------

userController.getLogin = (req, res) => {
  res.render('users/login', {
    csrfToken: req.csrfToken(),
    error_message: req.flash('error')[0],
  });
};

userController.postLogin = async (req, res) => {
  const { email, password } = req.body;

  // FINDING EMAIL IN THE DB
  let result;
  try {
    result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
  } catch (err) {
    console.log(err);
  }

  if (!result.rows[0]) {
    req.flash('error', 'Email not Found');
    return res.redirect('/users/login');
  }

  if (!bcrypt.compareSync(password, result.rows[0].password)) {
    req.flash('error', 'Wrong Password. Try again.');
    return res.redirect('/users/login');
  }

  // adding the user ID to the cookie in the response header
  req.cashAppSession.userId = result.rows[0].id;

  res.redirect('/money');
};

//--------------------
//     LOGOUT
//--------------------

userController.logout = (req, res) => {
  if (req.cookies.cashAppSession) {
    res.clearCookie('cashAppSession');
    req.flash('sucess', 'Logged Out');
    res.redirect('/');
  } else {
    req.flash('sucess', 'No user logged in');
    res.redirect('/');
  }
};

module.exports = userController;
