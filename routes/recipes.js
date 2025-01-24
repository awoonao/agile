const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

/**-------------------------------------------------
 * @desc configure multer to save uploaded files into the /public/images folder.
 ----------------------------------------------------*/
// Configure storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images")); // Save files in /public/images
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Use a timestamp and original file name to avoid conflicts
  },
});

// Initialize multer with the storage configuration
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit to 2MB
});

/**-------------------------------------------------
 * @desc Create New recipe 
 ----------------------------------------------------*/
// Handle POST request to create a new recipe
router.post("/create-recipe", upload.single("image"), async (req, res) => {
  // Extract details from the request body
  const { title, description, ingredients, instructions } = req.body;

  //file path for uploaded images
  const imagePath = req.file ? `/images/${req.file.filename}` : null;

  //////////////////////
  //   Temp user
  const userId = 1; // Using test user_id = 1
  /////////////////////
  try {
    // Insert new recipe into the Recipes table and get the ID of the inserted recipe
    const recipeId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO Recipes (user_id, title, description,image_url) VALUES (?, ?, ?, ?)`,
        [userId, title, description, imagePath],
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
    ingredients.forEach(async (ingredient, index) => {
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
    });

    // Insert each instruction into the Instructions table
    instructions.forEach(async (instruction, index) => {
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
    });

    res.redirect("/recipes"); // Redirect to the desired page after successful addition
  } catch (error) {
    res.status(500).send("Error creating recipe: " + error.message); // Send error response if insertion fails
  }
});

router.get("/create-recipe", (req, res) => {
  res.render("recipes/createRecipe");
});


/**-------------------------------------------------
 * @desc Display all recipes in main page 
 ----------------------------------------------------*/
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
            console.error("Database error:", err);
            reject(err);
          } else {
            console.log("Number of recipes fetched:", rows.length);
            console.log("Recipes data:", rows);
            resolve(rows);
          }
        }
      );
    });

    res.render("main/recipesMain", { recipes: recipes });
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/recipe", (req, res) => {
  res.render("recipes/recipe");
});

/**-------------------------------------------------
 * @desc Display individual recipe 
 ----------------------------------------------------*/
 router.get('/:id', async (req, res) => {
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
            Recipes.average_appearance_rating, 
            Recipes.average_taste_rating, 
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
      return res.status(404).send('Recipe not found');
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

    // Render the detailed recipe page
    res.render('recipes/recipe', {
      recipe,
      ingredients,
      instructions
    });
  } catch (error) {
    console.error('Error fetching recipe details:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

module.exports = router;
