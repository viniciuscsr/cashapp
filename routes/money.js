const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/index');
const pool = require('../db');
const requestMoneyEmail = require('../email/nodemailer');

// -----------------
// DASHBOARD
// -----------------

router.get('/', isLoggedIn, async (req, res) => {
  let balance;
  try {
    balance = await pool.query('SELECT balance FROM balance WHERE user_id=$1', [
      req.user.id,
    ]);
  } catch (err) {
    console.log(err);
  }

  let transactions;
  try {
    transactions = await pool.query(
      'SELECT * FROM transactions WHERE sender_id=$1 OR recipient_id=$1',
      [req.user.id]
    );
  } catch (err) {
    console.log(err);
  }

  res.render('money/dashboard', {
    balance: balance.rows[0].balance,
    transactions: transactions.rows,
  });
});

// -----------------
// TRANSFER MONEY TO A USER
// -----------------

router.get('/transfer/new', isLoggedIn, (req, res) => {
  res.render('money/transfer');
});

router.post('/transfer', isLoggedIn, async (req, res) => {
  let { email, amount } = req.body;
  const sender_id = req.user.id;

  amount = parseFloat(amount);

  // getting recipient user id with the email
  const recipient_id = await pool.query('SELECT id FROM users WHERE email=$1', [
    email,
  ]);
  if (!recipient_id.rows[0].id) {
    return res.json('User not Registered');
  }

  // getting current balance and calculating final balance
  const senderCurrentBalance = await pool.query(
    'SELECT balance FROM balance WHERE user_id=$1',
    [sender_id]
  );
  const recipientCurrentBalance = await pool.query(
    'SELECT balance FROM balance WHERE user_id=$1',
    [recipient_id]
  );

  console.log(typeof amount);

  const senderFinalBalance = senderCurrentBalance.rows[0].balance - amount;

  const recipientFinalBalance =
    recipientCurrentBalance.rows[0].balance + amount;

  // checking if sender has enough funds
  if (senderFinalBalance < 0) {
    res.json({ message: 'Sender does not have enough funds' });
    return;
  }

  pool.query('BEGIN', (err) => {
    if (err) {
      console.log(err);
    }
    // adding transaction to transactions table
    pool.query(
      'INSERT INTO transactions (sender_id, recipient_id, amount) VALUES ($1, $2, $3)',
      [sender_id, recipient_id, amount],
      (err) => {
        if (err) {
          console.log(err);
        }
        // adding amount to recipient balance
        pool.query(
          'UPDATE balance SET balance=$1 WHERE user_id=$2',
          [recipientFinalBalance, recipient_id],
          (err) => {
            if (err) {
              console.log(err);
            }
            // subtracking amount from the sender balance
            pool.query(
              'UPDATE balance SET balance=$1 WHERE user_id=$2',
              [senderFinalBalance, sender_id],
              (err) => {
                if (err) {
                  console.log(err);
                }
                pool.query('COMMIT', (err) => {
                  if (err) {
                    console.log(err);
                  }
                  res.json({ message: 'Transfer Completed' });
                });
              }
            );
          }
        );
      }
    );
  });
});

// -----------------
// REQUEST MONEY FROM A USER
// -----------------

router.get('/request/new', isLoggedIn, (req, res) => {
  res.render('money/request');
});

router.post('/request', isLoggedIn, async (req, res) => {
  let { email, amount } = req.body;

  amount = parseFloat(amount);

  let requesteeData;
  try {
    requesteeData = await pool.query('SELECT * FROM users WHERE email=$1', [
      email,
    ]);

    if (!requesteeData.rows[0]) {
      res.json({ message: 'User not found' });
      return;
    }
  } catch (err) {
    console.log(err);
  }

  let requestorData;
  try {
    requestorData = await pool.query('SELECT * FROM users WHERE id=$1', [
      req.user.id,
    ]);
  } catch (err) {
    console.log(err);
  }

  try {
    await requestMoneyEmail(
      requesteeData.rows[0].name,
      requesteeData.rows[0].email,
      requestorData.rows[0].name,
      amount
    );
    res.json({ message: 'Request was sent' });
  } catch (err) {
    console.log(err);
  }
});

// -----------------
// ADD FUNDS
// -----------------

router.get('/add-funds/new', isLoggedIn, (req, res) => {
  res.render('money/addFunds');
});

router.post('/add-funds', isLoggedIn, async (req, res) => {
  let { bank_id, amount } = req.body;
  const userId = req.user.id;

  amount = parseFloat(amount);

  const userCurrentBalance = await pool.query(
    'SELECT balance FROM balance WHERE user_id=$1',
    [userId]
  );
  const userFinalBalance = userCurrentBalance.rows[0].balance + amount;

  console.log('Final Balance');
  console.log(typeof userFinalBalance);
  console.log(userFinalBalance);
  console.log('Current Balance');
  console.log(typeof userCurrentBalance.rows[0].balance);
  console.log(userCurrentBalance.rows[0].balance);
  console.log('Amount');
  console.log(typeof amount);
  console.log(amount);

  pool.query('BEGIN', (err) => {
    if (err) {
      console.log(err);
    }
    // add transaction to add_funds table
    pool.query(
      'INSERT INTO add_funds (user_id, bank_id, amount) VALUES ($1, $2, $3)',
      [userId, bank_id, amount],
      (err) => {
        if (err) {
          console.log(err);
        }
        // add amount to the user account
        pool.query(
          'UPDATE balance SET balance=$1 WHERE user_id=$2',
          [userFinalBalance, userId],
          (err) => {
            if (err) {
              console.log(err);
            }
            pool.query('COMMIT', (err) => {
              if (err) {
                console.log(err);
              }
              res.json({ message: 'Funds Added' });
            });
          }
        );
      }
    );
  });
});

// -----------------
// CASH OUT
// -----------------

router.get('/cashout/new', isLoggedIn, (req, res) => {
  res.render('money/cashout');
});

router.post('/cashout', isLoggedIn, async (req, res) => {
  let { bank_id, amount } = req.body;
  const userId = req.user.id;

  amount = parseFloat(amount);

  const userCurrentBalance = await pool.query(
    'SELECT balance FROM balance WHERE user_id=$1',
    [userId]
  );

  const userFinalBalance = userCurrentBalance.rows[0].balance - amount;

  if (userFinalBalance < 0) {
    res.json({ message: 'User does not have enough funds' });
    return;
  }

  pool.query('BEGIN', (err) => {
    if (err) {
      console.log(err);
    }
    // add transaction to the cash_out table
    pool.query(
      'INSERT INTO cash_out (user_id, bank_id, amount) VALUES ($1, $2, $3)',
      [userId, bank_id, amount],
      (err) => {
        if (err) {
          console.log(err);
        }
        // subtrack amount from the user account
        pool.query(
          'UPDATE balance SET balance=$1 WHERE user_id=$2',
          [userFinalBalance, userId],
          (err) => {
            if (err) {
              console.log(err);
            }
            pool.query('COMMIT', (err) => {
              if (err) {
                console.log(err);
              }
              res.json({ message: 'Cashed Out' });
            });
          }
        );
      }
    );
  });
});

module.exports = router;
