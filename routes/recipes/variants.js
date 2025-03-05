const express = require("express");
const router = express.Router();

// Import the upload middleware
const { upload } = require("../../middleware/middleware");

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Create Recipe Variant (Including Dietary Restrictions)
 -------------------------------------------------------------------------------------------------------------------------------*/
router.post("/:id/create-variant", upload.single("image"), async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).redirect("/users/login");
    }

    const originalRecipeId = req.params.id;
    let { substitutions, title, description, servings, prep_time, cook_time, yield: recipeYield, dietary_restrictions } = req.body;

    try {
        // Fetch original recipe's image
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

        // Determine image path (Use new image or inherit from original)
        const imagePath = req.file ? `/images/recipes/${req.file.filename}` : originalRecipe.image_url;

        // Insert new recipe (variant)
        const newRecipeId = await new Promise((resolve, reject) => {
            db.run(
                `INSERT INTO Recipes (user_id, title, description, image_url, servings, prep_time, cook_time, yield) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    req.session.userId,
                    title || `Variant of Recipe ${originalRecipeId}`,
                    description || "",
                    imagePath,
                    servings,
                    prep_time,
                    cook_time,
                    recipeYield,
                ],
                function (err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Copy ingredients and process substitutions
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
            const substitution = substitutions?.ingredients?.[ingredient.ingredient_order];
            const ingredientName = substitution || ingredient.ingredient_name;

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

            if (substitution) {
                await new Promise((resolve, reject) => {
                    db.run(
                        `INSERT INTO Substitutions (recipe_id, ingredient_id, target_name, substitution, suggested_by, type) 
                         VALUES (?, ?, ?, ?, ?, 'ingredient')`,
                        [newRecipeId, newIngredientId, ingredient.ingredient_name, substitution, req.session.userId],
                        (err) => {
                            if (err) reject(err);
                            else resolve();
                        }
                    );
                });
            }
        }

        // Copy instructions and process substitutions
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
            const substitution = substitutions?.instructions?.[instruction.step_order];
            const instructionText = substitution || instruction.instruction_text;

            await new Promise((resolve, reject) => {
                db.run(
                    `INSERT INTO Instructions (recipe_id, instruction_text, step_order) 
                     VALUES (?, ?, ?)`,
                    [newRecipeId, instructionText, instruction.step_order],
                    function (err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Handle Dietary Restrictions (Inherited & User-Selected)
        let dietary_restrictions_data = dietary_restrictions ? JSON.parse(dietary_restrictions) : { selected: [], removed: [] };
        let dietary_restrictions_selected = dietary_restrictions_data.selected;
        let dietary_restrictions_removed = dietary_restrictions_data.removed;

        // Remove restrictions that were deselected in UI
        for (const restrictionName of dietary_restrictions_removed) {
            await new Promise((resolve, reject) => {
                db.run(
                    `DELETE FROM Recipe_Dietary_Restrictions 
                     WHERE recipe_id = ? 
                     AND restriction_id = (SELECT restriction_id FROM Dietary_Restrictions WHERE restriction_name = ?)`,
                    [newRecipeId, restrictionName],
                    function (err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        // Insert new selected dietary restrictions
        for (const restrictionName of dietary_restrictions_selected) {
            let restrictionId;

            // Check if the restriction exists
            const existingRestriction = await new Promise((resolve, reject) => {
                db.get("SELECT restriction_id FROM Dietary_Restrictions WHERE restriction_name = ?", [restrictionName], (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            if (existingRestriction) {
                restrictionId = existingRestriction.restriction_id;
            } else {
                restrictionId = await new Promise((resolve, reject) => {
                    db.run(
                        "INSERT INTO Dietary_Restrictions (restriction_name) VALUES (?)",
                        [restrictionName],
                        function (err) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                });
            }

            // Link restriction to new recipe variant
            await new Promise((resolve, reject) => {
                db.run(
                    "INSERT INTO Recipe_Dietary_Restrictions (recipe_id, restriction_id) VALUES (?, ?)",
                    [newRecipeId, restrictionId],
                    function (err) {
                        if (err) reject(err);
                        else resolve();
                    }
                );
            });
        }

        res.redirect(`/recipes/${newRecipeId}`);
    } catch (error) {
        console.error("Error creating recipe variant:", error.message);
        res.status(500).send("Internal Server Error");
    }
});

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Fetch Original Recipe Details Including Dietary Restrictions
 -------------------------------------------------------------------------------------------------------------------------------*/
router.get("/:id/create-variant", async (req, res) => {
  const recipeId = req.params.id;

  try {
      // Fetch Recipe & Author
      const recipe = await new Promise((resolve, reject) => {
          db.get(
              `SELECT Recipes.*, Users.username AS author 
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

      // Fetch Ingredients
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

      // Fetch Instructions
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

      // Fetch **Existing Dietary Restrictions** for the Recipe
      const existingDietaryRestrictions = await new Promise((resolve, reject) => {
          db.all(
              `SELECT Dietary_Restrictions.restriction_name 
               FROM Recipe_Dietary_Restrictions 
               JOIN Dietary_Restrictions ON Recipe_Dietary_Restrictions.restriction_id = Dietary_Restrictions.restriction_id 
               WHERE Recipe_Dietary_Restrictions.recipe_id = ?`,
              [recipeId],
              (err, rows) => {
                  if (err) reject(err);
                  else resolve(rows.map(row => row.restriction_name));
              }
          );
      });

      // Fetch **All Available Dietary Restrictions** for Suggestions
      const allDietaryRestrictions = await new Promise((resolve, reject) => {
          db.all(
              `SELECT restriction_name FROM Dietary_Restrictions`,
              [],
              (err, rows) => {
                  if (err) reject(err);
                  else resolve(rows.map(row => row.restriction_name));
              }
          );
      });

      // Render the `createVariant` page with all required data
      res.render("recipes/createVariant", { 
        recipe, 
        ingredients, 
        instructions, 
        existingDietaryRestrictions, 
        allDietaryRestrictions: allDietaryRestrictions 
      });    
    
  } catch (error) {
      console.error("Error fetching recipe details:", error.message);
      res.status(500).send("Internal Server Error");
  }
});

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Fetch All Dietary Restrictions
 -------------------------------------------------------------------------------------------------------------------------------*/
 router.get("/dietary-restrictions/all", async (req, res) => {
    try {
        const dietaryRestrictions = await new Promise((resolve, reject) => {
            db.all("SELECT restriction_name FROM Dietary_Restrictions", [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.json(dietaryRestrictions);
    } catch (error) {
        console.error("Error fetching dietary restrictions:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
