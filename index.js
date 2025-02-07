/**
* index.js
* This is your main app entry point
*/

const express = require('express');
const session = require('express-session');
const bodyParser = require("body-parser");
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 3000;

// Set up session middleware
app.use(session({
    secret: 'your_secret_key', // Change this to a secure random value
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Middleware to make session user ID available in templates
app.use((req, res, next) => {
    res.locals.userId = req.session.userId || null;
    next();
});


// bodyParser middleware
app.use(bodyParser.json());


// Configure body parser
app.use(bodyParser.urlencoded({ extended: true }));

// Set the app to use EJS for rendering
app.set('view engine', 'ejs');

// Set location of static files
app.use(express.static(__dirname + '/public'));

// Set up SQLite database
global.db = new sqlite3.Database('./database.db', function(err) {
    if (err) {
        console.error(err);
        process.exit(1); // Bail out if we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // Enforce foreign key constraints
    }
});

// Import routes
const mainRoutes = require('./routes/main');
const profileRoutes = require('./routes/profile');
const recipesRoutes = require('./routes/recipes');
const userRoutes = require('./routes/users');

// Use routes
app.use('/', mainRoutes);
app.use('/profile', profileRoutes);
app.use('/recipes', recipesRoutes);
app.use('/users', userRoutes);


// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
