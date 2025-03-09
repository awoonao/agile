PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

CREATE TABLE Users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255) NOT NULL,
    birthday DATE,
    email VARCHAR(100) UNIQUE NOT NULL,
    profile_picture VARCHAR(255),
    role TEXT DEFAULT 'guest' CHECK (role IN ('user', 'admin', 'guest')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE Ratings (
    rating_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    appearance_rating INTEGER CHECK (appearance_rating BETWEEN 1 AND 5),
    taste_rating INTEGER CHECK (taste_rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE Comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Saved_Recipes (
    saved_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE Recipes (
    recipe_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    servings VARCHAR(255),
    prep_time VARCHAR(255),
    yield VARCHAR(255),
    cook_time VARCHAR(255),
    average_appearance_rating DECIMAL(3, 2) DEFAULT 0.00,
    average_taste_rating DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Ingredients (
    ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    ingredient_name VARCHAR(255) NOT NULL,
    ingredient_order INTEGER NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE Substitutions (
    substitution_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    ingredient_id INTEGER, 
    instruction_id INTEGER,
    target_name VARCHAR(100) NOT NULL,
    substitution VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    suggested_by INTEGER NOT NULL,
    type TEXT CHECK(type IN ('ingredient', 'instruction')) DEFAULT 'ingredient',
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id) ON DELETE CASCADE,
    FOREIGN KEY (instruction_id) REFERENCES Instructions(instruction_id) ON DELETE CASCADE,
    FOREIGN KEY (suggested_by) REFERENCES Users(user_id) ON DELETE CASCADE
);

CREATE TABLE Instructions (
    instruction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER NOT NULL,
    instruction_text TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE
);

CREATE TABLE Contact_us (
    contact_id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_name VARCHAR(100) NOT NULL,
    contact_email VARCHAR(100) NOT NULL,
    contact_message TEXT NOT NULL
);

CREATE TABLE Dietary_Restrictions (
    restriction_id INTEGER PRIMARY KEY AUTOINCREMENT,
    restriction_name VARCHAR(100) UNIQUE NOT NULL,
    created_by INTEGER NULL, 
    FOREIGN KEY (created_by) REFERENCES Users(user_id) ON DELETE SET NULL
);

CREATE TABLE User_Dietary_Restrictions (
    user_id INTEGER NOT NULL,
    restriction_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, restriction_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (restriction_id) REFERENCES Dietary_Restrictions(restriction_id) ON DELETE CASCADE
);

CREATE TABLE Recipe_Dietary_Restrictions (
    recipe_id INTEGER NOT NULL,
    restriction_id INTEGER NOT NULL,
    PRIMARY KEY (recipe_id, restriction_id),
    FOREIGN KEY (recipe_id) REFERENCES Recipes(recipe_id) ON DELETE CASCADE,
    FOREIGN KEY (restriction_id) REFERENCES Dietary_Restrictions(restriction_id) ON DELETE CASCADE
);

-- username: john_wick
-- password : dummyhash
INSERT INTO Users (
    username, password_hash, first_name, last_name, birthday, email, profile_picture
) VALUES (
    'john_wick',
    '$2b$10$fIdByBejJWSt9TthqykSYOrWSJaSB5J/Ki8qBsGd8b2T.Q7M7NYDu',
    'John',
    'Wick',
    '1964-09-12',
    'john@example.com',
    '/images/profiles/cat.jpg'
);

-- username: james_bond
-- password: 1234
INSERT INTO Users (
    username, password_hash, first_name, last_name, birthday, email, profile_picture
) VALUES (
    'james_bond',
    '$2b$10$.O4jKvxw6d2RIwA48yIOLOELPZAsO/iYciHfE51I/utLRuUV23bQC',
    'James',
    'Bond',
    '1920-11-20',
    'james@example.com',
    '/images/profiles/cat2.jpg'
);

-- username: johndoe
-- password : password
INSERT INTO Users (username, password_hash, first_name, last_name, birthday, email, role, is_active)
VALUES ('johndoe', '$2b$10$oBgO8MGxHrf7b0nr19xPiewENnHfjewVQZ1S0AJ7.OB8ko640MsUS', 'John', 'Doe', '1990-01-01', 'johndoe@example.com', 'user', TRUE);

-- Restrictions
INSERT INTO Dietary_Restrictions (restriction_name) VALUES
('Vegan'),
('Vegetarian'),
('Gluten-Free'),
('Dairy-Free'),
('Nut-Free'),
('Keto'),
('Halal'),
('Kosher');

-- Recipe 1: Chicken Noodle Soup
INSERT INTO Recipes (user_id, title, description, image_url, servings, prep_time, yield, cook_time)
VALUES (1, 'Chicken Noodle Soup', 'A comforting and flavorful chicken noodle soup made with tender chicken, vegetables, and egg noodles in a savory broth.', 
'/images/recipes/Noodle.jpg', '6', '15 minutes', '1.5 cups of soup', '30 minutes');

-- Recipe 2: Ramen

INSERT INTO Recipes (user_id, title, description, image_url, servings, prep_time, yield, cook_time)
VALUES (2, 'Ramen', 'A comforting and savory bowl of Japanese ramen with a rich broth, tender noodles, and flavorful toppings.', 
'/images/recipes/Ramen.jpg', '2', '10 minutes', '1 bowl', '15 minutes');

-- Recipe 3: Chinese Fried Noodles

INSERT INTO Recipes (user_id, title, description, image_url, servings, prep_time, yield, cook_time)
VALUES (1, 'Chinese Fried Noodles', 'Delicious stir-fried Chinese noodles with vegetables and a savory soy-based sauce.', 
'/images/recipes/FriedNoodles.jpg', '4', '10 minutes', '1 plate', '15 minutes');

--  Recipe 4: Spaghetti Bolognese

INSERT INTO Recipes (user_id, title, description, image_url, servings, prep_time, yield, cook_time)
VALUES (2, 'Spaghetti Bolognese', 'A classic Italian pasta dish with a rich meat and tomato sauce.', 
'/images/recipes/Spag.jpg', '4', '15 minutes', '1 plate', '45 minutes');

-- Recipe 5: Mushroom Risotto
INSERT INTO Recipes (user_id, title, description, image_url, servings, prep_time, yield, cook_time)
VALUES (1, 'Mushroom Risotto', 'A creamy and delicious mushroom risotto with Arborio rice, white wine, and parmesan cheese.', 
'/images/recipes/mushroom.jpg', '4', '10 minutes', '1 plate', '30 minutes');

-- Ingredients for Chicken Noodle Soup
INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '2 tablespoons olive oil or butter', 1);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '1 medium onion, diced', 2);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '3 carrots, peeled and sliced', 3);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '2 celery stalks, sliced', 4);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '3 cloves garlic, minced', 5);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '8 cups chicken broth', 6);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '2 bay leaves', 7);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '1 teaspoon dried thyme', 8);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '1 teaspoon dried parsley', 9);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '½ teaspoon black pepper', 10);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '½ teaspoon salt', 11);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '1 teaspoon lemon juice (optional)', 12);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '2 cups cooked and shredded chicken', 13);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (1, '6 ounces egg noodles', 14);

