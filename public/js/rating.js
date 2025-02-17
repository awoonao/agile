document.addEventListener("DOMContentLoaded", async function () {
  const recipeId = document.body.dataset.recipeId; // Get recipeId from the template

  // Function to load user's existing ratings
  async function loadUserRatings() {
    try {
      const response = await fetch(`/recipes/${recipeId}/user-review`);
      const ratings = await response.json();

      // Set appearance rating if it exists
      if (ratings.appearance_rating) {
        const appearanceRadio = document.querySelector(
          `input[name="appearance-rate"][value="${ratings.appearance_rating}"]`
        );
        if (appearanceRadio) appearanceRadio.checked = true;
      }

      // Set taste rating if it exists
      if (ratings.taste_rating) {
        const tasteRadio = document.querySelector(
          `input[name="taste-rate"][value="${ratings.taste_rating}"]`
        );
        if (tasteRadio) tasteRadio.checked = true;
      }
    } catch (error) {
      console.error("Error loading user ratings:", error);
    }
  }

  // Function to handle rating submission
  async function handleRating(ratingType, value) {
    try {
      const response = await fetch(`/recipes/${recipeId}/rate/${ratingType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: value }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(`Failed to save ${ratingType} rating`);
      }
      return data;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  // Function to handle comment submission
  async function handleComment(comment) {
    try {
      const response = await fetch(`/recipes/${recipeId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error("Failed to save comment");
      }
      return data;
    } catch (error) {
      console.error("Error:", error);
      throw error;
    }
  }

  // Handle submission of both ratings and comment
  document
    .getElementById("submit-review")
    .addEventListener("click", async function () {
      const appearanceRating = document.querySelector(
        'input[name="appearance-rate"]:checked'
      );
      const tasteRating = document.querySelector(
        'input[name="taste-rate"]:checked'
      );
      const comment = document.getElementById("recipe-comment").value.trim();

      if (!comment) {
        alert("Please enter a comment");
      }

      try {
        const promises = [];

        if (appearanceRating) {
          promises.push(
            handleRating("appearance", parseInt(appearanceRating.value))
          );
        }

        if (tasteRating) {
          promises.push(
            handleRating("taste", parseInt(tasteRating.value))
          );
        }

        // Always add comment
        promises.push(handleComment(comment));

        await Promise.all(promises);



        
        // Reload page to show updated ratings and comment
        location.reload();
      } catch (error) {
        alert("Error submitting review. Please try again.");
        console.error("Error:", error);
      }
    });
  // Load existing ratings when page loads
  loadUserRatings();
});
