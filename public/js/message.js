// Ініціалізація сторінки
document.addEventListener("DOMContentLoaded", async () => {
  try {
    setupThemeToggle();
    setupMobileMenu();
    setupBackToTop();
  } catch (err) {
    console.error("Помилка при ініціалізації сторінки:", err);
  }
});

// Налаштування перемикача теми
function setupThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");
  const htmlElement = document.documentElement;

  // Перевіряємо збережену тему
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    htmlElement.classList.add("light");
    themeToggle.checked = true;
  }

  // Обробник події зміни теми
  themeToggle.addEventListener("change", () => {
    if (themeToggle.checked) {
      htmlElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      htmlElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
  });
}

// Налаштування мобільного меню
function setupMobileMenu() {
  const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
  const navMenu = document.querySelector(".nav-menu");

  mobileMenuBtn.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    mobileMenuBtn.innerHTML = navMenu.classList.contains("active")
      ? '<i class="fas fa-times"></i>'
      : '<i class="fas fa-bars"></i>';
  });

  // Закриваємо меню при кліку на посилання
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("active");
      mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    });
  });
}

// Налаштування кнопки "Вгору"
function setupBackToTop() {
  const backToTopBtn = document.getElementById("backToTop");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
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
}

// Message type selection
const messageTypeRadios = document.querySelectorAll(
  'input[name="messageType"]'
);
const textMessageGroup = document.getElementById("textMessageGroup");
const voiceMessageGroup = document.getElementById("voiceMessageGroup");
const videoMessageGroup = document.getElementById("videoMessageGroup");
const textMessage = document.getElementById("textMessage");

messageTypeRadios.forEach((radio) => {
  radio.addEventListener("change", () => {
    // Hide all message groups
    textMessageGroup.classList.add("hidden");
    voiceMessageGroup.classList.add("hidden");
    videoMessageGroup.classList.add("hidden");

    // Remove required attribute from text message
    textMessage.removeAttribute("required");

    // Show selected message group
    if (radio.value === "text") {
      textMessageGroup.classList.remove("hidden");
      textMessage.setAttribute("required", "");
    } else if (radio.value === "voice") {
      voiceMessageGroup.classList.remove("hidden");
    } else if (radio.value === "video") {
      videoMessageGroup.classList.remove("hidden");
    }
  });
});

// Voice recording functionality
let voiceRecorder;
let voiceStream;
let voiceBlob;

const startVoiceBtn = document.getElementById("startVoiceBtn");
const stopVoiceBtn = document.getElementById("stopVoiceBtn");
const voicePreview = document.getElementById("voicePreview");
const voiceIndicator = document.getElementById("voiceIndicator");

startVoiceBtn.addEventListener("click", async () => {
  try {
    voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    voiceRecorder = new MediaRecorder(voiceStream);

    const voiceChunks = [];
    voiceRecorder.ondataavailable = (e) => voiceChunks.push(e.data);

    voiceRecorder.onstop = () => {
      voiceBlob = new Blob(voiceChunks, { type: "audio/webm" });
      const voiceUrl = URL.createObjectURL(voiceBlob);
      voicePreview.src = voiceUrl;
      voicePreview.classList.remove("hidden");
      voiceIndicator.classList.add("hidden");

      // Stop all tracks
      voiceStream.getTracks().forEach((track) => track.stop());
    };

    voiceRecorder.start();
    startVoiceBtn.disabled = true;
    stopVoiceBtn.disabled = false;
    voiceIndicator.classList.remove("hidden");
  } catch (err) {
    console.error("Помилка доступу до мікрофона:", err);
    showStatus(
      "Не вдалося отримати доступ до мікрофона. Перевірте дозволи.",
      "error"
    );
  }
});

stopVoiceBtn.addEventListener("click", () => {
  if (voiceRecorder && voiceRecorder.state !== "inactive") {
    voiceRecorder.stop();
    startVoiceBtn.disabled = false;
    stopVoiceBtn.disabled = true;
  }
});

