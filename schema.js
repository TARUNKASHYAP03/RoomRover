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
