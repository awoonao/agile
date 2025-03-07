// const { rejects } = require("assert");
// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const path = require("path");

// /**-------------------------------------------------------------------------------------------------------------------------------
//  * @desc Middleware to check if user is authenticated. Redirects to login page if not authenticated.
//  ---------------------------------------------------------------------------------------------------------------------------------*/
// const isAuthenticated = (req, res, next) => {
//   if (req.session && req.session.userId) {
//     next();
//   } else {
//     res.status(401).redirect("/users/login"); // Redirect to login page if not authenticated
//   }
// };

// // Apply authentication middleware to protected routes
// router.use(["/create-recipe", "/:id/create-variant"], isAuthenticated);

// /**-------------------------------------------------------------------------------------------------------------------------------
//  * @desc Configuration for file uploads using Multer. Saves images to /public/images with unique filenames.
//  ---------------------------------------------------------------------------------------------------------------------------------*/
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, path.join(__dirname, "../public/images")); // Save files in /public/images
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = `${Date.now()}-${file.originalname}`;
//     cb(null, uniqueName); // Use a timestamp and original file name to avoid conflicts
//   },
// });

// // Initialize multer with the storage configuration
// const upload = multer({
//   storage,
//   // limits: { fileSize: 2 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
//     if (allowedTypes.includes(file.mimetype)) {
//       cb(null, true);
//     } else {
//       cb(new Error("Only JPEG, PNG, and GIF files are allowed."));
//     }
//   },
// });

// /**-------------------------------------------------------------------------------------------------------------------------------
//  * @desc Search functionality - Full-text search across recipes, ingredients, instructions, and substitutions
//  -------------------------------------------------------------------------------------------------------------------------------*/
// router.get("/search", async (req, res) => {
//   const searchTerm = req.query.query.trim();

//   if (!searchTerm) {
//     return res.redirect("/recipes");
//   }

//   try {
//     //  Perform a database query to search across multiple fields
//     const recipes = await new Promise((resolve, reject) => {
//       db.all(
//         `
//         SELECT DISTINCT 
//           r.recipe_id, 
//           r.title, 
//           r.description, 
//           r.image_url, 
//           r.average_appearance_rating, 
//           r.average_taste_rating,
//           u.username AS author
//         FROM Recipes r
//         JOIN Users u ON r.user_id = u.user_id
//         LEFT JOIN Ingredients i ON r.recipe_id = i.recipe_id
//         LEFT JOIN Instructions ins ON r.recipe_id = ins.recipe_id
//         LEFT JOIN Substitutions s ON r.recipe_id = s.recipe_id
//         WHERE 
//           r.title LIKE '%' || ? || '%' COLLATE NOCASE OR
//           r.description LIKE '%' || ? || '%' COLLATE NOCASE OR
//           i.ingredient_name LIKE '%' || ? || '%' COLLATE NOCASE OR
//           ins.instruction_text LIKE '%' || ? || '%' COLLATE NOCASE OR
//           s.substitution LIKE '%' || ? || '%' COLLATE NOCASE
//         GROUP BY r.recipe_id
//         ORDER BY r.created_at DESC
//       `,
//         [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm], //pass the searchTerm variable five times (title, description, ingredient, instruction, substitution).
//         (err, rows) => {
//           if (err) reject(err);
//           else resolve(rows);
//         }
//       );
//     });
//     // Render the search results page with the found recipes
//     res.render("recipes/searchResults", { recipes, searchTerm });
//   } catch (error) {
//     console.error("Search error:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// /**-------------------------------------------------------------------------------------------------------------------------------
//  * @desc Recipe Creation - Handles both GET (form display) and POST (form submission) for new recipes
//  -------------------------------------------------------------------------------------------------------------------------------*/ // Handle POST request to create a new recipe
// router.post("/create-recipe", upload.single("image"), async (req, res) => {
//   if (!req.session.userId) {
//     return res.status(401).redirect("/users/login");
//   }

//   // Extract details from the request body
//   const {
//     title,
//     description,
//     ingredients,
//     instructions,
//     servings,
//     prep_time,
//     yield: recipeYield,
//     cook_time,
//   } = req.body;

