const express = require("express");
const router = express.Router();

//---------------------------------------------------------//
router.post("/:id/comment", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Must be logged in to comment" });
  }

  const recipeId = req.params.id;
  const userId = req.session.userId;
  const { content } = req.body;

  // Check if content is empty
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: "Comment content cannot be empty" });
  }

  try {
    // Check if the user has already commented on this recipe
    const existingComment = await new Promise((resolve, reject) => {
      db.get(
        `SELECT comment_id, content 
  FROM Comments
  WHERE user_id = ? AND recipe_id = ? AND content IS NOT NULL`,
        [userId, recipeId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingComment) {
      // Update the existing comment
      await new Promise((resolve, reject) => {
        db.run(
          `UPDATE Comments
          SET content = ?,
             created_at = CURRENT_TIMESTAMP 
             WHERE comment_id = ?`,
          [content, existingComment.comment_id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      // Insert a new comment
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Comments (recipe_id, user_id, content) 
             VALUES (?, ?, ?)`,
          [recipeId, userId, content],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error saving comment:", error);
    res.status(500).json({ error: "Failed to save comment" });
  }
});

module.exports = router;
