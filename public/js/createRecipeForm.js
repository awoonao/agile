// Function to add a new ingredient textbox
function addIngredient() {
  const container = document.getElementById("ingredients-container");
  const input = document.createElement("input");
  input.type = "text";
  input.name = "ingredients[]"; // Name as an array for server processing
  input.placeholder = "Enter ingredient";
  input.required = true;
  container.appendChild(input);
}

// Function to remove ingredient textbox
function addIngredient() {
  const container = document.getElementById("ingredients-container");
  const input = document.createElement("input");
  input.type = "text";
  input.name = "ingredients[]"; // Name as an array for server processing
  input.placeholder = "Enter ingredient";
  input.required = true;
  container.appendChild(input);
}

// Function to remove instruction textbox
function removeIngredient() {
  const container = document.getElementById("ingredients-container");
  // Remove the last input field added
  if (container.lastChild) {
    container.removeChild(container.lastChild);
  }
}

// Function to add a new instruction textbox
function addInstruction() {
  const container = document.getElementById("instructions-container");
  const input = document.createElement("input");
  input.type = "text";
  input.name = "instructions[]"; // Name as an array for server processing
  input.placeholder = "Enter instruction step";
  input.required = true;
  container.appendChild(input);
}

function removeInstruction() {
  const container = document.getElementById("instructions-container");
  // Remove the last input field added
  if (container.lastChild) {
    container.removeChild(container.lastChild);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  function previewImage(event) {
    const imageUpload = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("imagePreview").src = e.target.result;
    };
    if (imageUpload) {
      reader.readAsDataURL(imageUpload);
    }
  }

  document
    .getElementById("imageUpload")
    .addEventListener("change", previewImage);

  document
    .getElementById("imagePreview")
    .addEventListener("click", function () {
      document.getElementById("imageUpload").click();
    });
});

document.addEventListener("DOMContentLoaded", function () {
  const dietaryInput = document.getElementById("dietaryInput");
  const suggestionsBox = document.getElementById("suggestions");
  const addRestrictionBtn = document.getElementById("addRestrictionBtn");
  const selectedRestrictionsList = document.getElementById("selectedRestrictions");
  const hiddenDietaryRestrictions = document.getElementById("hiddenDietaryRestrictions");

  let allRestrictions = [];
  let selectedRestrictions = [];
  

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
    const hiddenDietaryRestrictions = document.getElementById("hiddenDietaryRestrictions");
    hiddenDietaryRestrictions.value = JSON.stringify(selectedRestrictions);  // ✅ Send as JSON
  }


  dietaryInput.addEventListener("input", function () {
    const search = this.value.trim().toLowerCase();
    suggestionsBox.innerHTML = "";
    suggestionsBox.style.display = "none"; // Hide by default
    addRestrictionBtn.disabled = true;

    if (search.length > 0) {
        const filtered = allRestrictions.filter(r =>
            r.restriction_name.toLowerCase().includes(search)
        );

        if (filtered.length === 0) {
            // Allow users to add new restriction
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
            // Show available restrictions
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

        // Show the suggestions box now that items exist
        suggestionsBox.style.display = "block";
    }
});


  document.addEventListener("click", function (event) {
      if (!dietaryInput.contains(event.target) && !suggestionsBox.contains(event.target)) {
          suggestionsBox.style.display = "none";
      }
  });

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