//   //file path for uploaded images
//   const imagePath = req.file ? `/images/${req.file.filename}` : null;

//   try {
//     // Insert new recipe into the Recipes table and get the ID of the inserted recipe
//     const recipeId = await new Promise((resolve, reject) => {
//       db.run(
//         `INSERT INTO Recipes (user_id, title, description,image_url,servings,prep_time,yield,cook_time) VALUES (?, ?, ?, ?,? ,?,?,?)`,
//         [
//           req.session.userId,
//           title,
//           description,
//           imagePath,
//           servings,
//           prep_time,
//           recipeYield,
//           cook_time,
//         ],
//         function (err) {
//           // Using regular function to have 'this' context
//           if (err) {
//             reject(err); // Handle insertion error
//           } else {
//             resolve(this.lastID); // Resolve with the ID of the inserted recipe
//           }
//         }
//       );
//     });

//     // Insert each ingredient into the Ingredients table
//     for (const [index, ingredient] of ingredients.entries()) {
//       await new Promise((resolve, reject) => {
//         db.run(
//           `INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order) VALUES (?, ?, ?)`,
//           [recipeId, ingredient, index + 1],
//           function (err) {
//             if (err) reject(err); // Handle insertion error
//             else resolve(); // Resolve when insertion is successful
//           }
//         );
//       });
//     }

//     // Insert each instruction into the Instructions table
//     for (const [index, instruction] of instructions.entries()) {
//       await new Promise((resolve, reject) => {
//         db.run(
//           `INSERT INTO Instructions (recipe_id, instruction_text, step_order) VALUES (?, ?, ?)`,
//           [recipeId, instruction, index + 1],
//           function (err) {
//             if (err) reject(err); // Handle insertion error
//             else resolve(); // Resolve when insertion is successful
//           }
//         );
//       });
//     }

//     res.redirect("/recipes"); // Redirect to the desired page after successful addition
//   } catch (error) {
//     res.status(500).send("Error creating recipe: " + error.message); // Send error response if insertion fails
//   }
// });

// router.get("/create-recipe", (req, res) => {
//   res.render("recipes/createRecipe");
// });

// /**-------------------------------------------------------------------------------------------------------------------------------
//  * @desc Recipe Details - Display individual recipe with ingredients, instructions, comments, and ratings
//  -------------------------------------------------------------------------------------------------------------------------------*/ router.get(
//   "/:id",
//   async (req, res) => {
//     const recipeId = req.params.id;

//     try {
//       // Fetch recipe details
//       const recipe = await new Promise((resolve, reject) => {
//         db.get(
//           `SELECT r.*, u.username as author 
//        FROM Recipes r
//        JOIN Users u ON r.user_id = u.user_id
//        WHERE r.recipe_id = ?`,
//           [recipeId],
//           (err, row) => {
//             if (err) reject(err);
//             else resolve(row);
//           }
//         );
//       });

//       if (!recipe) {
//         return res.status(404).send("Recipe not found");
//       }

//       // Fetch ingredients
//       const ingredients = await new Promise((resolve, reject) => {
//         db.all(
//           `SELECT 
//             i.ingredient_id,
//             i.ingredient_name as original_name,
//             i.ingredient_order,
//             s.substitution as substitution_name,
//             COALESCE(s.ingredient_name, i.ingredient_name) as original_for_sub
//         FROM Ingredients i
//         LEFT JOIN Substitutions s ON s.ingredient_id = i.ingredient_id AND s.type = 'ingredient'
//         WHERE i.recipe_id = ?
//         ORDER BY i.ingredient_order`,
//           [recipeId],
//           (err, rows) => {
//             if (err) reject(err);
//             else resolve(rows);
//           }
//         );
//       });

//       // Fetch instructions
//       const instructions = await new Promise((resolve, reject) => {
//         db.all(
//           `SELECT 
//             i.instruction_id,
//             i.instruction_text as original_name,
//             i.step_order,
//             s.substitution as substitution_name,
//             COALESCE(s.ingredient_name, i.instruction_text) as original_for_sub
//         FROM Instructions i
//         LEFT JOIN Substitutions s ON s.instruction_id = i.instruction_id AND s.type = 'instruction'
//         WHERE i.recipe_id = ?
//         ORDER BY i.step_order`,
//           [recipeId],
//           (err, rows) => {
//             if (err) reject(err);
//             else resolve(rows);
//           }
//         );
//       });

