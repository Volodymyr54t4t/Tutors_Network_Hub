document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;

  // Check for saved theme preference or use default
  const savedTheme = localStorage.getItem("theme");

  // Apply the saved theme or default to dark
  if (savedTheme === "light") {
    htmlElement.classList.remove("dark");
    htmlElement.classList.add("light");
    themeToggle.checked = true;
  } else {
    htmlElement.classList.add("dark");
    htmlElement.classList.remove("light");
    themeToggle.checked = false;
  }

  // Toggle theme when switch is clicked
  themeToggle.addEventListener("change", function () {
    if (this.checked) {
      htmlElement.classList.remove("dark");
      htmlElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      htmlElement.classList.add("dark");
      htmlElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  });

  // Mobile menu functionality
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("navMenu");

  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      mobileMenuBtn.querySelector("i").classList.toggle("fa-bars");
      mobileMenuBtn.querySelector("i").classList.toggle("fa-times");
    });
  }
});
