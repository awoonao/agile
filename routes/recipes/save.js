const express = require("express");
const router = express.Router();

// Check if a recipe is saved by the current user
router.get("/check-saved/:recipeId", async (req, res) => {
    const { recipeId } = req.params;
    const userId = req.session.userId;
    const query = `SELECT * FROM Saved_Recipes WHERE user_id = ? AND recipe_id = ?`;

      db.get(query, [userId, recipeId], (err, saved) => {
        if (err) {
            return res.status(500).json({ error: "Database error" });
        }
        return res.json({ saved: saved ? true : false });
    });
});

// Save a recipe
router.post("/save-recipe", async (req, res) => {
    const { recipeId } = req.body;
    const userId = req.session.userId;

    if (!recipeId) return res.status(400).json({ error: "Recipe ID is required" });

    const checkQuery = `SELECT * FROM Saved_Recipes WHERE user_id = ? AND recipe_id = ?`;

    db.get(checkQuery, [userId, recipeId], (err, existingSave) => {
        if (existingSave) return res.status(409).json({ message: "Recipe already saved" });

        const insertQuery = `INSERT INTO Saved_Recipes (user_id, recipe_id) VALUES (?, ?)`;

        db.run(insertQuery, [userId, recipeId], function () {
            res.status(201).json({ message: "Recipe saved successfully" });
        });
    });
});

// Unsave a recipe
router.delete("/unsave-recipe", async (req, res) => {
    const { recipeId } = req.body;
    const userId = req.session.userId;

    if (!recipeId) return res.status(400).json({ error: "Recipe ID is required" });

    const query = `DELETE FROM Saved_Recipes WHERE user_id = ? AND recipe_id = ?`;

    db.run(query, [userId, recipeId], function () {
        res.json({ message: this.changes ? "Recipe unsaved successfully" : "Recipe was not saved" });
    });
});

module.exports = router;