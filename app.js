const express = require("express");
const mongoose = require("mongoose");
const app = express();
const Listing = require("./models/listing"); // Import the Listing model

const mongo_url = "mongodb://127.0.0.1:27017/RoomRover";

// MongoDB connection function
async function main() {
  await mongoose.connect(mongo_url);
}

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/testlisting", async (req, res) => {
  let sampleListing = new Listing({
    title: "Sample Listing",
    description: "This is a sample listing.",
    price: 100,
    location: "Sample Location",
    country: ["India"],
  });
  await sampleListing.save();
  console.log("Sample listing saved:", sampleListing);
  res.send("Sample listing saved successfully!");
});

// Port 8080 pe server run ho raha hai, isliye 8080 ka message chahiye
app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
