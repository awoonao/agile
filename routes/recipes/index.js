const express = require("express");
const router = express.Router();
const { isAuthenticated } = require("../../middleware/middleware");

// Apply authentication middleware to protected routes
router.use("/create-recipe", isAuthenticated);
router.use("/:id/create-variant", isAuthenticated);
router.use("/check-saved/:recipeId", isAuthenticated);
router.use("/save-recipe", isAuthenticated);
router.use("/unsave-recipe", isAuthenticated);

// Import all recipe sub-routes
const searchRoutes = require("./search");
const createRoutes = require("./create");
const viewRoutes = require("./view");
const ratingRoutes = require("./rating");
const commentRoutes = require("./comments");
const variantRoutes = require("./variants");
const saveRoutes = require("./save");
const editRoutes = require("./edit")

// Use all the route modules
router.use("/", searchRoutes);
router.use("/", createRoutes);
router.use("/", viewRoutes);
router.use("/", ratingRoutes);
router.use("/", commentRoutes);
router.use("/", variantRoutes);
router.use("/", saveRoutes);
router.use("/", editRoutes);

module.exports = router;
