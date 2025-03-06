document.addEventListener("DOMContentLoaded", function () {
    // Get references to input fields, buttons, and lists for dietary restrictions
    const dietaryInput = document.getElementById("dietaryInput");
    const suggestionsBox = document.getElementById("suggestions");
    const addRestrictionBtn = document.getElementById("addRestrictionBtn");
    const selectedRestrictionsList = document.getElementById("selectedRestrictions");
    const existingRestrictionsList = document.getElementById("existingRestrictions");
    const hiddenDietaryRestrictions = document.getElementById("hiddenDietaryRestrictions");

    // Arrays to store all available dietary restrictions, user-selected ones, and removed ones
    let allRestrictions = [];
    let selectedRestrictions = [];
    let removedRestrictions = [];  

    // Fetches all available dietary restrictions from the server
    async function fetchDietaryRestrictions() {
        try {
            const response = await fetch("/recipes/dietary-restrictions/all");
            if (!response.ok) throw new Error("Failed to fetch dietary restrictions");

            allRestrictions = await response.json();
        } catch (error) {
            console.error("Error fetching dietary restrictions:", error);
        }
    }

    // Updates the hidden input field with the selected and removed dietary restrictions
    function updateHiddenInput() {
        hiddenDietaryRestrictions.value = JSON.stringify({
            selected: selectedRestrictions,
            removed: removedRestrictions
        });
    }

    // Adds event listeners to remove existing dietary restrictions
    existingRestrictionsList.querySelectorAll(".remove-existing-restriction").forEach(button => {
        button.addEventListener("click", function () {
            const restrictionItem = this.parentElement;
            const restrictionName = restrictionItem.querySelector(".restriction-text").innerText;

            // Removes the restriction from the UI and marks it as removed
            restrictionItem.remove();
            removedRestrictions.push(restrictionName);
            updateHiddenInput();
        });
    });

    // Handles dietary restriction input and displays autocomplete suggestions
    dietaryInput.addEventListener("input", function () {
        const search = this.value.trim().toLowerCase();
        suggestionsBox.innerHTML = "";
        suggestionsBox.style.display = "none";
        addRestrictionBtn.disabled = true;

        if (search.length === 0) return;

        // Filter restrictions based on user input
        const filtered = allRestrictions.filter(r =>
            r.restriction_name.toLowerCase().includes(search)
        );

        // If no matching restriction is found, allow the user to add a new one
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
            // Show matching dietary restrictions in a dropdown
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

        // Position the dropdown correctly
        const parent = dietaryInput.closest(".dietary-container");
        parent.appendChild(suggestionsBox);
        suggestionsBox.style.position = "absolute";
        suggestionsBox.style.top = `${dietaryInput.offsetHeight + 5}px`;
        suggestionsBox.style.left = "0px";
        suggestionsBox.style.width = "100%";
        suggestionsBox.style.display = "block";
    });

    // Hides the suggestions dropdown when clicking outside
    document.addEventListener("click", function (event) {
        if (!dietaryInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
            suggestionsBox.style.display = "none";
        }
    });

    // Adds a new dietary restriction to the selected list
    addRestrictionBtn.addEventListener("click", function () {
        const restrictionName = dietaryInput.value.trim();
        if (!restrictionName || selectedRestrictions.includes(restrictionName)) return;

        // Adds the restriction to the selected list and updates the hidden input
        selectedRestrictions.push(restrictionName);
        updateHiddenInput();

        // Creates a list item with a remove button
        const li = document.createElement("li");
        li.innerHTML = `${restrictionName} <button class="remove-btn">X</button>`;
        li.querySelector(".remove-btn").addEventListener("click", function () {
            selectedRestrictions = selectedRestrictions.filter(item => item !== restrictionName);
            updateHiddenInput();
            li.remove();
        });

        // Appends the new restriction to the list
        selectedRestrictionsList.appendChild(li);
        dietaryInput.value = "";
        addRestrictionBtn.disabled = true;
    });

    // Fetches all dietary restrictions when the page loads
    fetchDietaryRestrictions();
});
