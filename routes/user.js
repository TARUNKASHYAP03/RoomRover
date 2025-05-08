const express = require("express");
const router = express.Router();
const User = require("../models/user.js");

router.get("/signup", (req, res) => {
  res.render("users/signup.ejs", { error: null, success: null });
});

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
    console.log("Registered user:", registeredUser);

    // Redirect after successful signup (or send a success message to the view)
    return res.render("users/signup.ejs", { success: "Signup successful! You can now log in.", error: null });

  } catch (err) {
    console.error("Signup error:", err);
    if (err.name === "UserExistsError") {
      return res.render("users/signup.ejs", { error: "Username already exists. Try a different one.", success: null });
    }
    return res.render("users/signup.ejs", { error: "Something went wrong. Please try again later.", success: null });
  }
});

module.exports = router;