// Video recording functionality
let videoRecorder;
let videoStream;
let videoBlob;

const startVideoBtn = document.getElementById("startVideoBtn");
const stopVideoBtn = document.getElementById("stopVideoBtn");
const videoPreview = document.getElementById("videoPreview");
const cameraPreview = document.getElementById("cameraPreview");
const videoIndicator = document.getElementById("videoIndicator");

startVideoBtn.addEventListener("click", async () => {
  try {
    videoStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    // Create video element for live preview
    const livePreview = document.createElement("video");
    livePreview.srcObject = videoStream;
    livePreview.autoplay = true;
    livePreview.muted = true; // Mute to prevent feedback
    cameraPreview.innerHTML = "";
    cameraPreview.appendChild(livePreview);

    videoRecorder = new MediaRecorder(videoStream);

    const videoChunks = [];
    videoRecorder.ondataavailable = (e) => videoChunks.push(e.data);

    videoRecorder.onstop = () => {
      videoBlob = new Blob(videoChunks, { type: "video/webm" });
      const videoUrl = URL.createObjectURL(videoBlob);
      videoPreview.src = videoUrl;
      videoPreview.classList.remove("hidden");
      videoIndicator.classList.add("hidden");

      // Clear camera preview
      cameraPreview.innerHTML = "";

      // Stop all tracks
      videoStream.getTracks().forEach((track) => track.stop());
    };

    videoRecorder.start();
    startVideoBtn.disabled = true;
    stopVideoBtn.disabled = false;
    videoIndicator.classList.remove("hidden");
  } catch (err) {
    console.error("Помилка доступу до камери:", err);
    showStatus(
      "Не вдалося отримати доступ до камери. Перевірте дозволи.",
      "error"
    );
  }
});

stopVideoBtn.addEventListener("click", () => {
  if (videoRecorder && videoRecorder.state !== "inactive") {
    videoRecorder.stop();
    startVideoBtn.disabled = false;
    stopVideoBtn.disabled = true;
  }
});

// Form submission
const messageForm = document.getElementById("messageForm");
const statusMessage = document.getElementById("statusMessage");
const submitBtn = document.getElementById("submitBtn");

messageForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const email = document.getElementById("email").value;
  const messageType = document.querySelector(
    'input[name="messageType"]:checked'
  ).value;

  // Отримуємо вибрані галузі
  const selectedIndustries = Array.from(
    document.querySelectorAll('input[name="industry"]:checked')
  ).map((checkbox) => checkbox.value);

  if (!username || !email) {
    showStatus("Будь ласка, заповніть всі обов'язкові поля", "error");
    return;
  }

  if (messageType === "text" && !textMessage.value) {
    showStatus("Будь ласка, введіть повідомлення", "error");
    return;
  }

  if (messageType === "voice" && !voiceBlob) {
    showStatus("Будь ласка, запишіть голосове повідомлення", "error");
    return;
  }

  if (messageType === "video" && !videoBlob) {
    showStatus("Будь ласка, запишіть відео повідомлення", "error");
    return;
  }

  if (selectedIndustries.length === 0) {
    showStatus("Будь ласка, виберіть хоча б одну галузь", "error");
    return;
  }

  submitBtn.disabled = true;
  showStatus("Надсилання повідомлення...", "info");

  try {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("messageType", messageType);

    // Додаємо кожну вибрану галузь окремо
    selectedIndustries.forEach((industry) => {
      formData.append("industry", industry);
    });

    // Також додаємо галузі як JSON-рядок для резервного варіанту
    formData.append("industries", JSON.stringify(selectedIndustries));

    // Додаємо повідомлення в залежності від типу
    if (messageType === "text") {
      formData.append("textMessage", textMessage.value);
    } else if (messageType === "voice") {
      formData.append("voiceMessage", voiceBlob, "voice.webm");
    } else if (messageType === "video") {
      formData.append("videoMessage", videoBlob, "video.webm");
    }

    // Виводимо вміст formData для відлагодження
    console.log("Form data contents:");
    for (let pair of formData.entries()) {
      console.log(pair[0] + ": " + pair[1]);
    }

    const response = await fetch("/send-message", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      showStatus("Повідомлення успішно надіслано!", "success");
      messageForm.reset();

      // Reset previews
      voicePreview.classList.add("hidden");
      videoPreview.classList.add("hidden");

      // Reset blobs
      voiceBlob = null;
      videoBlob = null;

      // Show text message group by default
      textMessageGroup.classList.remove("hidden");
      voiceMessageGroup.classList.add("hidden");
      videoMessageGroup.classList.add("hidden");
      textMessage.setAttribute("required", "");

      // Removed the redirect to info.html
    } else {
      showStatus(`Помилка: ${result.error}`, "error");
    }
  } catch (err) {
    console.error("Помилка надсилання повідомлення:", err);
    showStatus("Не вдалося надіслати повідомлення. Спробуйте ще раз.", "error");
  } finally {
    submitBtn.disabled = false;
  }
});

