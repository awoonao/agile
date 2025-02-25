// routes/recipes/middleware.js
const multer = require("multer");
const path = require("path");

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
 * @desc Configuration for file uploads using Multer. Saves images to /public/images with unique filenames.
 ---------------------------------------------------------------------------------------------------------------------------------*/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images/recipes")); 
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Use a timestamp and original file name to avoid conflicts
  },
});

// Initialize multer with the storage configuration
const upload = multer({
  storage,
  // limits: { fileSize: 2 * 1024 * 1024 },
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
