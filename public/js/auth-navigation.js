// Function to redirect to auth page with specific form
function redirectToAuthWithForm(formType) {
  window.location.href = `auth.html#${formType}`;
}

// Dummy function for checkUserLoggedIn (replace with actual implementation)
function checkUserLoggedIn() {
  return false; // Or your actual logic
}

// Dummy function for redirectToAuth (replace with actual implementation)
function redirectToAuth() {
  window.location.href = "auth.html"; // Or your actual logic
}

// Set up event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Login button in the header
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn && !checkUserLoggedIn()) {
    loginBtn.removeEventListener("click", redirectToAuth);
    loginBtn.addEventListener("click", function () {
      redirectToAuthWithForm("loginForm");
    });
  }

  // Login button in the modal
  const modalLoginBtn = document.getElementById("modalLoginBtn");
  if (modalLoginBtn) {
    modalLoginBtn.removeEventListener("click", redirectToAuth);
    modalLoginBtn.addEventListener("click", function () {
      redirectToAuthWithForm("loginForm");
    });
  }

  // Register button in the modal
  const modalRegisterBtn = document.getElementById("modalRegisterBtn");
  if (modalRegisterBtn) {
    modalRegisterBtn.addEventListener("click", function () {
      redirectToAuthWithForm("registerForm");
    });
  }
});
