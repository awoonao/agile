document.addEventListener("DOMContentLoaded", function () {
    const dietaryInput = document.getElementById("dietaryInput");
    const suggestionsBox = document.getElementById("suggestions");
    const addRestrictionBtn = document.getElementById("addRestrictionBtn");
    const selectedRestrictionsList = document.getElementById("selectedRestrictions");
    const existingRestrictionsList = document.getElementById("existingRestrictions");
    const hiddenDietaryRestrictions = document.getElementById("hiddenDietaryRestrictions");

    let allRestrictions = [];
    let selectedRestrictions = [];
    let removedRestrictions = [];  

    async function fetchDietaryRestrictions() {
        try {
            const response = await fetch("/recipes/dietary-restrictions/all");
            if (!response.ok) throw new Error("Failed to fetch dietary restrictions");

            allRestrictions = await response.json();
        } catch (error) {
            console.error("Error fetching dietary restrictions:", error);
        }
    }

    function updateHiddenInput() {
        hiddenDietaryRestrictions.value = JSON.stringify({
            selected: selectedRestrictions,
            removed: removedRestrictions
        });
    }

    existingRestrictionsList.querySelectorAll(".remove-existing-restriction").forEach(button => {
        button.addEventListener("click", function () {
            const restrictionItem = this.parentElement;
            const restrictionName = restrictionItem.querySelector(".restriction-text").innerText;

            restrictionItem.remove();
            removedRestrictions.push(restrictionName);
            selectedRestrictions = selectedRestrictions.filter(item => item !== restrictionName);
            updateHiddenInput();
        });
    });

    // Handle input change (show suggestions)
    dietaryInput.addEventListener("input", function () {
        const search = this.value.trim().toLowerCase();
        suggestionsBox.innerHTML = "";
        suggestionsBox.style.display = "none";
        addRestrictionBtn.disabled = true;

        if (search.length === 0) return;

        const filtered = allRestrictions.filter(r =>
            r.restriction_name.toLowerCase().includes(search)
        );

        if (filtered.length === 0) {
            // Show "Add (input)" if no match found
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

        // Position dropdown correctly
        const parent = dietaryInput.closest(".dietary-container");
        parent.appendChild(suggestionsBox);
        suggestionsBox.style.position = "absolute";
        suggestionsBox.style.top = `${dietaryInput.offsetHeight + 5}px`;
        suggestionsBox.style.left = "0px";
        suggestionsBox.style.width = "100%";
        suggestionsBox.style.display = "block";
    });

    // Hide suggestions when clicking outside
    document.addEventListener("click", function (event) {
        if (!dietaryInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
            suggestionsBox.style.display = "none";
        }
    });

    // Add dietary restriction to variant
    addRestrictionBtn.addEventListener("click", function () {
        const restrictionName = dietaryInput.value.trim();
        if (!restrictionName || selectedRestrictions.includes(restrictionName)) return;

        selectedRestrictions.push(restrictionName);
        updateHiddenInput();

        const li = document.createElement("li");
        li.innerHTML = `${restrictionName} <button class="remove-btn">X</button>`;
        li.querySelector(".remove-btn").addEventListener("click", function () {
            selectedRestrictions = selectedRestrictions.filter(item => item !== restrictionName);
            updateHiddenInput();
            li.remove();
        });

        selectedRestrictionsList.appendChild(li);
        dietaryInput.value = "";
        addRestrictionBtn.disabled = true;
    });

    fetchDietaryRestrictions();
});
