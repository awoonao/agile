document.addEventListener("DOMContentLoaded", function () {
    const profileButtons = document.querySelectorAll(".profile-btn");
    const profileData = document.getElementById("profileData");
    const messageBox = document.getElementById("profile-message");

    if (messageBox) {
        setTimeout(() => {
            messageBox.style.display = "none";
        }, 4000);
    }

    function attachImageUploadHandler() {
        console.log("Initializing image upload handler...");
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
        } else {
            console.warn("Image upload elements not found.");
        }
    }

    function attachUnsaveEventListeners() {
        console.log("Initializing unsave event listeners...");
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
                    console.log(data.message);
                    loadProfileSection("saved-recipes");
                })
                .catch(error => console.error("Error unsaving recipe:", error));
            });
        });
    }

    async function loadProfileSection(section) {
        try {
            console.log(`Loading section: ${section}`);
            const response = await fetch(`/profile/edit-profile/${section}`);
    
            if (!response.ok) {
                throw new Error(`Failed to load section: ${section}`);
            }
    
            const data = await response.text();
            profileData.innerHTML = data;
    
            // Attach necessary event listeners after loading content
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
                attachDeleteEventListeners();  //Attach delete event listeners
            }
        } catch (error) {
            console.error(`Error loading ${section}:`, error);
            profileData.innerHTML = "<p>Error loading section.</p>";
        }
    }    

    // Attach delete event listeners after "My Creations" section loads
    function initializeMyCreations() {
        console.log("Initializing My Creations functionality...");

        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", function () {
                const recipeId = this.getAttribute("data-recipe-id");
                confirmDelete(recipeId);
            });
        });
    }

    function attachDeleteEventListeners() {
        console.log("Attaching delete event listeners...");
    
        document.querySelectorAll(".delete-btn").forEach(button => {
            button.addEventListener("click", function () {
                const recipeId = this.getAttribute("data-recipe-id");
                confirmDelete(recipeId);
            });
        });
    }
    
    // Define delete confirmation function
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
    
    
    function initializeDietaryRestrictions() {
        console.log("Initializing dietary restrictions functionality...");

        const dietaryInput = document.getElementById("dietaryInput");
        const suggestionsBox = document.getElementById("suggestions");
        const addRestrictionBtn = document.getElementById("addRestrictionBtn");
        const userRestrictionsList = document.getElementById("userRestrictionsList");

        let allRestrictions = [];

        async function fetchDietaryRestrictions() {
            try {
                console.log("Fetching dietary restrictions...");
                const response = await fetch("/profile/edit-profile/dietary-restrictions/all");
                console.log("API response status:", response.status);

                if (!response.ok) throw new Error("Failed to fetch dietary restrictions");

                allRestrictions = await response.json();
                console.log("Fetched restrictions:", allRestrictions);
            } catch (error) {
                console.error("Error fetching dietary restrictions:", error);
            }
        }

        async function loadUserRestrictions() {
            console.log("Fetching user's dietary restrictions...");
            try {
                const response = await fetch("/profile/edit-profile/dietary-restrictions/user");
                if (!response.ok) throw new Error("Failed to fetch user dietary restrictions");
                const data = await response.json();
                console.log("User's dietary restrictions:", data);

                userRestrictionsList.innerHTML = "";
                data.forEach(restriction => {
                    const li = document.createElement("li");
                    li.innerHTML = `${restriction.restriction_name} 
                        <button class="remove-btn" data-id="${restriction.restriction_id}">X</button>`;
                    userRestrictionsList.appendChild(li);
                });

                document.querySelectorAll(".remove-btn").forEach(button => {
                    button.addEventListener("click", function () {
                        console.log("Removing restriction ID:", this.dataset.id);
                        removeDietaryRestriction(this.dataset.id);
                    });
                });
            } catch (error) {
                console.error("Error loading user's dietary restrictions:", error);
            }
        }

        function removeDietaryRestriction(restriction_id) {
            console.log("Removing dietary restriction with ID:", restriction_id);
        
            fetch("/profile/edit-profile/dietary-restrictions/remove", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restriction_id })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    console.error("Error removing restriction:", data.error);
                } else {
                    console.log("Restriction removed successfully.");
                    loadUserRestrictions(); // Refresh list after deletion
                }
            })
            .catch(error => console.error("Error removing restriction:", error));
        }
        

        dietaryInput.addEventListener("input", function () {
            const search = this.value.trim().toLowerCase();
            console.log("User input:", search);
            suggestionsBox.innerHTML = "";
            suggestionsBox.style.display = "none";
            addRestrictionBtn.disabled = true;

            if (search.length > 0) {
                console.log("Filtering suggestions...");
                const filtered = allRestrictions.filter(r =>
                    r.restriction_name.toLowerCase().includes(search)
                );

                if (filtered.length === 0) {
                    console.log("No matches found. Allowing new entry.");
                    const noResultDiv = document.createElement("div");
                    noResultDiv.innerText = `Add "${this.value}"`;
                    noResultDiv.classList.add("suggestion-item", "new-entry");
                    noResultDiv.addEventListener("click", function () {
                        console.log("User wants to add new restriction:", search);
                        dietaryInput.value = search;
                        addRestrictionBtn.disabled = false;
                        suggestionsBox.innerHTML = "";
                        suggestionsBox.style.display = "none";
                    });
                    suggestionsBox.appendChild(noResultDiv);
                    addRestrictionBtn.disabled = false;
                } else {
                    console.log("Matches found:", filtered);
                    filtered.forEach(r => {
                        const div = document.createElement("div");
                        div.innerText = r.restriction_name;
                        div.classList.add("suggestion-item");
                        div.addEventListener("click", function () {
                            console.log("User selected:", r.restriction_name);
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

        document.addEventListener("click", function (event) {
            if (!dietaryInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
                console.log("Clicked outside, hiding suggestions.");
                suggestionsBox.style.display = "none";
            }
        });

        addRestrictionBtn.addEventListener("click", function () {
            const restrictionName = dietaryInput.value.trim();

            if (!restrictionName) {
                alert("Please enter a dietary restriction.");
                return;
            }

            console.log("Adding restriction:", restrictionName);
            fetch("/profile/edit-profile/dietary-restrictions/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ restriction_name: restrictionName })
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                    console.error("Error adding restriction:", data.error);
                } else {
                    console.log("Restriction added successfully:", data);
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

    profileButtons.forEach((button) => {
        button.addEventListener("click", function () {
            profileButtons.forEach((btn) => btn.classList.remove("active"));
            this.classList.add("active");

            const section = this.dataset.section;
            console.log(`Navigating to: ${section}`);

            loadProfileSection(section);
        });
    });

    loadProfileSection("personal-information");
});
