module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must be signed in first!"); // Flash error message
    return res.redirect("/login"); // Redirect to the login page if not authenticated
  }
  next(); // Proceed to the next middleware if authenticated
} 