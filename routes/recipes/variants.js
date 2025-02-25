const express = require("express");
const router = express.Router();
// Import the upload middleware
const { upload } = require("../../middleware/middleware");

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Recipe Variants - Create and display form for recipe variations with substitutions
 -------------------------------------------------------------------------------------------------------------------------------*/
router.post("/:id/create-variant", upload.single("image"), async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).redirect("/users/login");
  }
  const originalRecipeId = req.params.id;
  const {
    substitutions,
    title,
    description,
    servings,
    prep_time,
    cook_time,
    yield: recipeYield,
  } = req.body;

  try {
    // Fetch the original recipe's image URL
    const originalRecipe = await new Promise((resolve, reject) => {
      db.get(
        "SELECT image_url FROM Recipes WHERE recipe_id = ?",
        [originalRecipeId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!originalRecipe) {
      return res.status(404).send("Original recipe not found");
    }

    // Determine image path
    const imagePath = req.file
      ? `/images/recipes/${req.file.filename}`
      : originalRecipe.image_url;

    // Fetch the original recipe details
    const newRecipeId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Recipes (user_id, title, description, image_url, servings, prep_time, cook_time, yield) 
           SELECT ?, ?, ?, ?, ?, ?, ?, ? 
           FROM Recipes 
           WHERE recipe_id = ?`,
        [
          req.session.userId,
          title || `Variant of ${originalRecipeId}`,
          description || "",
          imagePath,
          servings,
          prep_time,
          cook_time,
          recipeYield,
          originalRecipeId,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID); // Return the ID of the new recipe
        }
      );
    });

    // Copy ingredients and save substitutions
    const ingredients = await new Promise((resolve, reject) => {
      db.all(
        `SELECT ingredient_id, ingredient_name, ingredient_order 
          FROM Ingredients 
          WHERE recipe_id = ?
          ORDER BY ingredient_order`,
        [originalRecipeId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    for (const ingredient of ingredients) {
      // Adjust the index to match 1-based ordering
      const substitution =
        substitutions?.ingredients?.[ingredient.ingredient_order - 1];
      const ingredientName = substitution || ingredient.ingredient_name;

      // Insert the ingredient
      const newIngredientId = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order) 
           VALUES (?, ?, ?)`,
          [newRecipeId, ingredientName, ingredient.ingredient_order],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Save the substitution if it exists
      if (substitution) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO Substitutions (
              recipe_id, 
              ingredient_id,
              ingredient_name, 
              substitution, 
              suggested_by,
              type
            ) VALUES (?, ?, ?, ?, ?, 'ingredient')`,
            [
              newRecipeId,
              newIngredientId,
              ingredient.ingredient_name,
              substitution,
              req.session.userId,
              ,
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    // Copy instructions and save substitutions
    const instructions = await new Promise((resolve, reject) => {
      db.all(
        `SELECT instruction_id, instruction_text, step_order 
       FROM Instructions 
       WHERE recipe_id = ?
       ORDER BY step_order`,
        [originalRecipeId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    for (const instruction of instructions) {
      // Adjust the index to match 1-based ordering
      const substitution =
        substitutions?.instructions?.[instruction.step_order - 1];
      const instructionText = substitution || instruction.instruction_text;

      // Insert the instruction
      const newInstructionId = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Instructions (recipe_id, instruction_text, step_order) 
         VALUES (?, ?, ?)`,
          [newRecipeId, instructionText, instruction.step_order],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });

      // Save the substitution if it exists
      if (substitution) {
        await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO Substitutions (
            recipe_id,
            instruction_id,
            ingredient_name,
            substitution,
            suggested_by,
            type
          ) VALUES (?, ?, ?, ?, ?, 'instruction')`,
            [
              newRecipeId,
              newInstructionId,
              instruction.instruction_text,
              substitution,
              req.session.userId,
            ],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
    }

    res.redirect(`/recipes/${newRecipeId}`);
  } catch (error) {
    console.error("Error creating recipe variant:", error.message);
    res.status(500).send("Internal Server Error");
  }
});
// -------------------------------------------------------------//
router.get("/:id/create-variant", async (req, res) => {
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

    // Fetch ingredients
    const ingredients = await new Promise((resolve, reject) => {
      db.all(
        `SELECT ingredient_name, ingredient_order 
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
        `SELECT instruction_text, step_order 
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

    // Render the variant creation page
    res.render("recipes/createVariant", {
      recipe,
      ingredients,
      instructions,
    });
  } catch (error) {
    console.error("Error fetching recipe details:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