-- Ingredients for Ramen

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (2, '2 cups chicken broth', 1);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (2, '1 pack ramen noodles', 2);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (2, '1 boiled egg, halved', 3);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (2, '2 green onions, sliced', 4);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (2, '1 tablespoon soy sauce', 5);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (2, '1 teaspoon sesame oil', 6);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (2, '1 sheet nori (seaweed)', 7);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (2, '1/2 teaspoon chili paste (optional)', 8);

-- Ingredients for Chinese Fried Noodles

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (3, '8 oz egg noodles', 1);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (3, '1 tablespoon vegetable oil', 2);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (3, '1/2 cup bell peppers, sliced', 3);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (3, '1/2 cup carrots, julienned', 4);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (3, '1/2 cup cabbage, shredded', 5);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (3, '2 tablespoons soy sauce', 6);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (3, '1 teaspoon oyster sauce', 7);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (3, '1/2 teaspoon sesame oil', 8);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (3, '1/2 teaspoon sugar', 9);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (3, 'Green onions for garnish', 10);

-- Ingredients for Spaghetti

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, '8 oz spaghetti', 1);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, '1 tablespoon olive oil', 2);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, '1 medium onion, diced', 3);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, '2 cloves garlic, minced', 4);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, '1/2 pound ground beef', 5);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, '1 can (14 oz) crushed tomatoes', 6);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, '1 tablespoon tomato paste', 7);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, '1 teaspoon dried basil', 8);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, '1 teaspoon dried oregano', 9);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, 'Salt and pepper to taste', 10);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (4, 'Grated parmesan cheese (optional)', 11);

