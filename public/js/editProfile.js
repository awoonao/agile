document.addEventListener("DOMContentLoaded", function () {
    const profileButtons = document.querySelectorAll(".profile-btn");
    const profileData = document.getElementById("profileData");
    const messageBox = document.getElementById("profile-message");

    if (messageBox) {
        setTimeout(() => {
            messageBox.style.display = "none";
        }, 4000); // Hide message after 4 seconds
    }

    async function loadProfileSection(section) {
        try {
            console.log(`Loading section: ${section}`);
            const response = await fetch(`/profile/edit-profile/${section}`);

            if (!response.ok) throw new Error("Failed to load section");

            const data = await response.text();
            profileData.innerHTML = data;

            if (section === "personal-information") {
                attachImageUploadHandler();
            }
            if (section === "saved-recipes") {
                attachUnsaveEventListeners();
            }
        } catch (error) {
            console.error(`Error loading ${section}:`, error);
            profileData.innerHTML = "<p>Error loading section.</p>";
        }
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

    function attachUnsaveEventListeners() {
        document.querySelectorAll(".unsave-btn").forEach(button => {
            button.addEventListener("click", function () {
                const recipeId = this.dataset.recipeId;

                fetch("/recipes/unsave-recipe", {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
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

    loadProfileSection("personal-information");
});
