const express = require("express");
const router = express.Router();

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Search functionality - Full-text search across recipes, ingredients, instructions, and substitutions
 -------------------------------------------------------------------------------------------------------------------------------*/
router.get("/search", async (req, res) => {
  const searchTerm = req.query.query.trim();

  if (!searchTerm) {
    return res.redirect("/recipes");
  }

  try {
    //  Perform a database query to search across multiple fields
    const recipes = await new Promise((resolve, reject) => {
      db.all(
        `
        SELECT DISTINCT 
          r.recipe_id, 
          r.title, 
          r.description, 
          r.image_url, 
          r.average_appearance_rating, 
          r.average_taste_rating,
          u.username AS author
        FROM Recipes r
        JOIN Users u ON r.user_id = u.user_id
        LEFT JOIN Ingredients i ON r.recipe_id = i.recipe_id
        LEFT JOIN Instructions ins ON r.recipe_id = ins.recipe_id
        LEFT JOIN Substitutions s ON r.recipe_id = s.recipe_id
        WHERE 
          r.title LIKE '%' || ? || '%' COLLATE NOCASE OR
          r.description LIKE '%' || ? || '%' COLLATE NOCASE OR
          i.ingredient_name LIKE '%' || ? || '%' COLLATE NOCASE OR
          ins.instruction_text LIKE '%' || ? || '%' COLLATE NOCASE OR
          s.substitution LIKE '%' || ? || '%' COLLATE NOCASE
        GROUP BY r.recipe_id
        ORDER BY r.created_at DESC
      `,
        [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], //pass the searchTerm variable five times (title, description, ingredient, instruction, substitution).
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    // Render the search results page with the found recipes
    res.render("recipes/searchResults", { recipes, searchTerm });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
