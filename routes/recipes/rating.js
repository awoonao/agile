const express = require("express");
const router = express.Router();

/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc Rating System - Handle taste and appearance ratings with average calculation
 -------------------------------------------------------------------------------------------------------------------------------*/ 
 // Route to handle taste rating submissions
router.post("/:id/rate/taste", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Must be logged in to rate recipes" });
  }

  const recipeId = req.params.id;
  const userId = req.session.userId;
  const { rating } = req.body;

  try {
    // Check if user has already rated this recipe's taste
    const existingRating = await new Promise((resolve, reject) => {
      db.get(
        `SELECT rating_id, taste_rating 
           FROM Ratings 
           WHERE user_id = ? AND recipe_id = ? AND taste_rating IS NOT NULL`,
        [userId, recipeId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingRating) {
      // Update existing rating
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE Ratings 
             SET taste_rating = ?, 
                 created_at = CURRENT_TIMESTAMP 
             WHERE rating_id = ?`,
          [rating, existingRating.rating_id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      // Insert the taste rating
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Ratings (user_id, recipe_id, taste_rating)
           VALUES (?, ?, ?)`,
          [userId, recipeId, rating],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    // Update average taste rating in Recipes table
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE Recipes 
           SET average_taste_rating = (
             SELECT AVG(taste_rating) 
             FROM Ratings 
             WHERE recipe_id = ? 
             AND taste_rating IS NOT NULL
           )
           WHERE recipe_id = ?`,
        [recipeId, recipeId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving taste rating:", error);
    res.status(500).json({ error: "Failed to save rating" });
  }
});
/*----------------------------------------------------*/
// Route to handle appearance rating submissions
router.post("/:id/rate/appearance", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Must be logged in to rate recipes" });
  }

  const recipeId = req.params.id;
  const userId = req.session.userId;
  const { rating } = req.body;

  try {
    // Check if user has already rated this recipe's appearance
    const existingRating = await new Promise((resolve, reject) => {
      db.get(
        `SELECT rating_id, appearance_rating 
           FROM Ratings 
           WHERE user_id = ? AND recipe_id = ? AND appearance_rating IS NOT NULL`,
        [userId, recipeId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingRating) {
      // Update existing rating
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE Ratings 
             SET appearance_rating = ?, 
                 created_at = CURRENT_TIMESTAMP 
             WHERE rating_id = ?`,
          [rating, existingRating.rating_id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      // Insert the appearance rating
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Ratings (user_id, recipe_id, appearance_rating)
           VALUES (?, ?, ?)`,
          [userId, recipeId, rating],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    // Update average appearance rating in Recipes table
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE Recipes 
           SET average_appearance_rating = (
             SELECT AVG(appearance_rating) 
             FROM Ratings 
             WHERE recipe_id = ? 
             AND appearance_rating IS NOT NULL
           )
           WHERE recipe_id = ?`,
        [recipeId, recipeId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving appearance rating:", error);
    res.status(500).json({ error: "Failed to save rating" });
  }
});
/**-------------------------------------------------------------------------------------------------------------------------------
 * @desc User Reviews - Get user's existing ratings and handle comment submissions
 -------------------------------------------------------------------------------------------------------------------------------*/
router.get("/:id/user-review", async (req, res) => {
  if (!req.session.userId) {
    return res.json({ appearance_rating: null, taste_rating: null });
  }

  const recipeId = req.params.id;
  const userId = req.session.userId;

  try {
    // Fetch the user's ratings for the recipe
    const ratings = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
              MAX(appearance_rating) AS appearance_rating, 
              MAX(taste_rating) AS taste_rating 
           FROM Ratings 
           WHERE user_id = ? AND recipe_id = ?`,
        [userId, recipeId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row || { appearance_rating: null, taste_rating: null });
        }
      );
    });
    res.json(ratings);
  } catch (error) {
    console.error("Error fetching user ratings:", error);
    res.status(500).json({ error: "Failed to fetch ratings" });
  }
});
module.exports = router;
