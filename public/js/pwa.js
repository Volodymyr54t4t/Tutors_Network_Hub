// PWA Installation Banner Logic
let deferredPrompt;
const installBanner = document.getElementById("installBanner");
const installBtn = document.getElementById("installPwa");
const closeInstallBanner = document.getElementById("closeInstallBanner");

// Check if the app is already installed
const isAppInstalled = () => {
  // Check if the app is in standalone mode or matches media query for installed PWAs
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.navigator.standalone === true
  ); // For iOS
};

// Hide banner if app is already installed
if (isAppInstalled()) {
  if (installBanner) installBanner.style.display = "none";
} else {
  // Listen for the beforeinstallprompt event
  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    console.log("✅ beforeinstallprompt event fired");

    // Stash the event so it can be triggered later
    deferredPrompt = e;

    // Show the install banner
    if (installBanner) {
      installBanner.style.display = "flex";
      installBanner.classList.add("active");
    }
  });
}

// Install button click handler
if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) {
      console.log("❌ No installation prompt available");

      // If on iOS, show instructions for adding to home screen
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        alert(
          "Щоб встановити додаток на iOS: натисніть кнопку 'Поділитися' (Share) внизу браузера, потім виберіть 'На початковий екран' (Add to Home Screen)."
        );
      } else {
        alert(
          "Встановлення недоступне зараз. Спробуйте оновити сторінку або використати інший браузер."
        );
      }
      return;
    }

    console.log("✅ Install button clicked, showing prompt");

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);

      // We've used the prompt, and can't use it again, throw it away
      deferredPrompt = null;

      // Hide the install banner
      installBanner.style.display = "none";

      if (outcome === "accepted") {
        console.log("✅ User accepted the install prompt");
      } else {
        console.log("❌ User dismissed the install prompt");
      }
    } catch (error) {
      console.error("Error during installation:", error);
      alert(
        "Виникла помилка під час встановлення. Спробуйте ще раз або використайте інший браузер."
      );
    }
  });
}

// Close button click handler
if (closeInstallBanner) {
  closeInstallBanner.addEventListener("click", () => {
    installBanner.style.display = "none";
    installBanner.classList.remove("active");

    // Remember user's choice to not show the banner again in this session
    sessionStorage.setItem("installBannerClosed", "true");
  });
}

// Check if user has previously closed the banner in this session
if (sessionStorage.getItem("installBannerClosed") === "true") {
  if (installBanner) installBanner.style.display = "none";
}

// Listen for the appinstalled event
window.addEventListener("appinstalled", (evt) => {
  console.log("✅ ProFix Network Hub has been installed");
  // Hide the install banner after successful installation
  if (installBanner) installBanner.style.display = "none";
});

// Add a manual check for installation eligibility
function checkInstallEligibility() {
  if (deferredPrompt) {
    console.log("✅ App is eligible for installation");
    if (installBanner) {
      installBanner.style.display = "flex";
      installBanner.classList.add("active");
    }
  } else {
    console.log("❓ App installation prompt not available yet");
  }
}

// Check eligibility after page load
window.addEventListener("load", () => {
  // Wait a bit to ensure beforeinstallprompt has had time to fire if it's going to
  setTimeout(checkInstallEligibility, 3000);
});
