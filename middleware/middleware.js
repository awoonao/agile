// routes/recipes/middleware.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Middleware to check if user is authenticated. Redirects to login page if not authenticated.
 ---------------------------------------------------------------------------------------------------------------------------------*/
 const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.status(401).redirect("/users/login"); // Redirect to login page if not authenticated
  }
};

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Ensure the directory exists before storing files
 ---------------------------------------------------------------------------------------------------------------------------------*/
 const uploadPath = path.join(process.cwd(), "public/images/recipes"); // Dynamically set to project root

 if (!fs.existsSync(uploadPath)) {
   fs.mkdirSync(uploadPath, { recursive: true }); // Ensure directory exists
 }

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Configuration for file uploads using Multer. Saves images to /public/images with unique filenames.
 ---------------------------------------------------------------------------------------------------------------------------------*/
 const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("Saving file to:", uploadPath); // Debugging log to confirm correct directory
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and GIF files are allowed."));
    }
  },
});

// Export the middleware and configurations
module.exports = {
  isAuthenticated,
  upload,
};