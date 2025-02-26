// Client-side JavaScript for recipe saving functionality
document.addEventListener("DOMContentLoaded", function () {
    const saveToggle = document.getElementById("cb5");
    if (!saveToggle) return; // Exit if the save toggle doesn't exist
  
    const recipeId = document.body.dataset.recipeId;
    if (!recipeId) {
      console.error("Recipe ID not found in data attribute");
      return;
    }
  
    // Check if this recipe is already saved when page loads
    checkSavedStatus();
  
    // Toggle save/unsave on checkbox change
    saveToggle.addEventListener("change", function () {
      if (this.checked) {
        saveRecipe();
      } else {
        unsaveRecipe();
      }
    });
  
    /**
     * Check if the current recipe is saved by the user
     */
    function checkSavedStatus() {
      fetch(`/recipes/check-saved/${recipeId}`)
          .then(response => {
            console.log("Response Status:", response.status);
            console.log("Response OK:", response.ok);
              if (response.status === 401) {
                  // User is not logged in
                  throw new Error("Login required");
              }
              return response.json();
          })
          .then(data => {
              saveToggle.checked = data.saved;
          })
          
    }
  
    /**
     * Save the current recipe
     */
    function saveRecipe() {
      fetch("/recipes/save-recipe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId }),
      })
        .then((response) => {
          if (response.status === 401) {
            saveToggle.checked = false;
          }
          return response.json();
        })
        .then((data) => {
          console.log(data.message);
        })
        .catch((error) => {
          console.error("Error saving recipe:", error);
          if (error.message !== "Login required") {
            saveToggle.checked = false;
            window.location.href = '/users/login?returnTo=' + encodeURIComponent(window.location.pathname);
          }
        });
    }
  
    /**
     * Unsave the current recipe
     */
    function unsaveRecipe() {
      fetch("/recipes/unsave-recipe", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipeId }),
      })
        .then((response) => {
          if (response.status === 401) {
            // User is not logged in, redirect to login page
            saveToggle.checked = true;
           
          }
          return response.json();
        })
        .then((data) => {
          console.log(data.message);
        })
        .catch((error) => {
          console.error("Error unsaving recipe:", error);
          if (error.message !== "Login required") {
            saveToggle.checked = true;
            window.location.href = '/users/login?returnTo=' + encodeURIComponent(window.location.pathname);
          }
        });
    }
  });