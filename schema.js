const joi = require('joi');

module.exports.listingSchema = joi.object({
  listing: joi.object({
    title: joi.string().required(),
    price: joi.number().required().min(0),
    description: joi.string().required(),
    location: joi.string().required(),
    country: joi.string().required(),
    image: joi.string().required(),
  }).required() // Ye yahan hona chahiye
});


module.exports.reviewSchema = joi.object({
  review: joi.object({
    comment: joi.string().required(),
    rating: joi.number().required().min(1).max(5),
  }).required() // Ye yahan hona chahiye
});