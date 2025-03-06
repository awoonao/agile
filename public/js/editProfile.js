document.addEventListener("DOMContentLoaded", function () {
    const profileButtons = document.querySelectorAll(".profile-btn");
    const profileData = document.getElementById("profileData");
    const messageBox = document.getElementById("profile-message");

    // Automatically hide message box after 4 seconds
    if (messageBox) {
        setTimeout(() => {
            messageBox.style.display = "none";
        }, 4000);
    }

    // Function to handle profile picture uploads and preview changes
    function attachImageUploadHandler() {
        const formProfilePicture = document.getElementById("profilePicture");
        const sidebarProfilePicture = document.getElementById("sidebarProfilePicture");
        const imageUpload = document.getElementById("imageUpload");

        if (formProfilePicture && imageUpload) {
            formProfilePicture.addEventListener("click", function () {
                imageUpload.click();
            });

            imageUpload.addEventListener("change", function () {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        formProfilePicture.src = e.target.result;
                        if (sidebarProfilePicture) {
                            sidebarProfilePicture.src = e.target.result;
                        }
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
    }

    // Function to handle the unsave action for saved recipes
    function attachUnsaveEventListeners() {
        document.querySelectorAll(".unsave-btn").forEach(button => {
            button.addEventListener("click", function () {
                const recipeId = this.dataset.recipeId;

                fetch("/recipes/unsave-recipe", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ recipeId }),
                })
                .then(response => response.json())
                .then(data => {
                    loadProfileSection("saved-recipes");
                })
                .catch(error => console.error("Error unsaving recipe:", error));
            });
        });
    }

    // Function to dynamically load profile sections when a tab is clicked
    async function loadProfileSection(section) {
        try {
            const response = await fetch(`/profile/edit-profile/${section}`);
    
            if (!response.ok) {
                throw new Error(`Failed to load section: ${section}`);
            }
    
            const data = await response.text();
            profileData.innerHTML = data;
    
            // Attach relevant event listeners based on the section being loaded
            if (section === "personal-information") {
                attachImageUploadHandler();
            }
            if (section === "saved-recipes") {
                attachUnsaveEventListeners();
            }
            if (section === "dietary-restrictions") {
                initializeDietaryRestrictions();
            }
            if (section === "my-creations") {
                attachDeleteEventListeners();
            }
        } catch (error) {
            console.error(`Error loading ${section}:`, error);
            profileData.innerHTML = "<p>Error loading section.</p>";
        }
    }    

    // Function to initialize delete event listeners for "My Creations"
    function attachDeleteEventListeners() {
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", function () {
                const recipeId = this.getAttribute("data-recipe-id");
                confirmDelete(recipeId);
            });
        });
    }
    
    // Function to confirm and delete a recipe
    function confirmDelete(recipeId) {
        const confirmation = confirm("Are you sure you want to delete this recipe? This action cannot be undone.");
        
        if (confirmation) {
            fetch(`/profile/edit-profile/my-creations/${recipeId}/delete`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert("Error deleting recipe: " + data.error);
                } else {
                    alert("Recipe deleted successfully.");
                    loadProfileSection("my-creations"); 
                }
            })
            .catch(error => console.error("Error deleting recipe:", error));
        }
    }
    
    // Function to initialize dietary restriction selection
    function initializeDietaryRestrictions() {
        const dietaryInput = document.getElementById("dietaryInput");
        const suggestionsBox = document.getElementById("suggestions");
        const addRestrictionBtn = document.getElementById("addRestrictionBtn");
        const userRestrictionsList = document.getElementById("userRestrictionsList");

        let allRestrictions = [];

        // Fetch all dietary restrictions from the server
        async function fetchDietaryRestrictions() {
            try {
                const response = await fetch("/profile/edit-profile/dietary-restrictions/all");

                if (!response.ok) throw new Error("Failed to fetch dietary restrictions");

                allRestrictions = await response.json();
            } catch (error) {
                console.error("Error fetching dietary restrictions:", error);
            }
        }

        // Load the current user's dietary restrictions
        async function loadUserRestrictions() {
            try {
                const response = await fetch("/profile/edit-profile/dietary-restrictions/user");
                if (!response.ok) throw new Error("Failed to fetch user dietary restrictions");
                const data = await response.json();

                userRestrictionsList.innerHTML = "";
                data.forEach(restriction => {
                    const li = document.createElement("li");
                    li.innerHTML = `${restriction.restriction_name} 
                        <button class="remove-btn" data-id="${restriction.restriction_id}">X</button>`;
                    userRestrictionsList.appendChild(li);
                });

                document.querySelectorAll(".remove-btn").forEach(button => {
                    button.addEventListener("click", function () {
                        removeDietaryRestriction(this.dataset.id);
                    });
                });
            } catch (error) {
                console.error("Error loading user's dietary restrictions:", error);
            }
        }

        // Remove a dietary restriction from the user's profile
        function removeDietaryRestriction(restriction_id) {
            fetch("/profile/edit-profile/dietary-restrictions/remove", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restriction_id })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.error) {
                    loadUserRestrictions();
                }
            })
            .catch(error => console.error("Error removing restriction:", error));
        }

        // Display suggested dietary restrictions as the user types
        dietaryInput.addEventListener("input", function () {
            const search = this.value.trim().toLowerCase();
            suggestionsBox.innerHTML = "";
            suggestionsBox.style.display = "none";
            addRestrictionBtn.disabled = true;

            if (search.length > 0) {
                const filtered = allRestrictions.filter(r =>
                    r.restriction_name.toLowerCase().includes(search)
                );

                if (filtered.length === 0) {
                    const noResultDiv = document.createElement("div");
                    noResultDiv.innerText = `Add "${this.value}"`;
                    noResultDiv.classList.add("suggestion-item", "new-entry");
                    noResultDiv.addEventListener("click", function () {
                        dietaryInput.value = search;
                        addRestrictionBtn.disabled = false;
                        suggestionsBox.innerHTML = "";
                        suggestionsBox.style.display = "none";
                    });
                    suggestionsBox.appendChild(noResultDiv);
                    addRestrictionBtn.disabled = false;
                } else {
                    filtered.forEach(r => {
                        const div = document.createElement("div");
                        div.innerText = r.restriction_name;
                        div.classList.add("suggestion-item");
                        div.addEventListener("click", function () {
                            dietaryInput.value = r.restriction_name;
                            addRestrictionBtn.disabled = false;
                            suggestionsBox.innerHTML = "";
                            suggestionsBox.style.display = "none";
                        });
                        suggestionsBox.appendChild(div);
                    });
                }

                suggestionsBox.style.display = "block";
            }
        });

        // Hide dietary restriction suggestions when clicking outside
        document.addEventListener("click", function (event) {
            if (!dietaryInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
                suggestionsBox.style.display = "none";
            }
        });

        // Handle adding a new dietary restriction
        addRestrictionBtn.addEventListener("click", function () {
            const restrictionName = dietaryInput.value.trim();

            if (!restrictionName) {
                alert("Please enter a dietary restriction.");
                return;
            }

            fetch("/profile/edit-profile/dietary-restrictions/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restriction_name: restrictionName })
            })
            .then(response => response.json())
            .then(data => {
                if (!data.error) {
                    dietaryInput.value = "";
                    addRestrictionBtn.disabled = true;
                    loadUserRestrictions();
                }
            })
            .catch(error => console.error("Error adding dietary restriction:", error));
        });

        fetchDietaryRestrictions();
        loadUserRestrictions();
    }

    // Handle navigation between profile sections
    profileButtons.forEach((button) => {
        button.addEventListener("click", function () {
            profileButtons.forEach((btn) => btn.classList.remove("active"));
            this.classList.add("active");

            const section = this.dataset.section;
            loadProfileSection(section);
        });
    });

    // Load the default section when the page loads
    loadProfileSection("personal-information");
});
