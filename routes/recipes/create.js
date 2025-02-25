const express = require("express");
const router = express.Router();

// Import the upload middleware
const { upload } = require("../../middleware/middleware");

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Recipe Creation - Handles both GET (form display) and POST (form submission) for new recipes
 -------------------------------------------------------------------------------------------------------------------------------*/ // Handle POST request to create a new recipe
router.post("/create-recipe", upload.single("image"), async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).redirect("/users/login");
  }

  // Extract details from the request body
  const {
    title,
    description,
    ingredients,
    instructions,
    servings,
    prep_time,
    yield: recipeYield,
    cook_time,
  } = req.body;

  //file path for uploaded images
  const imagePath = req.file ? `/images/recipes/${req.file.filename}` : null;

  try {
    // Insert new recipe into the Recipes table and get the ID of the inserted recipe
    const recipeId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Recipes (user_id, title, description,image_url,servings,prep_time,yield,cook_time) VALUES (?, ?, ?, ?,? ,?,?,?)`,
        [
          req.session.userId,
          title,
          description,
          imagePath,
          servings,
          prep_time,
          recipeYield,
          cook_time,
        ],
        function (err) {
          // Using regular function to have 'this' context
          if (err) {
            reject(err); // Handle insertion error
          } else {
            resolve(this.lastID); // Resolve with the ID of the inserted recipe
          }
        }
      );
    });

    // Insert each ingredient into the Ingredients table
    for (const [index, ingredient] of ingredients.entries()) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order) VALUES (?, ?, ?)`,
          [recipeId, ingredient, index + 1],
          function (err) {
            if (err) reject(err); // Handle insertion error
            else resolve(); // Resolve when insertion is successful
          }
        );
      });
    }

    // Insert each instruction into the Instructions table
    for (const [index, instruction] of instructions.entries()) {
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Instructions (recipe_id, instruction_text, step_order) VALUES (?, ?, ?)`,
          [recipeId, instruction, index + 1],
          function (err) {
            if (err) reject(err); // Handle insertion error
            else resolve(); // Resolve when insertion is successful
          }
        );
      });
    }

    res.redirect("/recipes"); // Redirect to the desired page after successful addition
  } catch (error) {
    res.status(500).send("Error creating recipe: " + error.message); // Send error response if insertion fails
  }
});

router.get("/create-recipe", (req, res) => {
  res.render("recipes/createRecipe");
});

module.exports = router;
