document.addEventListener("DOMContentLoaded", async function () {
    const recipeId = document.body.dataset.recipeId; // Get recipeId from the template

    // Function to load user's existing ratings
    async function loadUserRatings() {
        try {
            const response = await fetch(`/recipes/${recipeId}/user-ratings`);
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

    // Load existing ratings when page loads
    loadUserRatings();
});

// --------------------------------------------------------------
// Handle rating submission
document.addEventListener("DOMContentLoaded", function () {
    const recipeId = document.body.dataset.recipeId; // Get recipeId from the template

    function handleRating(ratingType, value) {
        fetch(`/recipes/${recipeId}/rate/${ratingType}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rating: value }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`${ratingType} rating saved:`, value);
                location.reload(); // Refresh to show new average
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Error saving rating");
        });
    }

    // Handle appearance ratings
    document.querySelectorAll('input[name="appearance-rate"]').forEach(star => {
        star.addEventListener("change", function () {
            handleRating("appearance", parseInt(this.value));
        });
    });

    // Handle taste ratings
    document.querySelectorAll('input[name="taste-rate"]').forEach(star => {
        star.addEventListener("change", function () {
            handleRating("taste", parseInt(this.value));
        });
    });
});
