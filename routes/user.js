const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");

// Show signup form
router.get("/signup", (req, res) => {
  res.render("users/signup.ejs", { error: null, success: null });
});

// Handle signup form submission
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.render("users/signup.ejs", { error: "All fields are required.", success: null });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.render("users/signup.ejs", { error: "Email is already registered.", success: null });
    }

    const newUser = new User({ username, email });
    const registeredUser = await User.register(newUser, password);

    return res.render("users/signup.ejs", { success: "Signup successful! You can now log in.", error: null });

  } catch (err) {
    if (err.name === "UserExistsError") {
      return res.render("users/signup.ejs", { error: "Username already exists. Try a different one.", success: null });
    }
    return res.render("users/signup.ejs", { error: "Something went wrong. Please try again later.", success: null });
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      req.flash("success", "Welcome to RoomRover!");
      res.redirect("/listings");
    });
  } catch (e) {
    req.flash("error", e.message);
    res.redirect("/register");
  }
});

router.get("/login", (req, res) => {
  res.render("users/login.ejs", { error: null, success: null });
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err); // Pass any errors to the next middleware
    }
    if (!user) {
      return res.render("users/login.ejs", { error: "Invalid username or password.", success: null });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err); // Pass any errors to the next middleware
      }
      req.flash("success", "Welcome back!"); // Flash success message
      return res.redirect("/listings"); // Redirect to the listings page after successful login
    });
  })(req, res, next);
});

router.get("/logout", (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.flash("success", "Goodbye!");
    res.redirect("/listings");
  });
});

module.exports = router;
