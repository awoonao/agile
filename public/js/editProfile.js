document.addEventListener("DOMContentLoaded", function () {
    const profileButtons = document.querySelectorAll(".profile-btn");
    const profileData = document.getElementById("profileData");

    async function loadProfileSection(section) {
        try {
            console.log(`Loading section: ${section}`); // Debugging log
            const response = await fetch(`/profile/edit-profile/${section}`);

            if (!response.ok) throw new Error("Failed to load section");

            const data = await response.text();
            profileData.innerHTML = data; // Update UI dynamically
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
            console.log(`Navigating to: ${section}`); // Debugging log

            loadProfileSection(section);
        });
    });

    // Load the default section when the page loads
    loadProfileSection("personal-information");
});