//       //fetch user feedback if logged in
//       let feedback = null;
//       if (req.session.userId) {
//         // Only fetch if user is logged in
//         feedback = await new Promise((resolve, reject) => {
//           db.get(
//             `SELECT content FROM Comments WHERE recipe_id = ? AND user_id = ?`,
//             [recipeId, req.session.userId],
//             (err, row) => {
//               if (err) reject(err);
//               else resolve(row || null);
//             }
//           );
//         });
//       }

//       // fetch all comments for the recipe
//       const comments = await new Promise((resolve, reject) => {
//         db.all(
//           `SELECT c.comment_id, c.content, c.created_at, u.username,
//      MAX(r.appearance_rating) AS appearance_rating, 
//      MAX(r.taste_rating) AS taste_rating
//    FROM Comments c
//    JOIN Users u ON c.user_id = u.user_id
//    LEFT JOIN Ratings r ON r.user_id = c.user_id AND r.recipe_id = c.recipe_id
//    WHERE c.recipe_id = ? 
//    GROUP BY c.comment_id
//    ORDER BY c.created_at DESC`,
//           [recipeId],
//           (err, rows) => {
//             if (err) reject(err);
//             else resolve(rows);
//           }
//         );
//       });

//       // Render the detailed recipe page with all fetched data
//       res.render("recipes/recipe", {
//         recipe,
//         ingredients,
//         instructions,
//         feedback,
//         comments,
//       });
//     } catch (error) {
//       console.error("Error fetching recipe details:", error.message);
//       res.status(500).send("Internal Server Error");
//     }
//   }
// );

// /**-------------------------------------------------------------------------------------------------------------------------------
//  * @desc Rating System - Handle taste and appearance ratings with average calculation
//  -------------------------------------------------------------------------------------------------------------------------------*/ // Route to handle taste rating submissions
// router.post("/:id/rate/taste", async (req, res) => {
//   if (!req.session.userId) {
//     return res.status(401).json({ error: "Must be logged in to rate recipes" });
//   }

//   const recipeId = req.params.id;
//   const userId = req.session.userId;
//   const { rating } = req.body;

//   try {
//     // Check if user has already rated this recipe's taste
//     const existingRating = await new Promise((resolve, reject) => {
//       db.get(
//         `SELECT rating_id, taste_rating 
//          FROM Ratings 
//          WHERE user_id = ? AND recipe_id = ? AND taste_rating IS NOT NULL`,
//         [userId, recipeId],
//         (err, row) => {
//           if (err) reject(err);
//           else resolve(row);
//         }
//       );
//     });

//     if (existingRating) {
//       // Update existing rating
//       await new Promise((resolve, reject) => {
//         db.run(
//           `UPDATE Ratings 
//            SET taste_rating = ?, 
//                created_at = CURRENT_TIMESTAMP 
//            WHERE rating_id = ?`,
//           [rating, existingRating.rating_id],
//           (err) => {
//             if (err) reject(err);
//             else resolve();
//           }
//         );
//       });
//     } else {
//       // Insert the taste rating
//       await new Promise((resolve, reject) => {
//         db.run(
//           `INSERT INTO Ratings (user_id, recipe_id, taste_rating)
//          VALUES (?, ?, ?)`,
//           [userId, recipeId, rating],
//           (err) => {
//             if (err) reject(err);
//             else resolve();
//           }
//         );
//       });
//     }
//     // Update average taste rating in Recipes table
//     await new Promise((resolve, reject) => {
//       db.run(
//         `UPDATE Recipes 
//          SET average_taste_rating = (
//            SELECT AVG(taste_rating) 
//            FROM Ratings 
//            WHERE recipe_id = ? 
//            AND taste_rating IS NOT NULL
//          )
//          WHERE recipe_id = ?`,
//         [recipeId, recipeId],
//         (err) => {
//           if (err) reject(err);
//           else resolve();
//         }
//       );
//     });

