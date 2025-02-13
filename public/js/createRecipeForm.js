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
