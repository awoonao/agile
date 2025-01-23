/**
* index.js
* This is your main app entry point
*/

const express = require('express');
const app = express();
const port = 3000;
var bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // set the app to use ejs for rendering
app.use(express.static(__dirname + '/public')); // set location of static files

// Set up SQLite
const sqlite3 = require('sqlite3').verbose();
global.db = new sqlite3.Database('./database.db',function(err){
    if(err){
        console.error(err);
        process.exit(1); // bail out we can't connect to the DB
    } else {
        console.log("Database connected");
        global.db.run("PRAGMA foreign_keys=ON"); // tell SQLite to pay attention to foreign key constraints
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

// Make the web application listen for HTTP requests
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
