function isLoggedIn(req, res, next) {
  if (!req.user) {
    return res.redirect('/users/login');
  }
  next();
}

module.exports = isLoggedIn;
