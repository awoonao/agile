# Swaply

![Logo](public/images/logo.png)

Swaply is a recipe-sharing platform designed to help users discover, create, and modify recipes with substitution features and tags. Users can browse diverse recipes, share their creations, and explore alternative ingredient swaps suggested by the community. The platform also features a dual-rating system, allowing users to rate recipes based on both appearance and recreation experience, ensuring valuable feedback for others. 


## Prerequisites

* NodeJS 
    - Instructions at https://nodejs.org/en/
* Sqlite3 
    - Instructions at https://www.tutorialspoint.com/sqlite/sqlite_installation.htm 
    - Note that the latest versions of the Mac OS and Linux come with SQLite pre-installed

## Setup instructions 

1. Install Dependencies 
    - Run ```npm install``` from the project directory to install all the node packages.

2. Build Database
   - on Mac or Linux: Run ```npm run build-db``` to create the database 
   - on Windows: Run ```npm run build-db-win``` to create the database 

3. Start serving the web app
   * Run ```npm run start``` (Access via http://localhost:3000)

 #### Optional
 
```npm run clean-db``` to delete the database on Mac or Linux before rebuilding it for a fresh start
```npm run clean-db-win``` to delete the database on Windows before rebuilding it for a fresh start

## Key Routes
Here are some important routes in the application:

- Homepage: http://localhost:3000/
- Main Recipe: http://localhost:3000/recipes
- Login: http://localhost:3000/users/login
- Sign Up: http://localhost:3000/users/signup
- Forgot Password: http://localhost:3000/users/forgot-password-email
- reate Recipe: http://localhost:3000/recipes/create-recipe
- About Us: http://localhost:3000/about


## Folder Structure 

The key files and folders in this project are:
- /views: Contains all the EJS templates for rendering HTML pages.
- /routes: Contains the route definitions for the application.
- /public: Holds the static assets like CSS files, images, and JavaScript files that manipulate the DOM.
- Database and Schema Files: Located at the root of the project directory.
