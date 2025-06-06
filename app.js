// Environment variables setup
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// Dependencies
const express = require("express");
const serverless = require("serverless-http");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const multer = require("multer");
const sharp = require("sharp");
const crypto = require("crypto");

// Models
const Listing = require("./models/listing");
const Review = require("./models/review");
const User = require("./models/user");
const Booking = require("./models/booking");

// Configurations
const { listingSchema, reviewSchema } = require("./schema.js");
const { cloudinary, storage } = require("./cloudConfig.js");
const { isLoggedIn, isAdmin } = require("./middleware.js");

// Routes
const userRoutes = require("./routes/user.js");

// Initialize Express
const app = express();

// Database connection
const mongo_url = process.env.ATLAS_URI || "mongodb://localhost:27017/RoomRover";

async function main() {
  try {
    await mongoose.connect(mongo_url, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

// Database connection events
mongoose.connection.on('connected', () => console.log('Mongoose connected'));
mongoose.connection.on('error', err => console.log('Mongoose error:', err));
mongoose.connection.on('disconnected', () => console.log('Mongoose disconnected'));

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Mongoose connection closed due to app termination');
  process.exit(0);
});

// Initialize database connection
main().catch(err => console.log(err));

// App configuration
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// File upload configuration
const upload = multer({ storage });

// Session configuration
const sessionSecret = process.env.SECRET || crypto.randomBytes(32).toString('hex');

const store = MongoStore.create({
  mongoUrl: mongo_url,
  crypto: {
    secret: sessionSecret,
  },
  touchAfter: 24 * 3600,
  collectionName: "sessions",
});

store.on("error", function (error) {
  console.log("Session store error:", error);
});

const sessionOptions = {
  store,
  name: "roomrover_session",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
    sameSite: "lax"
  }
};

app.use(session(sessionOptions));
app.use(flash());

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Local variables middleware
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// Validation middleware
const validateListing = (req, res, next) => {
  const { error } = listingSchema.validate(req.body);
  if (error) {
    req.flash("error", "Invalid listing data");
    return res.redirect("back");
  }
  next();
};

const validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    req.flash("error", "Invalid review data");
    return res.redirect("back");
  }
  next();
};

// Routes
app.use("/", userRoutes);

// Home route
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// Listings routes
app.get("/listings", async (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, guests } = req.query;
    let filter = {};

    if (q) {
      filter.$or = [
        { location: { $regex: q, $options: "i" } },
        { title: { $regex: q, $options: "i" } },
      ];
    }
    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (guests) filter.guests = { $gte: Number(guests) };

    const allListings = await Listing.find(filter);
    res.render("listings/index.ejs", { allListings, filters: req.query });
  } catch (err) {
    req.flash("error", "Failed to load listings");
    res.redirect("back");
  }
});

app.get("/listings/new", isLoggedIn, (req, res) => {
  res.render("listings/new.ejs");
});

app.post("/listings", isLoggedIn, upload.single("image"), async (req, res) => {
  try {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;

    if (req.file) {
      newListing.image = req.file.path;
    }

    await newListing.save();
    req.flash("success", "Listing created successfully!");
    res.redirect("/listings");
  } catch (err) {
    req.flash("error", "Failed to create listing");
    res.redirect("back");
  }
});

app.get("/listings/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("owner")
      .populate({
        path: "reviews",
        populate: { path: "author", select: "username" },
      });

    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    res.render("listings/show.ejs", { listing });
  } catch (err) {
    req.flash("error", "Failed to load listing");
    res.redirect("back");
  }
});

app.get("/listings/:id/edit", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }
    res.render("listings/edit.ejs", { listing });
  } catch (err) {
    req.flash("error", "Failed to load listing");
    res.redirect("back");
  }
});

app.put("/listings/:id", isLoggedIn, isAdmin, upload.single("image"), async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    Object.assign(listing, req.body.listing);
    if (req.file) listing.image = req.file.path;

    await listing.save();
    req.flash("success", "Listing updated successfully!");
    res.redirect(`/listings/${req.params.id}`);
  } catch (err) {
    req.flash("error", "Failed to update listing");
    res.redirect("back");
  }
});

app.delete("/listings/:id", isLoggedIn, isAdmin, async (req, res) => {
  try {
    await Listing.findByIdAndDelete(req.params.id);
    req.flash("success", "Listing deleted successfully!");
    res.redirect("/listings");
  } catch (err) {
    req.flash("error", "Failed to delete listing");
    res.redirect("back");
  }
});

// Reviews routes
app.post("/listings/:id/reviews", isLoggedIn, validateReview, async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    const review = new Review(req.body.review);
    review.author = req.user._id;
    listing.reviews.push(review);
    await review.save();
    await listing.save();
    req.flash("success", "Review added successfully!");
    res.redirect(`/listings/${req.params.id}`);
  } catch (err) {
    req.flash("error", "Failed to add review");
    res.redirect("back");
  }
});

app.delete("/listings/:id/reviews/:reviewId", isLoggedIn, async (req, res) => {
  try {
    await Listing.findByIdAndUpdate(req.params.id, { $pull: { reviews: req.params.reviewId } });
    await Review.findByIdAndDelete(req.params.reviewId);
    req.flash("success", "Review deleted successfully!");
    res.redirect(`/listings/${req.params.id}`);
  } catch (err) {
    req.flash("error", "Failed to delete review");
    res.redirect("back");
  }
});

// Booking routes
app.post("/listings/:id/book", isLoggedIn, async (req, res) => {
  try {
    const { startDate, endDate, guests } = req.body;
    const listing = await Listing.findById(req.params.id);
    
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end) || start < today || end <= start) {
      req.flash("error", "Invalid dates");
      return res.redirect(`/listings/${req.params.id}`);
    }

    const overlapping = await Booking.findOne({
      listing: req.params.id,
      $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
    });

    if (overlapping) {
      req.flash("error", "Selected dates are not available");
      return res.redirect(`/listings/${req.params.id}`);
    }

    const booking = new Booking({
      listing: req.params.id,
      user: req.user._id,
      startDate,
      endDate,
      guests,
    });

    await booking.save();
    res.redirect(`/bookings/${booking._id}/confirmation`);
  } catch (err) {
    req.flash("error", "Failed to create booking");
    res.redirect("back");
  }
});

app.get("/bookings/:bookingId/confirmation", isLoggedIn, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("listing");
    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/listings");
    }
    res.render("bookings/confirmation", { booking });
  } catch (err) {
    req.flash("error", "Failed to load booking");
    res.redirect("back");
  }
});

// Profile route (add this with your other routes)
app.get('/profile', isLoggedIn, (req, res) => {
  try {
    res.render('profile', { currentUser: req.user });
  } catch (err) {
    console.error("Profile render error:", err);
    res.status(500).send("Something went wrong");
  }
});

app.get("/trips", isLoggedIn, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ startDate: -1 });
    res.render("trips/index.ejs", { bookings });
  } catch (err) {
    req.flash("error", "Failed to load trips");
    res.redirect("back");
  }
});

app.delete("/bookings/:id", isLoggedIn, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
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

// Admin route
app.get("/makeadmin/:userid", isLoggedIn, isAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.userid, { isAdmin: true });
    req.flash("success", "User promoted to admin");
    res.redirect("back");
  } catch (err) {
    req.flash("error", "Failed to update user");
    res.redirect("back");
  }
});

// Chatbot route
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

// Error handlers
app.use((req, res) => {
  res.status(404).render("error.ejs", { message: "Page Not Found!" });
});

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error(err);
  res.status(500).render("error.ejs", { message: "Something went wrong!" });
});

// Server setup
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports.handler = serverless(app);