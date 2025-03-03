const express = require("express");
const router = express.Router();
// Import the upload middleware
const { upload } = require("../../middleware/middleware");

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Recipe Edit - Edit existing recipes
 -------------------------------------------------------------------------------------------------------------------------------*/

// GET route to display the edit form with existing recipe data
router.get("/:id/edit", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).redirect("/users/login");
  }
  
  const recipeId = req.params.id;

  try {
    // Fetch recipe details
    const recipe = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
              Recipes.recipe_id, 
              Recipes.title, 
              Recipes.description, 
              Recipes.image_url, 
              Recipes.servings,
              Recipes.prep_time,
              Recipes.yield,
              Recipes.cook_time,
              Recipes.user_id,
              Users.username AS author 
           FROM Recipes
           INNER JOIN Users ON Recipes.user_id = Users.user_id
           WHERE Recipes.recipe_id = ?`,
        [recipeId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!recipe) {
      return res.status(404).send("Recipe not found");
    }

    // Check if the user is the owner of the recipe
    if (recipe.user_id !== req.session.userId) {
      return res.status(403).send("You do not have permission to edit this recipe");
    }

    // Fetch ingredients
    const ingredients = await new Promise((resolve, reject) => {
      db.all(
        `SELECT ingredient_id, ingredient_name, ingredient_order 
           FROM Ingredients 
           WHERE recipe_id = ? 
           ORDER BY ingredient_order`,
        [recipeId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Fetch instructions
    const instructions = await new Promise((resolve, reject) => {
      db.all(
        `SELECT instruction_id, instruction_text, step_order 
           FROM Instructions 
           WHERE recipe_id = ? 
           ORDER BY step_order`,
        [recipeId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    // Render the edit page with the fetched data
    res.render("recipes/editRecipe", {
      recipe,
      ingredients,
      instructions,
    });
  } catch (error) {
    console.error("Error fetching recipe details for edit:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// POST route to process the edit form submission
router.post("/:id/edit", upload.single("image"), async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).redirect("/users/login");
  }
  
  const recipeId = req.params.id;
  const {
    title,
    description,
    servings,
    prep_time,
    cook_time,
    yield: recipeYield,
    ingredients,
    instructions
  } = req.body;

  try {
    // Check if the recipe exists and belongs to the user
    const recipeCheck = await new Promise((resolve, reject) => {
      db.get(
        "SELECT user_id, image_url FROM Recipes WHERE recipe_id = ?",
        [recipeId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!recipeCheck) {
      return res.status(404).send("Recipe not found");
    }

    if (recipeCheck.user_id !== req.session.userId) {
      return res.status(403).send("You do not have permission to edit this recipe");
    }

    // Determine image path
    const imagePath = req.file
      ? `/images/recipes/${req.file.filename}`
      : recipeCheck.image_url;

    // Update the recipe details
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE Recipes 
         SET title = ?, description = ?, image_url = ?, servings = ?, prep_time = ?, cook_time = ?, yield = ?
         WHERE recipe_id = ?`,
        [
          title,
          description,
          imagePath,
          servings,
          prep_time,
          cook_time,
          recipeYield,
          recipeId
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Update ingredients if provided
    if (ingredients && Array.isArray(ingredients)) {
      // First, delete all existing ingredients
      await new Promise((resolve, reject) => {
        db.run(
          "DELETE FROM Ingredients WHERE recipe_id = ?",
          [recipeId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Then insert the updated ingredients
      for (let i = 0; i < ingredients.length; i++) {
        await new Promise((resolve, reject) => {
          db.run(
            "INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order) VALUES (?, ?, ?)",
            [recipeId, ingredients[i], i + 1],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    // Update instructions if provided
    if (instructions && Array.isArray(instructions)) {
      // First, delete all existing instructions
      await new Promise((resolve, reject) => {
        db.run(
          "DELETE FROM Instructions WHERE recipe_id = ?",
          [recipeId],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      // Then insert the updated instructions
      for (let i = 0; i < instructions.length; i++) {
        await new Promise((resolve, reject) => {
          db.run(
            "INSERT INTO Instructions (recipe_id, instruction_text, step_order) VALUES (?, ?, ?)",
            [recipeId, instructions[i], i + 1],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    res.redirect(`/recipes/${recipeId}`);
  } catch (error) {
    console.error("Error updating recipe:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;