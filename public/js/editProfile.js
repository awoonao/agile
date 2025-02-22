document.addEventListener("DOMContentLoaded", function () {
    const imageUpload = document.getElementById("imageUpload");
    const imagePreview = document.getElementById("imagePreview");
    const profilePicture = document.getElementById("profilePicture"); 

    function previewImage(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                imagePreview.src = e.target.result; 
                profilePicture.src = e.target.result; 
            };
            reader.readAsDataURL(file);
        }
    }

    imagePreview.addEventListener("click", function () {
        imageUpload.click();
    });
    imageUpload.addEventListener("change", previewImage);
});
