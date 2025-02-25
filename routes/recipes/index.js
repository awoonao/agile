const express = require("express");
const router = express.Router();
const { isAuthenticated, upload } = require("../../middleware/middleware");

// Apply authentication middleware to protected routes
router.use("/create-recipe", isAuthenticated);
router.use("/:id/create-variant", isAuthenticated);

// Import all recipe sub-routes
const searchRoutes = require("./search");
const createRoutes = require("./create");
const viewRoutes = require("./view");
const ratingRoutes = require("./rating");
const commentRoutes = require("./comments");
const variantRoutes = require("./variants");

// Use all the route modules
router.use("/", searchRoutes);
router.use("/", createRoutes);
router.use("/", viewRoutes);
router.use("/", ratingRoutes);
router.use("/", commentRoutes);
router.use("/", variantRoutes);

module.exports = router;
