// Theme Toggle
const themeToggle = document.getElementById("theme-toggle");
const htmlElement = document.documentElement;

// Check for saved theme preference
if (localStorage.getItem("theme") === "light") {
  htmlElement.classList.add("light");
  themeToggle.checked = true;
}

// Theme toggle functionality
themeToggle.addEventListener("change", function () {
  if (this.checked) {
    htmlElement.classList.add("light");
    localStorage.setItem("theme", "light");
  } else {
    htmlElement.classList.remove("light");
    localStorage.setItem("theme", "dark");
  }
});

// Mobile Menu Toggle
const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
const navMenu = document.querySelector(".nav-menu");

mobileMenuBtn.addEventListener("click", function () {
  navMenu.classList.toggle("active");
  this.querySelector("i").classList.toggle("fa-bars");
  this.querySelector("i").classList.toggle("fa-times");
});

// Back to Top Button
const backToTopBtn = document.getElementById("backToTopBtn");

window.addEventListener("scroll", function () {
  if (window.pageYOffset > 300) {
    backToTopBtn.classList.add("visible");
  } else {
    backToTopBtn.classList.remove("visible");
  }
});

backToTopBtn.addEventListener("click", function () {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();

    const targetId = this.getAttribute("href");
    const targetElement = document.querySelector(targetId);

    if (targetElement) {
      window.scrollTo({
        top: targetElement.offsetTop - 80,
        behavior: "smooth",
      });
    }
  });
});

// Add animation to sections when they come into view
document.addEventListener("DOMContentLoaded", function () {
  const termsSections = document.querySelectorAll(".terms-section");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  termsSections.forEach((section) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(20px)";
    section.style.transition = "opacity 0.5s ease, transform 0.5s ease";
    observer.observe(section);
  });
});

// Print functionality
function printTermsOfUse() {
  window.print();
}

// Current year for copyright
document.addEventListener("DOMContentLoaded", function () {
  const copyrightYear = document.querySelector(".copyright");
  if (copyrightYear) {
    const year = new Date().getFullYear();
    copyrightYear.innerHTML = `© ${year} ProFix Network Hub. Всі права захищені.`;
  }
});
