const express = require('express');
const router = express.Router();
const Listing = require('../models/listing');
const { isLoggedIn, validateListing } = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

router.post('/', isLoggedIn, upload.single('image'), validateListing, async (req, res, next) => {
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
});

module.exports = router;