// Role management system
document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const userId = localStorage.getItem("userId");

  if (userId) {
    // User is logged in, check their role
    checkUserRole(userId);
  } else {
    // User is not logged in, hide master-specific elements
    hideElementsForNonMasters();
  }
});

/**
 * Check user role from the server
 * @param {string} userId - The user ID
 */
async function checkUserRole(userId) {
  try {
    // Fetch user profile to check if they are a master
    const response = await fetch(`/profile/${userId}`);
    const data = await response.json();

    if (response.ok && data.profile) {
      const isMaster =
        data.profile.role_master === true &&
        data.profile.approval_status === "approved";

      // Store role in localStorage for quick access
      localStorage.setItem("userRole", isMaster ? "master" : "user");

      // Update UI based on role
      if (!isMaster) {
        hideElementsForNonMasters();
      }
    } else {
      console.error("Failed to fetch user profile:", data.message);
      hideElementsForNonMasters(); // Default to hiding master elements if error
    }
  } catch (error) {
    console.error("Error checking user role:", error);
    hideElementsForNonMasters(); // Default to hiding master elements if error
  }
}

/**
 * Hide elements that should only be visible to masters
 */
function hideElementsForNonMasters() {
  // Hide the "Повідомлення(майстри)" link in the header
  const infoLink = document.getElementById("info");
  if (infoLink) {
    infoLink.style.display = "none";
  }

  // Hide any other master-specific elements
  const masterElements = document.querySelectorAll(".master-only");
  masterElements.forEach((element) => {
    element.style.display = "none";
  });
}

/**
 * Check if the current user is a master
 * @returns {boolean} True if user is a master, false otherwise
 */
function isUserMaster() {
  return localStorage.getItem("userRole") === "master";
}

// Export functions for use in other scripts
window.RoleSystem = {
  checkUserRole,
  isUserMaster,
  hideElementsForNonMasters,
};
