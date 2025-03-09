const express = require("express");
const router = express.Router();

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Recipe Details - Display individual recipe with ingredients, instructions, comments, and ratings
 -------------------------------------------------------------------------------------------------------------------------------*/ 
router.get("/:id", async (req, res) => {
  const recipeId = req.params.id;

    try {
      // Fetch recipe details
      const recipe = await new Promise((resolve, reject) => {
        db.get(
          `SELECT r.*, u.username as author 
         FROM Recipes r
         JOIN Users u ON r.user_id = u.user_id
         WHERE r.recipe_id = ?`,
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

      if (!recipe) return res.status(404).send("Recipe not found");

      // Fetch ingredients
      const ingredients = await new Promise((resolve, reject) => {
        db.all(
          `SELECT 
              i.ingredient_id,
              i.ingredient_name as original_name,
              i.ingredient_order,
              s.substitution as substitution_name,
              COALESCE(s.target_name, i.ingredient_name) as original_for_sub
          FROM Ingredients i
          LEFT JOIN Substitutions s ON s.ingredient_id = i.ingredient_id AND s.type = 'ingredient'
          WHERE i.recipe_id = ?
          ORDER BY i.ingredient_order`,
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
          `SELECT 
              i.instruction_id,
              i.instruction_text as original_name,
              i.step_order,
              s.substitution as substitution_name,
              COALESCE(s.target_name, i.instruction_text) as original_for_sub
          FROM Instructions i
          LEFT JOIN Substitutions s ON s.instruction_id = i.instruction_id AND s.type = 'instruction'
          WHERE i.recipe_id = ?
          ORDER BY i.step_order`,
          [recipeId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      // Fetch Dietary Restrictions
      const dietaryRestrictions = await new Promise((resolve, reject) => {
          db.all(
              `SELECT dr.restriction_name 
               FROM Recipe_Dietary_Restrictions rdr
               JOIN Dietary_Restrictions dr ON rdr.restriction_id = dr.restriction_id
               WHERE rdr.recipe_id = ?`,
              [recipeId],
              (err, rows) => {
                  if (err) reject(err);
                  else resolve(rows);
              }
          );
      });

      //fetch user feedback if logged in
      let feedback = null;
      if (req.session.userId) {
        // Only fetch if user is logged in
        feedback = await new Promise((resolve, reject) => {
          db.get(
            `SELECT content FROM Comments WHERE recipe_id = ? AND user_id = ?`,
            [recipeId, req.session.userId],
            (err, row) => {
              if (err) reject(err);
              else resolve(row || null);
            }
          );
        });
      }

      // fetch all comments for the recipe
      const comments = await new Promise((resolve, reject) => {
        db.all(
          `SELECT c.comment_id, c.content, c.created_at, u.username,
          MAX(r.appearance_rating) AS appearance_rating, 
          MAX(r.taste_rating) AS taste_rating
          FROM Comments c
          JOIN Users u ON c.user_id = u.user_id
          LEFT JOIN Ratings r ON r.user_id = c.user_id AND r.recipe_id = c.recipe_id
          WHERE c.recipe_id = ? 
          GROUP BY c.comment_id
          ORDER BY c.created_at DESC`,
          [recipeId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });

      res.render("recipes/recipe", {
        recipe,
        ingredients,
        instructions,
        dietaryRestrictions,
        feedback,  
        comments   
    });
    
  } catch (error) {
      console.error("Error fetching recipe details:", error);
      res.status(500).send("Internal Server Error");
  }
});

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Main Recipes Page - Display all recipes with basic information and ratings
 -------------------------------------------------------------------------------------------------------------------------------*/
router.get("/", async (req, res) => {
  try {
    // Get the sort parameter from the query string, defaulting to 'newest' if not provided
    const sort = req.query.sort || "newest";

    // Base SQL query to retrieve recipes with author name and comment count
    let recipesQuery = `
        SELECT 
          Recipes.recipe_id, 
          Recipes.title, 
          Recipes.description, 
          Recipes.image_url, 
          Recipes.average_appearance_rating, 
          Recipes.average_taste_rating,
          Recipes.created_at,
          Users.username AS author
        FROM Recipes
        INNER JOIN Users ON Recipes.user_id = Users.user_id
      `;

    // Add different WHERE/JOIN clauses and ORDER BY based on sort parameter
    switch (sort) {
      case "newest": // Sort by most recently created recipes
        recipesQuery += `ORDER BY Recipes.created_at DESC`;
        break;
      case "taste-highest": // Sort by highest taste rating, null values last
        recipesQuery += `ORDER BY Recipes.average_taste_rating DESC NULLS LAST, Recipes.created_at DESC`;
        break;
      case "appearance-highest": // Sort by highest appearance rating, null values last
        recipesQuery += `ORDER BY Recipes.average_appearance_rating DESC NULLS LAST, Recipes.created_at DESC`;
        break;
      case "popular-month": // Sort by most commented recipes in the last month
        recipesQuery = `
            SELECT 
              r.recipe_id, 
              r.title, 
              r.description, 
              r.image_url, 
              r.average_appearance_rating, 
              r.average_taste_rating,
              r.created_at,
              u.username AS author,
              COUNT(c.comment_id) AS comment_count
            FROM Recipes r
            INNER JOIN Users u ON r.user_id = u.user_id
            LEFT JOIN Comments c ON r.recipe_id = c.recipe_id AND c.created_at > date('now', '-1 month')
            GROUP BY r.recipe_id
            ORDER BY comment_count DESC, r.average_taste_rating DESC, r.created_at DESC
          `;
        break;
      case "popular-week": // Sort by most commented recipes in the last week
        recipesQuery = `
            SELECT 
              r.recipe_id, 
              r.title, 
              r.description, 
              r.image_url, 
              r.average_appearance_rating, 
              r.average_taste_rating,
              r.created_at,
              u.username AS author,
              COUNT(c.comment_id) AS comment_count
            FROM Recipes r
            INNER JOIN Users u ON r.user_id = u.user_id
            LEFT JOIN Comments c ON r.recipe_id = c.recipe_id AND c.created_at > date('now', '-7 days')
            GROUP BY r.recipe_id
            ORDER BY comment_count DESC, r.average_taste_rating DESC, r.created_at DESC
          `;
        break;
      default: // Default to newest if an invalid sort option is provided
        recipesQuery += `ORDER BY Recipes.created_at DESC`;
    }

    // Execute the query
    const recipes = await new Promise((resolve, reject) => {
      db.all(recipesQuery, [], (err, rows) => {
        if (err) {
          console.error("Database error:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    // Render the main recipes page and pass the retrieved data
    res.render("main/recipesMain", {
      recipes: recipes,
      sort: sort, // Pass the sorting parameter to the template for UI updates
    });
  } catch (error) {
    // Log any errors and return an Internal Server Error response
    console.error("Error fetching recipes:", error);
    res.status(500).send("Internal Server Error");
  }
});
/**-------------------------------------------------------------------------------------------------------------------------------
* @desc Recipe Template - Fallback route for recipe view template
-------------------------------------------------------------------------------------------------------------------------------*/
router.get("/recipe", (req, res) => {
  res.render("recipes/recipe");
});

module.exports = router;
