const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary"); // <-- Fix import

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({ // <-- Capital C
    cloudinary: cloudinary,
    params: {
        folder: "uploads", // 'folder' not 'Folder'
        allowed_formats: ["jpeg", "png", "jpg"], // 'allowed_formats' not 'allowedFormats'
        transformation: [{ width: 500, height: 500, crop: "limit" }]
    }
});

module.exports = {
    cloudinary: cloudinary,
    storage: storage
};