//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error saving taste rating:", error);
//     res.status(500).json({ error: "Failed to save rating" });
//   }
// });
// /*----------------------------------------------------*/
// // Route to handle appearance rating submissions
// router.post("/:id/rate/appearance", async (req, res) => {
//   if (!req.session.userId) {
//     return res.status(401).json({ error: "Must be logged in to rate recipes" });
//   }

//   const recipeId = req.params.id;
//   const userId = req.session.userId;
//   const { rating } = req.body;

//   try {
//     // Check if user has already rated this recipe's appearance
//     const existingRating = await new Promise((resolve, reject) => {
//       db.get(
//         `SELECT rating_id, appearance_rating 
//          FROM Ratings 
//          WHERE user_id = ? AND recipe_id = ? AND appearance_rating IS NOT NULL`,
//         [userId, recipeId],
//         (err, row) => {
//           if (err) reject(err);
//           else resolve(row);
//         }
//       );
//     });

//     if (existingRating) {
//       // Update existing rating
//       await new Promise((resolve, reject) => {
//         db.run(
//           `UPDATE Ratings 
//            SET appearance_rating = ?, 
//                created_at = CURRENT_TIMESTAMP 
//            WHERE rating_id = ?`,
//           [rating, existingRating.rating_id],
//           (err) => {
//             if (err) reject(err);
//             else resolve();
//           }
//         );
//       });
//     } else {
//       // Insert the appearance rating
//       await new Promise((resolve, reject) => {
//         db.run(
//           `INSERT INTO Ratings (user_id, recipe_id, appearance_rating)
//          VALUES (?, ?, ?)`,
//           [userId, recipeId, rating],
//           (err) => {
//             if (err) reject(err);
//             else resolve();
//           }
//         );
//       });
//     }

//     // Update average appearance rating in Recipes table
//     await new Promise((resolve, reject) => {
//       db.run(
//         `UPDATE Recipes 
//          SET average_appearance_rating = (
//            SELECT AVG(appearance_rating) 
//            FROM Ratings 
//            WHERE recipe_id = ? 
//            AND appearance_rating IS NOT NULL
//          )
//          WHERE recipe_id = ?`,
//         [recipeId, recipeId],
//         (err) => {
//           if (err) reject(err);
//           else resolve();
//         }
//       );
//     });

//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error saving appearance rating:", error);
//     res.status(500).json({ error: "Failed to save rating" });
//   }
// });
// /**-------------------------------------------------------------------------------------------------------------------------------
//  * @desc User Reviews - Get user's existing ratings and handle comment submissions
//  -------------------------------------------------------------------------------------------------------------------------------*/
// router.get("/:id/user-review", async (req, res) => {
//   if (!req.session.userId) {
//     return res.json({ appearance_rating: null, taste_rating: null });
//   }

//   const recipeId = req.params.id;
//   const userId = req.session.userId;

//   try {
//     // Fetch the user's ratings for the recipe
//     const ratings = await new Promise((resolve, reject) => {
//       db.get(
//         `SELECT 
//             MAX(appearance_rating) AS appearance_rating, 
//             MAX(taste_rating) AS taste_rating 
//          FROM Ratings 
//          WHERE user_id = ? AND recipe_id = ?`,
//         [userId, recipeId],
//         (err, row) => {
//           if (err) reject(err);
//           else resolve(row || { appearance_rating: null, taste_rating: null });
//         }
//       );
//     });
//     res.json(ratings);
//   } catch (error) {
//     console.error("Error fetching user ratings:", error);
//     res.status(500).json({ error: "Failed to fetch ratings" });
//   }
// });

// //---------------------------------------------------------//
// router.post("/:id/comment", async (req, res) => {
//   if (!req.session.userId) {
//     return res.status(401).json({ error: "Must be logged in to comment" });
//   }

//   const recipeId = req.params.id;
//   const userId = req.session.userId;
//   const { content } = req.body;

//   // Check if content is empty
//   if (!content || content.trim().length === 0) {
//     return res.status(400).json({ error: "Comment content cannot be empty" });
//   }

