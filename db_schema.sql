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
    is_pinned BOOLEAN DEFAULT FALSE,
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
    ingredient_name VARCHAR(100) NOT NULL,
    substitution VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    votes INTEGER DEFAULT 0,
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

-- password : dummyhash
INSERT INTO Users (
    username,
    password_hash,
    first_name,
    last_name,
    email
) VALUES (
    'testuser',
    '$2b$10$fIdByBejJWSt9TthqykSYOrWSJaSB5J/Ki8qBsGd8b2T.Q7M7NYDu', 
    'Test',
    'User',
    'test@example.com'
);

-- password : password
INSERT INTO Users (username, password_hash, first_name, last_name, birthday, email, role, is_active)
VALUES ('test1', '$2b$10$oBgO8MGxHrf7b0nr19xPiewENnHfjewVQZ1S0AJ7.OB8ko640MsUS', 'John', 'Doe', '1990-01-01', 'johndoe@example.com', 'user', TRUE);


COMMIT;