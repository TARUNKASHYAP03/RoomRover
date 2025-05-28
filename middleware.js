module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be signed in!");
    return res.redirect("/login");
  }
  next();
};

module.exports.isAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    req.flash("error", "Admin access required.");
    return res.redirect("/listings");
  }
  next();
};