//   try {
//     // Check if the user has already commented on this recipe
//     const existingComment = await new Promise((resolve, reject) => {
//       db.get(
//         `SELECT comment_id, content 
//   FROM Comments
//   WHERE user_id = ? AND recipe_id = ? AND content IS NOT NULL`,
//         [userId, recipeId],
//         (err, row) => {
//           if (err) reject(err);
//           else resolve(row);
//         }
//       );
//     });

//     if (existingComment) {
//       // Update the existing comment
//       await new Promise((resolve, reject) => {
//         db.run(
//           `UPDATE Comments
//           SET content = ?,
//              created_at = CURRENT_TIMESTAMP 
//              WHERE comment_id = ?`,
//           [content, existingComment.comment_id],
//           (err) => {
//             if (err) reject(err);
//             else resolve();
//           }
//         );
//       });
//     } else {
//       // Insert a new comment
//       await new Promise((resolve, reject) => {
//         db.run(
//           `INSERT INTO Comments (recipe_id, user_id, content) 
//              VALUES (?, ?, ?)`,
//           [recipeId, userId, content],
//           (err) => {
//             if (err) reject(err);
//             else resolve();
//           }
//         );
//       });
//     }

//     res.json({ success: true });
//   } catch (error) {
//     console.error("Error saving comment:", error);
//     res.status(500).json({ error: "Failed to save comment" });
//   }
// });

// /**-------------------------------------------------------------------------------------------------------------------------------
//  * @desc Recipe Variants - Create and display form for recipe variations with substitutions
//  -------------------------------------------------------------------------------------------------------------------------------*/
// router.post("/:id/create-variant", async (req, res) => {
//   if (!req.session.userId) {
//     return res.status(401).redirect("/users/login");
//   }
//   const originalRecipeId = req.params.id;
//   const {
//     substitutions,
//     title,
//     description,
//     servings,
//     prep_time,
//     cook_time,
//     yield: recipeYield,
//   } = req.body;

//   try {
//     // Fetch the original recipe details
//     const newRecipeId = await new Promise((resolve, reject) => {
//       db.run(
//         `INSERT INTO Recipes (user_id, title, description, image_url, servings, prep_time, cook_time, yield) 
//          SELECT ?, ?, ?, image_url, ?, ?, ?, ? 
//          FROM Recipes 
//          WHERE recipe_id = ?`,
//         [
//           req.session.userId,
//           title || `Variant of ${originalRecipeId}`,
//           description || "",
//           servings,
//           prep_time,
//           cook_time,
//           recipeYield,
//           originalRecipeId,
//         ],
//         function (err) {
//           if (err) reject(err);
//           else resolve(this.lastID); // Return the ID of the new recipe
//         }
//       );
//     });

//     // Copy ingredients and save substitutions
//     const ingredients = await new Promise((resolve, reject) => {
//       db.all(
//         `SELECT ingredient_id, ingredient_name, ingredient_order 
//         FROM Ingredients 
//         WHERE recipe_id = ?
//         ORDER BY ingredient_order`,
//         [originalRecipeId],
//         (err, rows) => {
//           if (err) reject(err);
//           else resolve(rows);
//         }
//       );
//     });

//     for (const ingredient of ingredients) {
//       // Adjust the index to match 1-based ordering
//       const substitution =
//         substitutions?.ingredients?.[ingredient.ingredient_order - 1];
//       const ingredientName = substitution || ingredient.ingredient_name;

//       // Insert the ingredient
//       const newIngredientId = await new Promise((resolve, reject) => {
//         db.run(
//           `INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order) 
//          VALUES (?, ?, ?)`,
//           [newRecipeId, ingredientName, ingredient.ingredient_order],
//           function (err) {
//             if (err) reject(err);
//             else resolve(this.lastID);
//           }
//         );
//       });

//       // Save the substitution if it exists
//       if (substitution) {
//         await new Promise((resolve, reject) => {
//           db.run(
//             `INSERT INTO Substitutions (
//             recipe_id, 
//             ingredient_id,
//             ingredient_name, 
//             substitution, 
//             suggested_by,
//             type
//           ) VALUES (?, ?, ?, ?, ?, 'ingredient')`,
//             [
//               newRecipeId,
//               newIngredientId,
//               ingredient.ingredient_name,
//               substitution,
//               req.session.userId,
//               ,
//             ],
//             (err) => {
//               if (err) reject(err);
//               else resolve();
//             }
//           );
//         });
//       }
//     }

