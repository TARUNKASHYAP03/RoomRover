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
const crypto = require("crypto"); // Add this at the top with other requires
const Booking = require("./models/booking"); // Add at the top

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

const sessionSecret = crypto.randomBytes(32).toString("hex"); // Generate a new secret on each server start

const sessionOptions = {
  secret: sessionSecret, // Use the random secret
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

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  next();
});

// Middleware to set flash messages in res.locals
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.use("/", userRoutes); // Use user routes

// app.get("/register", (req, res) => {
//     res.render("users/register"); // Make sure you have a users/register.ejs form
// });

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
  const { category, minPrice, maxPrice, location } = req.query;
  let filter = {};

  if (category) filter.category = category;
  if (location) filter.location = new RegExp(location, "i");
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const allListings = await Listing.find(filter);
  res.render("listings/index", { allListings, filters: req.query });
});

// New route to render the form for creating a new listing
app.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs"); // Corrected path
});

// show route to render a single listing
app.get("/listings/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id)
      .populate("owner")
      .populate({
        path: "reviews",
        populate: { path: "author", select: "username" }
      });
    if (!listing) {
      // Listing not found
      return res.status(404).render("error.ejs", { message: "Listing not found!" });
    }
    res.render("listings/show.ejs", { listing });
  } catch (err) {
    next(err);
  }
});

// Protect create, edit, update, and delete listing routes with isLoggedIn middleware

// Create route to handle form submission and create a new listing
app.post("/listings", isLoggedIn, async (req, res) => {
  const newListing = new Listing(req.body.listing); // Create a new listing using the request body
  newListing.owner = req.user._id; // Set the owner of the listing to the current user
  await newListing.save(); // Save the listing to the database
  req.flash("success", "Listing created successfully!"); // Flash success message
  res.redirect("/listings"); // Redirect to the listings page after saving
});

// Place isOwner middleware BEFORE any route that uses it
const isOwner = async (req, res, next) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  if (!req.user || !listing.owner.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// Edit route to render the form for editing a listing
app.get("/listings/:id/edit", isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
});

app.put("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
});

// Delete route to handle deleting a listing
app.delete("/listings/:id", isLoggedIn, isOwner, async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id);
  req.flash("success", "Listing deleted successfully!");
  res.redirect("/listings");
});

// Middleware to check if the current user is the author of the review
const isReviewAuthor = async (req, res, next) => {
  const { reviewId, id } = req.params;
  const review = await Review.findById(reviewId);
  if (!review || !review.author) {
    req.flash("error", "Review not found!");
    return res.redirect(`/listings/${id}`);
  }
  if (!req.user || !review.author || !review.author.equals || !review.author.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that");
    return res.redirect("back");
  }
  next();
};

// Reviews routes
app.post("/listings/:id/reviews", isLoggedIn, validateReview, async (req, res) => {
  const { id } = req.params;
  const listing = await Listing.findById(id);
  const review = new Review(req.body.review);
  review.author = req.user._id;
  listing.reviews.push(review);
  await review.save();
  await listing.save();
  req.flash("success", "Review added successfully!");
  res.redirect(`/listings/${id}`);
});

// Delete route to handle deleting a review
app.delete("/listings/:id/reviews/:reviewId", isLoggedIn, isReviewAuthor, async (req, res) => {
  const { id, reviewId } = req.params;
  await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  req.flash("success", "Review deleted successfully!");
  res.redirect(`/listings/${id}`);
});

// Example Express route
app.get('/profile', (req, res) => {
  if (!req.user) return res.redirect('/login');
  res.render('profile', { currentUser: req.user });
});

// Booking POST route
app.post("/listings/:id/book", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate, guests } = req.body;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found.");
    return res.redirect(`/listings/${id}`);
  }

  // Backend validation for dates
  const today = new Date();
  today.setHours(0,0,0,0);
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start) || isNaN(end) || start < today || end <= start) {
    return res.render("listings/show.ejs", { listing, error: "Invalid dates. Check-in must be today or later, and check-out must be after check-in." });
  }

  // Prevent overlapping bookings
  const overlapping = await Booking.findOne({
    listing: id,
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } }
    ]
  });
  if (overlapping) {
    return res.render("listings/show.ejs", { listing, error: "Selected dates are not available. Please choose different dates." });
  }
  const booking = new Booking({
    listing: id,
    user: req.user._id,
    startDate,
    endDate,
    guests
  });
  await booking.save();
  res.redirect(`/bookings/${booking._id}/confirmation`);
});

// Booking confirmation page
app.get("/bookings/:bookingId/confirmation", isLoggedIn, async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId).populate("listing");
  if (!booking) {
    req.flash("error", "Booking not found.");
    return res.redirect("/listings");
  }
  res.render("bookings/confirmation", { booking });
});

// New route to render the user's trips
app.get("/trips", isLoggedIn, async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ startDate: -1 });
    res.render("trips/index.ejs", { bookings });
  } catch (err) {
    next(err);
  }
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

// Delete route to handle deleting a booking
app.delete("/bookings/:id", isLoggedIn, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found." });
    }
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    await Booking.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "Booking cancelled" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// Simple chatbot route (no login required)
app.post("/chatbot", express.json(), (req, res) => {
  const { message } = req.body;
  let reply = "Sorry, I didn't understand that.";

  if (!message) {
    reply = "Please enter a message.";
  } else if (message.toLowerCase().includes("hello")) {
    reply = `Hello! How can I help you today?`;
  } else if (message.toLowerCase().includes("booking")) {
    reply = "You can view your bookings on the Trips page or create a new booking from any listing.";
  } else if (message.toLowerCase().includes("help")) {
    reply = "I'm here to help! You can ask about listings, bookings, or your account.";
  }

  res.json({ reply });
});