function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = `form-message ${type}`;
  statusMessage.classList.remove("hidden");

  // Auto-hide success messages after 5 seconds
  if (type === "success") {
    setTimeout(() => {
      statusMessage.classList.add("hidden");
    }, 5000);
  }
}
//role.js
function updateUIForLoginStatus() {
  const isLoggedIn = checkUserLoggedIn()
  const orderSection = document.getElementById("order")
  const orderLink = document.getElementById("orderLink")
  const profileLink = document.getElementById("profileLink")
  const profileFooterLink = document.getElementById("profileFooterLink")
  const loginBtn = document.getElementById("loginBtn")
  const loginModal = document.getElementById("loginModal")
  const reviewSection = document.getElementById("review-form")

  if (isLoggedIn) {
    // User is logged in
    if (orderSection) orderSection.style.display = "block"
    if (orderLink) orderLink.style.display = "block"
    if (profileLink) profileLink.style.display = "block"
    if (profileFooterLink) profileFooterLink.style.display = "block"
    if (reviewSection) reviewSection.style.display = "block"
    if (loginBtn) {
      loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Вийти'
      loginBtn.removeEventListener("click", redirectToAuth)
      loginBtn.addEventListener("click", logoutUser)
    }

    // Check user role and update UI accordingly
    const userId = localStorage.getItem("userId")
    if (userId && window.RoleSystem) {
      window.RoleSystem.checkUserRole(userId)
    } else {
      // If RoleSystem is not available, hide master elements by default
      const infoLink = document.getElementById("info")
      if (infoLink) infoLink.style.display = "none"
    }
  } else {
    // User is not logged in
    if (orderSection) orderSection.style.display = "none"
    if (orderLink) orderLink.style.display = "none"
    if (profileLink) profileLink.style.display = "none"
    if (profileFooterLink) profileFooterLink.style.display = "none"
    if (reviewSection) reviewSection.style.display = "none"
    if (loginBtn) {
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Увійти'
      loginBtn.removeEventListener("click", logoutUser)
      loginBtn.addEventListener("click", redirectToAuth)
    }

    // Show login modal for new users
    if (loginModal && !localStorage.getItem("modalShown")) {
      setTimeout(() => {
        loginModal.classList.add("active")
        localStorage.setItem("modalShown", "true")
      }, 1500)
    }

    // Hide master elements for non-logged in users
    const infoLink = document.getElementById("info")
    if (infoLink) infoLink.style.display = "none"
  }
}

// Mock functions to resolve undeclared variable errors.  These should be replaced with actual implementations.
function checkUserLoggedIn() {
  // Replace with actual implementation
  return localStorage.getItem("token") !== null
}

function redirectToAuth() {
  // Replace with actual implementation
  window.location.href = "/auth" // Or wherever your auth endpoint is
}

function logoutUser() {
  // Replace with actual implementation
  localStorage.removeItem("token")
  localStorage.removeItem("userId")
  updateUIForLoginStatus() // Refresh the UI
}