//     // Copy instructions and save substitutions
//     const instructions = await new Promise((resolve, reject) => {
//       db.all(
//         `SELECT instruction_id, instruction_text, step_order 
//      FROM Instructions 
//      WHERE recipe_id = ?
//      ORDER BY step_order`,
//         [originalRecipeId],
//         (err, rows) => {
//           if (err) reject(err);
//           else resolve(rows);
//         }
//       );
//     });

//     for (const instruction of instructions) {
//       // Adjust the index to match 1-based ordering
//       const substitution =
//         substitutions?.instructions?.[instruction.step_order - 1];
//       const instructionText = substitution || instruction.instruction_text;

//       // Insert the instruction
//       const newInstructionId = await new Promise((resolve, reject) => {
//         db.run(
//           `INSERT INTO Instructions (recipe_id, instruction_text, step_order) 
//        VALUES (?, ?, ?)`,
//           [newRecipeId, instructionText, instruction.step_order],
//           function (err) {
//             if (err) reject(err);
//             else resolve(this.lastID);
//           }
//         );
//       });

//       // Save the substitution if it exists
//       if (substitution) {
//         await new Promise((resolve, reject) => {
//           db.run(
//             `INSERT INTO Substitutions (
//           recipe_id,
//           instruction_id,
//           ingredient_name,
//           substitution,
//           suggested_by,
//           type
//         ) VALUES (?, ?, ?, ?, ?, 'instruction')`,
//             [
//               newRecipeId,
//               newInstructionId,
//               instruction.instruction_text,
//               substitution,
//               req.session.userId,
//             ],
//             (err) => {
//               if (err) reject(err);
//               else resolve();
//             }
//           );
//         });
//       }
//     }

//     res.redirect(`/recipes/${newRecipeId}`);
//   } catch (error) {
//     console.error("Error creating recipe variant:", error.message);
//     res.status(500).send("Internal Server Error");
//   }
// });
// // -------------------------------------------------------------//
// router.get("/:id/create-variant", async (req, res) => {
//   const recipeId = req.params.id;

//   try {
//     // Fetch recipe details
//     const recipe = await new Promise((resolve, reject) => {
//       db.get(
//         `SELECT 
//             Recipes.recipe_id, 
//             Recipes.title, 
//             Recipes.description, 
//             Recipes.image_url, 
//             Recipes.servings,
//             Recipes.prep_time,
//             Recipes.yield,
//             Recipes.cook_time,
//             Users.username AS author 
//          FROM Recipes
//          INNER JOIN Users ON Recipes.user_id = Users.user_id
//          WHERE Recipes.recipe_id = ?`,
//         [recipeId],
//         (err, row) => {
//           if (err) reject(err);
//           else resolve(row);
//         }
//       );
//     });

//     if (!recipe) {
//       return res.status(404).send("Recipe not found");
//     }

//     // Fetch ingredients
//     const ingredients = await new Promise((resolve, reject) => {
//       db.all(
//         `SELECT ingredient_name, ingredient_order 
//          FROM Ingredients 
//          WHERE recipe_id = ? 
//          ORDER BY ingredient_order`,
//         [recipeId],
//         (err, rows) => {
//           if (err) reject(err);
//           else resolve(rows);
//         }
//       );
//     });

//     // Fetch instructions
//     const instructions = await new Promise((resolve, reject) => {
//       db.all(
//         `SELECT instruction_text, step_order 
//          FROM Instructions 
//          WHERE recipe_id = ? 
//          ORDER BY step_order`,
//         [recipeId],
//         (err, rows) => {
//           if (err) reject(err);
//           else resolve(rows);
//         }
//       );
//     });

//     // Render the variant creation page
//     res.render("recipes/createVariant", {
//       recipe,
//       ingredients,
//       instructions,
//     });
//   } catch (error) {
//     console.error("Error fetching recipe details:", error.message);
//     res.status(500).send("Internal Server Error");
//   }
// });

