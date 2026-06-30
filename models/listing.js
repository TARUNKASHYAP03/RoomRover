const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: mongoose.Schema.Types.Mixed,
  price: { type: Number, required: true },
  location: { type: String, required: true },
  country: { type: String, required: true },
  category: {
    type: String,
    enum: ["Beach", "Mountain", "City", "Countryside", "Apartment", "Villa"],
    default: null,
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review"
    }
  ],
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },

}, { timestamps: true });

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;