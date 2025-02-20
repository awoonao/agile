document.addEventListener("DOMContentLoaded", function () {
    const imageUpload = document.getElementById("imageUpload");
    const imagePreview = document.getElementById("imagePreview");
  
    function previewImage(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  
    // Click on the image to open file selection
    imagePreview.addEventListener("click", function () {
      imageUpload.click();
    });
  
    // Update image preview when a file is selected
    imageUpload.addEventListener("change", previewImage);
  });
  