document.addEventListener("DOMContentLoaded", () => {
  // Theme toggle functionality
  const themeToggle = document.getElementById("theme-toggle");
  const htmlElement = document.documentElement;

  // Check for saved theme preference or use preferred color scheme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    htmlElement.classList.add("light");
    themeToggle.checked = true;
  } else if (savedTheme === "dark") {
    htmlElement.classList.remove("light");
    themeToggle.checked = false;
  } else {
    // Use preferred color scheme if no saved preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
    ) {
      htmlElement.classList.add("light");
      themeToggle.checked = true;
    }
  }

  // Theme toggle event listener
  themeToggle.addEventListener("change", function () {
    if (this.checked) {
      htmlElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      htmlElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  });

  // FAQ accordion functionality
  const faqQuestions = document.querySelectorAll(".faq-question");

  faqQuestions.forEach((question) => {
    question.addEventListener("click", () => {
      const faqItem = question.parentElement;
      const isActive = faqItem.classList.contains("active");

      // Close all other FAQ items
      document.querySelectorAll(".faq-item.active").forEach((item) => {
        if (item !== faqItem) {
          item.classList.remove("active");
        }
      });

      // Toggle current FAQ item
      faqItem.classList.toggle("active");
    });
  });

  // Back to top button functionality
  const backToTopBtn = document.getElementById("backToTopBtn");

  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      backToTopBtn.classList.add("visible");
    } else {
      backToTopBtn.classList.remove("visible");
    }
  });

  backToTopBtn.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // Mobile menu functionality
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navMenu = document.querySelector(".nav-menu");

  mobileMenuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");

    // Toggle menu icon
    const menuIcon = mobileMenuBtn.querySelector("i");
    if (navMenu.classList.contains("active")) {
      menuIcon.classList.remove("fa-bars");
      menuIcon.classList.add("fa-times");
    } else {
      menuIcon.classList.remove("fa-times");
      menuIcon.classList.add("fa-bars");
    }
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", (event) => {
    if (
      !navMenu.contains(event.target) &&
      !mobileMenuBtn.contains(event.target) &&
      navMenu.classList.contains("active")
    ) {
      navMenu.classList.remove("active");
      const menuIcon = mobileMenuBtn.querySelector("i");
      menuIcon.classList.remove("fa-times");
      menuIcon.classList.add("fa-bars");
    }
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        // Close mobile menu if open
        if (navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          const menuIcon = mobileMenuBtn.querySelector("i");
          menuIcon.classList.remove("fa-times");
          menuIcon.classList.add("fa-bars");
        }

        // Scroll to target
        targetElement.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });

  // Print functionality
  window.printFAQ = () => {
    window.print();
  };

  // Add direct event listener to print button
  const printButton = document.querySelector(".print-button");
  if (printButton) {
    printButton.addEventListener("click", () => {
      window.print();
    });
  }

  // Expand all FAQ items before printing and collapse after
  window.addEventListener("beforeprint", () => {
    document.querySelectorAll(".faq-item").forEach((item) => {
      item.classList.add("active");
    });
  });

  window.addEventListener("afterprint", () => {
    document.querySelectorAll(".faq-item").forEach((item) => {
      item.classList.remove("active");
    });
  });

  // Check if user is logged in and update UI accordingly
  function updateUIForLoginStatus() {
    const isLoggedIn = checkUserLoggedIn();
    const orderLink = document.getElementById("orderLink");
    const profileLink = document.getElementById("profileLink");
    const profileFooterLink = document.getElementById("profileFooterLink");
    const loginBtn = document.getElementById("loginBtn");
    const infoLink = document.getElementById("info");

    if (isLoggedIn) {
      // User is logged in
      if (orderLink) orderLink.style.display = "block";
      if (profileLink) profileLink.style.display = "block";
      if (profileFooterLink) profileFooterLink.style.display = "block";
      if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Вийти';
        loginBtn.removeEventListener("click", redirectToAuth);
        loginBtn.addEventListener("click", logoutUser);
      }

      // Check user role for master elements
      const userId = localStorage.getItem("userId");
      if (userId && window.RoleSystem) {
        window.RoleSystem.checkUserRole(userId);
      } else {
        // Hide master elements by default
        if (infoLink) infoLink.style.display = "none";
      }
    } else {
      // User is not logged in
      if (orderLink) orderLink.style.display = "none";
      if (profileLink) profileLink.style.display = "none";
      if (profileFooterLink) profileFooterLink.style.display = "none";
      if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Увійти';
        loginBtn.removeEventListener("click", logoutUser);
        loginBtn.addEventListener("click", redirectToAuth);
      }

      // Hide master elements for non-logged in users
      if (infoLink) infoLink.style.display = "none";
    }
  }

  // Helper functions for authentication
  function checkUserLoggedIn() {
    return localStorage.getItem("token") !== null;
  }

  function redirectToAuth() {
    window.location.href = "auth.html";
  }

  function logoutUser() {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    updateUIForLoginStatus();
  }

  // Initialize UI based on login status
  updateUIForLoginStatus();

  // Add animation classes to elements as they scroll into view
  const animateOnScroll = () => {
    const sections = document.querySelectorAll(".faq-section");

    sections.forEach((section) => {
      const sectionPosition = section.getBoundingClientRect().top;
      const screenPosition = window.innerHeight / 1.3;

      if (sectionPosition < screenPosition) {
        section.style.opacity = "1";
        section.style.transform = "translateY(0)";
      }
    });
  };

  // Set initial state for animations
  document.querySelectorAll(".faq-section").forEach((section) => {
    section.style.opacity = "0";
    section.style.transform = "translateY(20px)";
    section.style.transition = "all 0.6s ease-out";
  });

  // Run animation on scroll
  window.addEventListener("scroll", animateOnScroll);
  // Run once on page load
  animateOnScroll();
});