// /**-------------------------------------------------------------------------------------------------------------------------------
//  * @desc Main Recipes Page - Display all recipes with basic information and ratings
//  -------------------------------------------------------------------------------------------------------------------------------*/
// router.get("/", async (req, res) => {
//   try {
//     // Get the sort parameter from the query string, defaulting to 'newest' if not provided
//     const sort = req.query.sort || "newest";

//     // Base SQL query to retrieve recipes with author name and comment count
//     let recipesQuery = `
//       SELECT 
//         Recipes.recipe_id, 
//         Recipes.title, 
//         Recipes.description, 
//         Recipes.image_url, 
//         Recipes.average_appearance_rating, 
//         Recipes.average_taste_rating,
//         Recipes.created_at,
//         Users.username AS author
//       FROM Recipes
//       INNER JOIN Users ON Recipes.user_id = Users.user_id
//     `;

//     // Add different WHERE/JOIN clauses and ORDER BY based on sort parameter
//     switch (sort) {
//       case "newest": // Sort by most recently created recipes
//         recipesQuery += `ORDER BY Recipes.created_at DESC`;
//         break;
//       case "taste-highest": // Sort by highest taste rating, null values last
//         recipesQuery += `ORDER BY Recipes.average_taste_rating DESC NULLS LAST, Recipes.created_at DESC`;
//         break;
//       case "appearance-highest": // Sort by highest appearance rating, null values last
//         recipesQuery += `ORDER BY Recipes.average_appearance_rating DESC NULLS LAST, Recipes.created_at DESC`;
//         break;
//       case "popular-month": // Sort by most commented recipes in the last month
//         recipesQuery = `
//           SELECT 
//             r.recipe_id, 
//             r.title, 
//             r.description, 
//             r.image_url, 
//             r.average_appearance_rating, 
//             r.average_taste_rating,
//             r.created_at,
//             u.username AS author,
//             COUNT(c.comment_id) AS comment_count
//           FROM Recipes r
//           INNER JOIN Users u ON r.user_id = u.user_id
//           LEFT JOIN Comments c ON r.recipe_id = c.recipe_id AND c.created_at > date('now', '-1 month')
//           GROUP BY r.recipe_id
//           ORDER BY comment_count DESC, r.average_taste_rating DESC, r.created_at DESC
//         `;
//         break;
//       case "popular-week": // Sort by most commented recipes in the last week
//         recipesQuery = `
//           SELECT 
//             r.recipe_id, 
//             r.title, 
//             r.description, 
//             r.image_url, 
//             r.average_appearance_rating, 
//             r.average_taste_rating,
//             r.created_at,
//             u.username AS author,
//             COUNT(c.comment_id) AS comment_count
//           FROM Recipes r
//           INNER JOIN Users u ON r.user_id = u.user_id
//           LEFT JOIN Comments c ON r.recipe_id = c.recipe_id AND c.created_at > date('now', '-7 days')
//           GROUP BY r.recipe_id
//           ORDER BY comment_count DESC, r.average_taste_rating DESC, r.created_at DESC
//         `;
//         break;
//       default: // Default to newest if an invalid sort option is provided
//         recipesQuery += `ORDER BY Recipes.created_at DESC`;
//     }

//     // Execute the query
//     const recipes = await new Promise((resolve, reject) => {
//       db.all(recipesQuery, [], (err, rows) => {
//         if (err) {
//           console.error("Database error:", err);
//           reject(err);
//         } else {
//           // console.log("Number of recipes fetched:", rows.length);
//           resolve(rows);
//         }
//       });
//     });

//     // Render the main recipes page and pass the retrieved data
//     res.render("main/recipesMain", {
//       recipes: recipes,
//       sort: sort, // Pass the sorting parameter to the template for UI updates
//     });
//   } catch (error) {
//     // Log any errors and return an Internal Server Error response
//     console.error("Error fetching recipes:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });
// /**-------------------------------------------------------------------------------------------------------------------------------
//  * @desc Recipe Template - Fallback route for recipe view template
//  -------------------------------------------------------------------------------------------------------------------------------*/
// router.get("/recipe", (req, res) => {
//   res.render("recipes/recipe");
// });

// module.exports = router;