-- Ingredients for Mushroom Risotto
INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, '2 tablespoons olive oil', 1);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, '1 small onion, finely chopped', 2);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, '2 cloves garlic, minced', 3);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, '1 cup Arborio rice', 4);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, '1/2 cup dry white wine', 5);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, '4 cups chicken or vegetable broth, warmed', 6);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, '1 cup mushrooms, sliced', 7);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, '1/2 cup grated Parmesan cheese', 8);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, '2 tablespoons butter', 9);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, 'Salt and pepper to taste', 10);

INSERT INTO Ingredients (recipe_id, ingredient_name, ingredient_order)
VALUES (5, 'Fresh parsley, chopped (for garnish)', 11);

-- Instructions for Chicken Noodle Soup

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (1, 'Heat olive oil or butter over medium heat. Add onion, carrots, and celery. Sauté for about 5 minutes.', 1);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (1, 'Add minced garlic and cook for 30 seconds until fragrant.', 2);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (1, 'Add chicken broth, bay leaves, thyme, parsley, black pepper, and salt. Bring to a boil.', 3);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (1, 'Reduce heat and simmer for 15–20 minutes until vegetables are tender.', 4);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (1, 'Add shredded chicken and noodles. Cook for another 8–10 minutes until noodles are tender.', 5);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (1, 'Remove bay leaves and add lemon juice (optional).', 6);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (1, 'Serve hot and garnish with fresh parsley.', 7);

-- Instructions for Ramen

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (2, 'Bring chicken broth to a boil in a pot.', 1);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (2, 'Add ramen noodles and cook according to package instructions.', 2);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (2, 'Stir in soy sauce and sesame oil.', 3);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (2, 'Transfer to a bowl and top with boiled egg, green onions, nori, and chili paste.', 4);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (2, 'Serve hot and enjoy.', 5);

-- Instructions for Chinese Fried Noodles

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (3, 'Boil egg noodles according to package instructions and set aside.', 1);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (3, 'Heat vegetable oil in a wok over high heat.', 2);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (3, 'Add bell peppers, carrots, and cabbage. Stir-fry for 2 minutes.', 3);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (3, 'Add the noodles and mix well.', 4);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (3, 'Add soy sauce, oyster sauce, sesame oil, and sugar. Stir until combined.', 5);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (3, 'Garnish with green onions and serve hot.', 6);

-- Instructions for Spaghetti

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (4, 'Boil spaghetti according to package instructions.', 1);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (4, 'Heat olive oil in a large pan over medium heat.', 2);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (4, 'Add onion and garlic. Sauté until soft.', 3);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (4, 'Add ground beef. Cook until browned.', 4);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (4, 'Add crushed tomatoes, tomato paste, basil, oregano, salt, and pepper.', 5);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (4, 'Simmer for 20–25 minutes until sauce thickens.', 6);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (4, 'Serve sauce over spaghetti. Top with parmesan if desired.', 7);

-- Instructions for Mushroom Risotto
INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (5, 'Heat olive oil in a large pan over medium heat.', 1);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (5, 'Add the chopped onion and garlic, sauté until softened.', 2);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (5, 'Add the Arborio rice and cook for 2 minutes, stirring frequently.', 3);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (5, 'Pour in the white wine and cook until it has evaporated.', 4);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (5, 'Add the warm broth, one ladle at a time, stirring continuously until absorbed.', 5);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (5, 'Repeat until the rice is tender and creamy (about 20 minutes).', 6);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (5, 'Stir in the mushrooms and cook for another 5 minutes.', 7);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (5, 'Add Parmesan cheese, butter, salt, and pepper to taste.', 8);

INSERT INTO Instructions (recipe_id, instruction_text, step_order)
VALUES (5, 'Garnish with fresh parsley and serve hot.', 9);

-- Comments

INSERT INTO Comments (recipe_id, user_id, content)
VALUES (1, 2, 'Delicious and comforting!');

INSERT INTO Comments (recipe_id, user_id, content)
VALUES (2, 1, 'Loved the broth and noodles!');

INSERT INTO Comments (recipe_id, user_id, content)
VALUES (3, 2, 'Perfect seasoning and texture.');

