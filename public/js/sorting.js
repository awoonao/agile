document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", function () {
        document.getElementById("dropdown-text").textContent = this.textContent;
        document.getElementById("sort-input").value = this.getAttribute("data-value");
        document.getElementById("filter-form").submit();
      });
    });
  });
  