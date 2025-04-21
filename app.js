const express = require("express");
const mongoose = require("mongoose");
const app = express();
const Listing = require("./models/listing"); // Import the Listing model
const path = require("path");
const methodOverride = require("method-override");

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

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Index route to render the homepage
app.get("/listings", async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index", { allListings }); // Corrected path
});

// New route to render the form for creating a new listing
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs"); // Corrected path
});

// show route to render a single listing
app.get("/listings/:id", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing }); // Corrected path
});

// Create route to handle form submission and create a new listing
app.post("/listings", async (req, res) => {
  const newListing = new Listing(req.body.listing); // Create a new listing using the request body
  await newListing.save(); // Save the listing to the database
  res.redirect("/listings"); // Redirect to the listings page after saving
});

// Edit route to render the form for editing a listing
app.get("/listings/:id/edit", async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id); // Find the listing by ID
  res.render("listings/edit.ejs", { listing }); // Corrected path
});

// Update route to handle form submission and update a listing
app.put("/listings/:id", async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
});

// Delete route to handle deleting a listing
app.delete("/listings/:id", async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndDelete(id); // Find the listing by ID and delete it
  res.redirect("/listings"); // Redirect to the listings page after deletion
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

// Port 8080 pe server run ho raha hai, isliye 8080 ka message chahiye
app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
