const express = require("express");
const router = express.Router();



/**-------------------------------------------------
 * @desc Create New recipe
 ----------------------------------------------------*/
// Handle POST request to create a new recipe
router.post("/create-recipe", async (req, res) => {
  // Extract title and description from the request body
  const { title, description } = req.body;

  // Extract ingredients and instructions arrays from the request body
  const ingredients = req.body.ingredients;
  const instructions = req.body.instructions;

  //////////////////////
  //   Temp user
  const userId = 1; // Using test user_id = 1
  /////////////////////
  try {
    // Insert new recipe into the Recipes table and get the ID of the inserted recipe
    const recipeId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Recipes (user_id, title, description) VALUES (?, ?, ?)`,
        [userId, title, description],
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


/**-------------------------------------------------
 * @desc Display all recipe 
 ----------------------------------------------------*/
 // In recipes.js, modify the route to include debugging:
router.get("/", async (req, res) => {
  try {
      const recipes = await new Promise((resolve, reject) => {
          db.all(
              `SELECT 
                  Recipes.recipe_id, 
                  Recipes.title, 
                  Recipes.description, 
                  Recipes.image_url, 
                  Recipes.average_appearance_rating, 
                  Recipes.average_taste_rating,
                  Users.username AS author
              FROM Recipes
              INNER JOIN Users ON Recipes.user_id = Users.user_id`,
              [],
              (err, rows) => {
                  if (err) {
                      console.error('Database error:', err);
                      reject(err);
                  } else {
                      console.log('Number of recipes fetched:', rows.length);
                      console.log('Recipes data:', rows);
                      resolve(rows);
                  }
              }
          );
      });

      res.render('main/recipesMain', { recipes: recipes });
  } catch (error) {
      console.error('Error fetching recipes:', error);
      res.status(500).send('Internal Server Error');
  }
});




router.get("/create-recipe", (req, res) => {
  res.render("recipes/createRecipe");
});

router.get("/recipe", (req, res) => {
  res.render("recipes/recipe");
});

module.exports = router;
