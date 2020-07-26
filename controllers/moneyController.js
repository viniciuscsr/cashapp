const moneyController = {};

const pool = require('../db');
const requestMoneyEmail = require('../email/nodemailer');

// -----------------
// DASHBOARD
// -----------------

moneyController.dashboard = async (req, res) => {
  let balance;
  try {
    balance = await pool.query('SELECT balance FROM balance WHERE user_id=$1', [
      req.user.id,
    ]);
  } catch (err) {
    console.log(err);
  }

  // User to user transactions
  let transactions;
  try {
    transactions = await pool.query(
      'SELECT * FROM transactions WHERE sender_id=$1 OR recipient_id=$1',
      [req.user.id]
    );
  } catch (err) {
    console.log(err);
  }

  // cashout transactions
  let cashoutTransactions;
  try {
    cashoutTransactions = await pool.query(
      'SELECT * FROM cash_out WHERE user_id=$1',
      [req.user.id]
    );
  } catch (err) {
    console.log(err);
  }

  // add funds transactions
  let addFundsTransactions;
  try {
    addFundsTransactions = await pool.query(
      'SELECT * FROM add_funds WHERE user_id=$1',
      [req.user.id]
    );
  } catch (err) {
    console.log(err);
  }

  res.render('money/dashboard', {
    balance: balance.rows[0].balance,
    transactions: transactions.rows,
    addFundsTransactions: addFundsTransactions.rows,
    cashoutTransactions: cashoutTransactions.rows,
    sucess_message: req.flash('sucess')[0],
  });
};

// -----------------
// TRANSFER MONEY TO A USER
// -----------------

moneyController.getTransfer = (req, res) => {
  res.render('money/transfer', { error_message: req.flash('error')[0] });
};

moneyController.postTransfer = async (req, res) => {
  let { email, amount } = req.body;
  const sender_id = req.user.id;

  amount = parseFloat(amount);

  // getting recipient user id with the email
  const recipient_id = await pool.query('SELECT id FROM users WHERE email=$1', [
    email,
  ]);

  if (!recipient_id.rows[0]) {
    req.flash('error', 'User not Registered');
    return res.redirect('transfer/new');
  }

  // getting current balance and calculating final balance
  const senderCurrentBalance = await pool.query(
    'SELECT balance FROM balance WHERE user_id=$1',
    [sender_id]
  );
  const recipientCurrentBalance = await pool.query(
    'SELECT balance FROM balance WHERE user_id=$1',
    [recipient_id.rows[0].id]
  );

  const senderFinalBalance = senderCurrentBalance.rows[0].balance - amount;

  const recipientFinalBalance =
    recipientCurrentBalance.rows[0].balance + amount;

  // checking if sender has enough funds
  if (senderFinalBalance < 0) {
    req.flash('error', "You don't have enough funds");
    return res.redirect('transfer/new');
  }

  pool.query('BEGIN', (err) => {
    if (err) {
      console.log(err);
    }
    // adding transaction to transactions table
    pool.query(
      'INSERT INTO transactions (sender_id, recipient_id, amount) VALUES ($1, $2, $3)',
      [sender_id, recipient_id.rows[0].id, amount],
      (err) => {
        if (err) {
          console.log(err);
        }
        // adding amount to recipient balance
        pool.query(
          'UPDATE balance SET balance=$1 WHERE user_id=$2',
          [recipientFinalBalance, recipient_id.rows[0].id],
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
                  req.flash('sucess', 'Transfer Completed');
                  res.redirect('/money/');
                });
              }
            );
          }
        );
      }
    );
  });
};

// -----------------
// REQUEST MONEY FROM A USER
// -----------------

moneyController.getRequestMoney = (req, res) => {
  res.render('money/request', { error_message: req.flash('error')[0] });
};

moneyController.postRequestMoney = async (req, res) => {
  let { email, amount } = req.body;

  amount = parseFloat(amount);

  let requesteeData;
  try {
    requesteeData = await pool.query('SELECT * FROM users WHERE email=$1', [
      email,
    ]);

    if (!requesteeData.rows[0]) {
      req.flash('error', 'User not Found');
      return res.redirect('request/new');
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
    req.flash('sucess', "Your request was sent to the user's email");
    res.redirect('/money/');
  } catch (err) {
    console.log(err);
  }
};

// -----------------
// ADD FUNDS
// -----------------

moneyController.getAddFunds = (req, res) => {
  res.render('money/addFunds');
};

moneyController.postAddFunds = async (req, res) => {
  let { bank_id, amount } = req.body;
  const userId = req.user.id;

  amount = parseFloat(amount);

  const userCurrentBalance = await pool.query(
    'SELECT balance FROM balance WHERE user_id=$1',
    [userId]
  );
  const userFinalBalance = userCurrentBalance.rows[0].balance + amount;

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
              req.flash('sucess', 'Funds added sucessfully');
              res.redirect('/money/');
            });
          }
        );
      }
    );
  });
};

// -----------------
// CASH OUT
// -----------------

moneyController.getCashout = (req, res) => {
  res.render('money/cashout', { error_message: req.flash('error')[0] });
};

moneyController.postCashout = async (req, res) => {
  let { bank_id, amount } = req.body;
  const userId = req.user.id;

  amount = parseFloat(amount);

  const userCurrentBalance = await pool.query(
    'SELECT balance FROM balance WHERE user_id=$1',
    [userId]
  );

  const userFinalBalance = userCurrentBalance.rows[0].balance - amount;

  if (userFinalBalance < 0) {
    req.flash('error', 'User does not have enough funds');
    return res.redirect('cashout/new');
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
              req.flash('sucess', 'Money was withdrawn sucessfully');
              res.redirect('/money/');
            });
          }
        );
      }
    );
  });
};

module.exports = moneyController;
