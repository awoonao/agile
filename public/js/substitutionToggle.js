
document.addEventListener("DOMContentLoaded", function () {
    console.log("Script loaded after DOM is ready");
  // Handle substitution toggles using event delegation
  document.body.addEventListener("click", function (e) {
    if (e.target.classList.contains("toggle-substitution")) {
      const container = e.target.closest(".substitution-container");
      const input = container.querySelector(".substitution-input");
      input.classList.toggle("hidden");

      // Update button text
      e.target.textContent = input.classList.contains("hidden")
        ? "Add Substitution"
        : "Cancel Substitution";
    }
  });
});


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