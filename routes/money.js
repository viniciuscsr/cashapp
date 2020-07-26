const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middlewares/index');
const moneyController = require('../controllers/moneyController');

// -----------------
// DASHBOARD
// -----------------

router.get('/', isLoggedIn, moneyController.dashboard);

// -----------------
// TRANSFER MONEY TO A USER
// -----------------

router.get('/transfer/new', isLoggedIn, moneyController.getTransfer);

router.post('/transfer', isLoggedIn, moneyController.postTransfer);

// -----------------
// REQUEST MONEY FROM A USER
// -----------------

router.get('/request/new', isLoggedIn, moneyController.getRequestMoney);

router.post('/request', isLoggedIn, moneyController.postRequestMoney);

// -----------------
// ADD FUNDS
// -----------------

router.get('/add-funds/new', isLoggedIn, moneyController.getAddFunds);

router.post('/add-funds', isLoggedIn, moneyController.postAddFunds);

// -----------------
// CASH OUT
// -----------------

router.get('/cashout/new', isLoggedIn, moneyController.getCashout);

router.post('/cashout', isLoggedIn, moneyController.postCashout);

module.exports = router;
