const mongoose = require("mongoose");
const initdata = require("./data.js"); // Assuming data.js is in the same directory
const Listing = require("../models/listing.js"); // Assuming listing.js is in the models directory

const mongo_url = "mongodb://127.0.0.1:27017/RoomRover";

// MongoDB connection function
async function main() {
  await mongoose.connect(mongo_url);
}

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.log(err));

const initDB = async () => {
  // Clear the database before seeding
  await Listing.deleteMany({});

  // Add owner to each listing
  const listingsWithOwner = initdata.data.map((obj) => ({
    ...obj,
    owner: "6834aa4cc14dcd7176fae4ab",
  }));

  // Seed the database with initial data
  await Listing.insertMany(listingsWithOwner);
  console.log("Database seeded successfully!");
};

initDB();
