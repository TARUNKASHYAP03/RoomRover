const express = require("express");
const mongoose = require("mongoose");
const app = express();
const Listing = require("./models/listing"); // Import the Listing model
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); // Import ejs-mate for layout support
const { listingSchema, reviewSchema } = require("./schema.js"); // Import the listing schema
const Review = require("./models/review"); // Import the Review model
const session = require("express-session");
const flash = require("connect-flash"); // Import connect-flash
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js"); // Import the User model
const { isLoggedIn } = require("./middleware.js"); // Import the isLoggedIn middleware

const userRoutes = require("./routes/user.js"); // Import user routes

const mongo_url = "mongodb://127.0.0.1:27017/RoomRover";

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

// MongoDB connection function
async function main() {
  await mongoose.connect(mongo_url);
}

app.set("view engine", "ejs"); // Set EJS as the view engine
app.set("views", path.join(__dirname, "views")); // Set the views directory
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded data
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate); // Use ejs-mate for EJS layout support
app.use(express.static(path.join(__dirname, "public")));

const sessionOptions = {
  secret: "thisshouldbeasecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Middleware to set flash messages in res.locals
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", userRoutes); // Use user routes

app.get("/register", async (req, res) => {
    let fakeUser = new User({ email: "student02@gmail.com", username: "demostudent" });
    let registerUser = await User.register(fakeUser, "hello"); // Register the user
    res.send(registerUser); // Send the registered user as a response
});

const validatelisting = (req, res, next) => {
  const { error } = listingSchema.validate(req.body); // Validate the request body against the schema
  if (error) {
    console.log(error);
    return res.status(400).send("Invalid data");
  } else {
    next();
  } // Proceed to the next middleware if validation passes
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body); // Validate the request body against the review schema
  if (error) {
    console.log(error);
    return res.status(400).send("Invalid data");
  } else {
    next();
  } // Proceed to the next middleware if validation passes
};
// Middleware to log the request method and URL

app.get("/", (req, res) => {
  res.redirect("/listings");
});

// Index route to render the homepage
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index", { allListings }); // Corrected path
});

// New route to render the form for creating a new listing
app.get("/listings/new",isLoggedIn, (req, res) => {
  res.render("listings/new.ejs"); // Corrected path
});

// show route to render a single listing
app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id).populate("reviews"); // Find the listing by ID and populate the reviews
  res.render("listings/show.ejs", { listing }); // Corrected path
});

// Create route to handle form submission and create a new listing
app.post("/listings", async (req, res) => {
  const newListing = new Listing(req.body.listing); // Create a new listing using the request body
  await newListing.save(); // Save the listing to the database
  req.flash("success", "Listing created successfully!"); // Flash success message
  res.redirect("/listings"); // Redirect to the listings page after saving
});

// Edit route to render the form for editing a listing
app.get("/listings/:id/edit", isLoggedIn, async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id); // Find the listing by ID
  res.render("listings/edit.ejs", { listing }); // Corrected path
});

// Update route to handle form submission and update a listing
app.put("/listings/:id", isLoggedIn, async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
});

// Delete route to handle deleting a listing
app.delete("/listings/:id", async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id); // Find the listing by ID and delete it
  req.flash("success", "Listing deleted successfu3lly!"); // Flash success message
  res.redirect("/listings"); // Redirect to the listings page after deletion
});

// Reviews routes
app.post("/listings/:id/reviews", validateReview, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  const review = new Review(req.body.review); // Create a new review using the request body
  listing.reviews.push(review); // Add the review to the listing's reviews array
  await review.save(); // Save the review to the database
  await listing.save(); // Save the updated listing to the database
  req.flash("success", "Review added successfully!"); // Flash success message
  res.redirect(`/listings/${id}`); // Redirect to the listing's page after saving
});

// Delete route to handle deleting a review
app.delete("/listings/:id/reviews/:reviewId", async (req, res) => {
  const { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } }); // Remove the review from the listing's reviews array
  await Review.findByIdAndDelete(reviewId); // Delete the review from the database
  res.redirect(`/listings/${id}`); // Redirect to the listing's page after deletion
});

// app.get("/testlisting", async (req, res) => {
//   let sampleListing = new Listing({
//     title: "Sample Listing",
//     description: "This is a sample listing.",
//     price: 100,
//     location: "Sample Location",
//     country: ["India"],
//   });
//   await sampleListing.save();
//   console.log("Sample listing saved:", sampleListing);
//   res.send("Sample listing saved successfully!");
// });

// Catch-all route for non-existent pages
app.use((req, res, next) => {
  res.status(404).render("error.ejs", { message: "Page Not Found!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const { statuscode = 500, message = "Something went wrong!" } = err;
  res.status(statuscode).render("error.ejs", { message });
});

// Port 8080 pe server run ho raha hai, isliye 8080 ka message chahiye
app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
