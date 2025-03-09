const express = require('express');
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        // Fetch the top recipe from each category
        
        // 1. Most Recent
        const newestRecipe = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    r.recipe_id, 
                    r.title, 
                    r.image_url, 
                    r.average_appearance_rating, 
                    r.average_taste_rating,
                    r.created_at
                FROM Recipes r
                ORDER BY r.created_at DESC
                LIMIT 1
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // 2. Best Tasting
        const bestTastingRecipe = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    r.recipe_id, 
                    r.title, 
                    r.image_url, 
                    r.average_appearance_rating, 
                    r.average_taste_rating,
                    r.created_at
                FROM Recipes r
                ORDER BY r.average_taste_rating DESC NULLS LAST, r.created_at DESC
                LIMIT 1
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // 3. Most Appealing
        const mostAppealingRecipe = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    r.recipe_id, 
                    r.title, 
                    r.image_url, 
                    r.average_appearance_rating, 
                    r.average_taste_rating,
                    r.created_at
                FROM Recipes r
                ORDER BY r.average_appearance_rating DESC NULLS LAST, r.created_at DESC
                LIMIT 1
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // 4. Most Popular This Month
        const popularMonthRecipe = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    r.recipe_id, 
                    r.title, 
                    r.image_url, 
                    r.average_appearance_rating, 
                    r.average_taste_rating,
                    r.created_at,
                    COUNT(c.comment_id) AS comment_count
                FROM Recipes r
                LEFT JOIN Comments c ON r.recipe_id = c.recipe_id AND c.created_at > date('now', '-1 month')
                GROUP BY r.recipe_id
                ORDER BY comment_count DESC, r.average_taste_rating DESC, r.created_at DESC
                LIMIT 1
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // 5. Most Popular This Week
        const popularWeekRecipe = await new Promise((resolve, reject) => {
            db.get(`
                SELECT 
                    r.recipe_id, 
                    r.title, 
                    r.image_url, 
                    r.average_appearance_rating, 
                    r.average_taste_rating,
                    r.created_at,
                    COUNT(c.comment_id) AS comment_count
                FROM Recipes r
                LEFT JOIN Comments c ON r.recipe_id = c.recipe_id AND c.created_at > date('now', '-7 days')
                GROUP BY r.recipe_id
                ORDER BY comment_count DESC, r.average_taste_rating DESC, r.created_at DESC
                LIMIT 1
            `, [], (err, row) => {
                if (err) reject(err);
                else resolve(row)
            });
        });

        // Create an object with category names and their top recipes
        const topRecipes = {
            newest: newestRecipe,
            bestTasting: bestTastingRecipe,
            mostAppealing: mostAppealingRecipe,
            popularMonth: popularMonthRecipe,
            popularWeek: popularWeekRecipe
        };

        res.render("main/home", { 
            userId: req.session.userId,
            topRecipes: topRecipes
        });
    } catch (error) {
        console.error("Error fetching top recipes:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Handle form submission to contact_us table
router.post('/contact', (req, res) => {
    const { contact_name, contact_email, contact_message } = req.body;

    if (!contact_name || !contact_email) {
        return res.status(400).send("Name and Email are required!");
    }

    const sql = `INSERT INTO Contact_us (contact_name, contact_email, contact_message) VALUES (?, ?, ?)`;
    const values = [contact_name, contact_email, contact_message];

    db.run(sql, values, function (err) {
        if (err) {
            console.error(err.message);
            return res.status(500).send("Database error occurred.");
        }
        res.redirect('/about'); // Redirect back to the about page after submission
    });
});

router.get('/privacy-policy', (req, res) => {
    res.render('main/privacyPolicy');
});

router.get('/terms-and-conditions', (req, res) => {
    res.render('main/TandC');
});

router.get('/about', (req, res) => {
    res.render('main/aboutUs');
});

  
module.exports = router;