INSERT INTO Comments (recipe_id, user_id, content)
VALUES (4, 1, 'Great balance of sauce and pasta.');

INSERT INTO Comments (recipe_id, user_id, content)
VALUES (5, 2, 'Creamy and full of flavor! The mushrooms were cooked perfectly.');


-- Ratings for Recipe 1: Chicken Noodle Soup
-- User 2 (James Bond) rates Recipe 1
INSERT INTO Ratings (user_id, recipe_id, appearance_rating, taste_rating, created_at)
VALUES (2, 1, 4, 5, CURRENT_TIMESTAMP);

-- User 3 (John Doe) rates Recipe 1
INSERT INTO Ratings (user_id, recipe_id, appearance_rating, taste_rating, created_at)
VALUES (3, 1, 5, 4, CURRENT_TIMESTAMP);

-- Ratings for Recipe 2: Ramen
-- User 1 (John Wick) rates Recipe 2
INSERT INTO Ratings (user_id, recipe_id, appearance_rating, taste_rating, created_at)
VALUES (1, 2, 5, 5, CURRENT_TIMESTAMP);

-- User 3 (John Doe) rates Recipe 2
INSERT INTO Ratings (user_id, recipe_id, appearance_rating, taste_rating, created_at)
VALUES (3, 2, 4, 5, CURRENT_TIMESTAMP);

-- Ratings for Recipe 3: Chinese Fried Noodles
-- User 2 (James Bond) rates Recipe 3
INSERT INTO Ratings (user_id, recipe_id, appearance_rating, taste_rating, created_at)
VALUES (2, 3, 3, 4, CURRENT_TIMESTAMP);

-- User 3 (John Doe) rates Recipe 3
INSERT INTO Ratings (user_id, recipe_id, appearance_rating, taste_rating, created_at) 
VALUES (3, 3, 4, 3, CURRENT_TIMESTAMP);

-- Ratings for Recipe 4: Spaghetti Bolognese
-- User 1 (John Wick) rates Recipe 4
INSERT INTO Ratings (user_id, recipe_id, appearance_rating, taste_rating, created_at)
VALUES (1, 4, 4, 4, CURRENT_TIMESTAMP);

-- User 3 (John Doe) rates Recipe 4
INSERT INTO Ratings (user_id, recipe_id, appearance_rating, taste_rating, created_at)
VALUES (3, 4, 5, 3, CURRENT_TIMESTAMP);

-- Update average ratings for all recipes
-- Recipe 1: Chicken Noodle Soup
UPDATE Recipes 
SET average_appearance_rating = (
    SELECT AVG(appearance_rating) 
    FROM Ratings 
    WHERE recipe_id = 1 
    AND appearance_rating IS NOT NULL
),
average_taste_rating = (
    SELECT AVG(taste_rating) 
    FROM Ratings 
    WHERE recipe_id = 1 
    AND taste_rating IS NOT NULL
)
WHERE recipe_id = 1;

-- Recipe 2: Ramen
UPDATE Recipes 
SET average_appearance_rating = (
    SELECT AVG(appearance_rating) 
    FROM Ratings 
    WHERE recipe_id = 2 
    AND appearance_rating IS NOT NULL
),
average_taste_rating = (
    SELECT AVG(taste_rating) 
    FROM Ratings 
    WHERE recipe_id = 2 
    AND taste_rating IS NOT NULL
)
WHERE recipe_id = 2;

-- Recipe 3: Chinese Fried Noodles
UPDATE Recipes 
SET average_appearance_rating = (
    SELECT AVG(appearance_rating) 
    FROM Ratings 
    WHERE recipe_id = 3 
    AND appearance_rating IS NOT NULL
),
average_taste_rating = (
    SELECT AVG(taste_rating) 
    FROM Ratings 
    WHERE recipe_id = 3 
    AND taste_rating IS NOT NULL
)
WHERE recipe_id = 3;

-- Recipe 4: Spaghetti Bolognese
UPDATE Recipes 
SET average_appearance_rating = (
    SELECT AVG(appearance_rating) 
    FROM Ratings 
    WHERE recipe_id = 4 
    AND appearance_rating IS NOT NULL
),
average_taste_rating = (
    SELECT AVG(taste_rating) 
    FROM Ratings 
    WHERE recipe_id = 4 
    AND taste_rating IS NOT NULL
)
WHERE recipe_id = 4;

COMMIT;