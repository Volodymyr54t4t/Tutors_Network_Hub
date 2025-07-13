// Check if user is logged in
function checkUserLoggedIn() {
  const userId = localStorage.getItem("userId");
  return !!userId; // Convert to boolean
}

// Show/hide elements based on login status
function updateUIForLoginStatus() {
  const isLoggedIn = checkUserLoggedIn();
  const orderSection = document.getElementById("order");
  const orderLink = document.getElementById("orderLink");
  const profileLink = document.getElementById("profileLink");
  const profileFooterLink = document.getElementById("profileFooterLink");
  const loginBtn = document.getElementById("loginBtn");
  const loginModal = document.getElementById("loginModal");
  const reviewSection = document.getElementById("review-form");

  if (isLoggedIn) {
    // User is logged in
    if (orderSection) orderSection.style.display = "block";
    if (orderLink) orderLink.style.display = "block";
    if (profileLink) profileLink.style.display = "block";
    if (profileFooterLink) profileFooterLink.style.display = "block";
    if (reviewSection) reviewSection.style.display = "block";
    if (loginBtn) {
      loginBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Вийти';
      loginBtn.removeEventListener("click", redirectToAuth);
      loginBtn.addEventListener("click", logoutUser);
    }
  } else {
    // User is not logged in
    if (orderSection) orderSection.style.display = "none";
    if (orderLink) orderLink.style.display = "none";
    if (profileLink) profileLink.style.display = "none";
    if (profileFooterLink) profileFooterLink.style.display = "none";
    if (reviewSection) reviewSection.style.display = "none";
    if (loginBtn) {
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Увійти';
      loginBtn.removeEventListener("click", logoutUser);
      loginBtn.addEventListener("click", redirectToAuth);
    }

    // Show login modal for new users
    if (loginModal && !localStorage.getItem("modalShown")) {
      setTimeout(() => {
        loginModal.classList.add("active");
        localStorage.setItem("modalShown", "true");
      }, 1500);
    }
  }
}

// Redirect to auth page
function redirectToAuth() {
  window.location.href = "auth.html";
}

// Logout user
function logoutUser() {
  localStorage.removeItem("userId");
  localStorage.removeItem("modalShown");
  updateUIForLoginStatus();
  alert("Ви успішно вийшли з системи");
  window.location.reload();
}

// Modal close button
const modalClose = document.getElementById("modalClose");
if (modalClose) {
  modalClose.addEventListener("click", () => {
    document.getElementById("loginModal").classList.remove("active");
  });
}

// Modal login button
const modalLoginBtn = document.getElementById("modalLoginBtn");
if (modalLoginBtn) {
  modalLoginBtn.addEventListener("click", redirectToAuth);
}

// Order Now button
const orderNowBtn = document.getElementById("orderNowBtn");
if (orderNowBtn) {
  orderNowBtn.addEventListener("click", () => {
    if (checkUserLoggedIn()) {
      document.getElementById("order").scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      document.getElementById("loginModal").classList.add("active");
    }
  });
}

// Fetch statistics data
async function fetchStatistics() {
  try {
    // Fetch user and master count with growth data
    const userMasterResponse = await fetch("/api/user-master-count");
    const userMasterData = await userMasterResponse.json();

    // Update user and master counts
    document.getElementById("usersCount").textContent =
      userMasterData.users || 0;
    document.getElementById("mastersCount").textContent =
      userMasterData.masters || 0;

    // Update growth rates
    document.getElementById("usersGrowth").textContent = `+${
      userMasterData.usersGrowth || 0
    }`;
    document.getElementById("mastersGrowth").textContent = `+${
      userMasterData.mastersGrowth || 0
    }`;

    // Fetch orders data
    const ordersResponse = await fetch("/api/orders-count");
    const ordersData = await ordersResponse.json();

    // Update orders count
    document.getElementById("ordersCount").textContent =
      ordersData.completed || 0;
    document.getElementById("ordersGrowth").textContent = `+${
      ordersData.weeklyGrowth || 0
    }`;

    // Fetch timeline data for charts
    const timelineResponse = await fetch("/api/user-master-timeline");
    const timelineData = await timelineResponse.json();

    // Create charts with real data
    createCharts(timelineData);
  } catch (error) {
    console.error("Error fetching statistics:", error);
    // Set fallback data in case of error
    document.getElementById("usersCount").textContent = "0";
    document.getElementById("mastersCount").textContent = "0";
    document.getElementById("ordersCount").textContent = "0";
    document.getElementById("usersGrowth").textContent = "+0";
    document.getElementById("mastersGrowth").textContent = "+0";
    document.getElementById("ordersGrowth").textContent = "+0";

    // Create fallback charts
    createFallbackCharts();
  }
}

// Create charts with real data - FIXED to handle invalid dates
function createCharts(timelineData) {
  if (!timelineData || timelineData.length === 0) {
    createFallbackCharts();
    return;
  }

  const labels = timelineData.map((item) => {
    // Fix: Properly handle date parsing and formatting
    try {
      // Check if timestamp is a number (milliseconds) or a string date
      const date =
        typeof item.timestamp === "number"
          ? new Date(item.timestamp)
          : new Date(item.timestamp);

      // Verify if date is valid before formatting
      if (isNaN(date.getTime())) {
        return item.month || "Невідомо"; // Use month property if available or fallback
      }

      return date.toLocaleDateString("uk-UA", { month: "short" });
    } catch (e) {
      console.error("Error parsing date:", e);
      return item.month || "Невідомо"; // Fallback to month property or default text
    }
  });

  const usersData = timelineData.map((item) => item.users);
  const mastersData = timelineData.map((item) => item.masters);
  const ordersData = timelineData.map((item) => item.orders || 0);

  // Users Chart
  const usersCtx = document.getElementById("usersChart").getContext("2d");
  new Chart(usersCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Користувачі",
          data: usersData,
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: getChartOptions(),
  });

  // Masters Chart
  const mastersCtx = document.getElementById("mastersChart").getContext("2d");
  new Chart(mastersCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Майстри",
          data: mastersData,
          borderColor: "#2980b9",
          backgroundColor: "rgba(41, 128, 185, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: getChartOptions(),
  });

  // Orders Chart
  const ordersCtx = document.getElementById("ordersChart").getContext("2d");
  new Chart(ordersCtx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Проекти",
          data: ordersData,
          borderColor: "#2ecc71",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: getChartOptions(),
  });
}

// Create fallback charts with simulated data
function createFallbackCharts() {
  const months = ["Січ", "Лют", "Бер", "Кві", "Тра", "Чер"];

  // Generate random data with upward trend
  const generateData = (baseValue, increment) => {
    return months.map(
      (_, index) =>
        baseValue + increment * index + Math.floor(Math.random() * 10)
    );
  };

  // Users Chart
  const usersCtx = document.getElementById("usersChart").getContext("2d");
  new Chart(usersCtx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Користувачі",
          data: generateData(80, 10),
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: getChartOptions(),
  });

  // Masters Chart
  const mastersCtx = document.getElementById("mastersChart").getContext("2d");
  new Chart(mastersCtx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Майстри",
          data: generateData(20, 5),
          borderColor: "#2980b9",
          backgroundColor: "rgba(41, 128, 185, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: getChartOptions(),
  });

  // Orders Chart
  const ordersCtx = document.getElementById("ordersChart").getContext("2d");
  new Chart(ordersCtx, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Проекти",
          data: generateData(150, 20),
          borderColor: "#2ecc71",
          backgroundColor: "rgba(46, 204, 113, 0.1)",
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: getChartOptions(),
  });
}

// Chart options
function getChartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(52, 152, 219, 0.3)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        beginAtZero: true,
      },
    },
    elements: {
      point: {
        radius: 0,
        hoverRadius: 5,
      },
    },
  };
}

// Theme Toggle
const themeToggle = document.getElementById("themeToggle");
const htmlElement = document.documentElement;

// Check for saved theme preference
if (localStorage.getItem("theme") === "light") {
  htmlElement.classList.remove("dark");
  htmlElement.classList.add("light");
  themeToggle.checked = true;
}

// Toggle theme when switch is clicked
themeToggle.addEventListener("change", function () {
  if (this.checked) {
    htmlElement.classList.remove("dark");
    htmlElement.classList.add("light");
    localStorage.setItem("theme", "light");
  } else {
    htmlElement.classList.remove("light");
    htmlElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
});

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const navMenu = document.getElementById("navMenu");

mobileMenuBtn.addEventListener("click", function () {
  navMenu.classList.toggle("active");

  // Change icon based on menu state
  const icon = this.querySelector("i");
  if (navMenu.classList.contains("active")) {
    icon.classList.remove("fa-bars");
    icon.classList.add("fa-times");
    icon.style.animation = "rotate 0.5s ease forwards";
  } else {
    icon.classList.remove("fa-times");
    icon.classList.add("fa-bars");
    icon.style.animation = "rotate-back 0.5s ease forwards";
  }
});

// Close mobile menu when clicking outside
document.addEventListener("click", function (event) {
  if (
    !navMenu.contains(event.target) &&
    !mobileMenuBtn.contains(event.target) &&
    navMenu.classList.contains("active")
  ) {
    navMenu.classList.remove("active");
    const icon = mobileMenuBtn.querySelector("i");
    icon.classList.remove("fa-times");
    icon.classList.add("fa-bars");
    icon.style.animation = "rotate-back 0.5s ease forwards";
  }
});

// Communication Panel Toggle
const commToggleBtn = document.getElementById("commToggleBtn");
const commMenu = document.getElementById("commMenu");

commToggleBtn.addEventListener("click", function () {
  commMenu.classList.toggle("active");
  this.classList.toggle("active");

  // Change icon based on menu state
  const icon = this.querySelector("i");
  if (commMenu.classList.contains("active")) {
    icon.classList.remove("fa-comments");
    icon.classList.add("fa-times");
  } else {
    icon.classList.remove("fa-times");
    icon.classList.add("fa-comments");
  }
});

// Close communication menu when clicking outside
document.addEventListener("click", function (event) {
  if (
    !commMenu.contains(event.target) &&
    !commToggleBtn.contains(event.target) &&
    commMenu.classList.contains("active")
  ) {
    commMenu.classList.remove("active");
    commToggleBtn.classList.remove("active");
    const icon = commToggleBtn.querySelector("i");
    icon.classList.remove("fa-times");
    icon.classList.add("fa-comments");
  }
});

// Communication buttons with animations and redirects
document.getElementById("messageBtn").addEventListener("click", () => {
  animateButton(event.currentTarget);
  setTimeout(() => {
    if (checkUserLoggedIn()) {
      window.location.href = "public/message.html";
    } else {
      document.getElementById("loginModal").classList.add("active");
    }
  }, 300);
});

document.getElementById("chatBtn").addEventListener("click", () => {
  animateButton(event.currentTarget);
  setTimeout(() => {
    if (checkUserLoggedIn()) {
      window.location.href = "public/chat.html";
    } else {
      document.getElementById("loginModal").classList.add("active");
    }
  }, 300);
});

document.getElementById("voiceBtn").addEventListener("click", () => {
  animateButton(event.currentTarget);
  setTimeout(() => {
    if (checkUserLoggedIn()) {
      window.location.href = "public/message.html";
    } else {
      document.getElementById("loginModal").classList.add("active");
    }
  }, 300);
});

document.getElementById("videoBtn").addEventListener("click", () => {
  animateButton(event.currentTarget);
  setTimeout(() => {
    if (checkUserLoggedIn()) {
      window.location.href = "public/message.html";
    } else {
      document.getElementById("loginModal").classList.add("active");
    }
  }, 300);
});

function animateButton(button) {
  button.style.animation = "jello 0.8s";
  button.addEventListener("animationend", () => {
    button.style.animation = "";
  });
}

// Find Master button
document.getElementById("findMasterBtn").addEventListener("click", () => {
  animateButton(event.currentTarget);
  document.getElementById("industries").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
});

// Industry data with icons and descriptions
const industryData = [
  {
    name: "Інформаційні технології",
    icon: "fas fa-laptop-code",
    description:
      "Розробка програмного забезпечення, веб-сайтів, мобільних додатків та IT-консультації",
  },
  {
    name: "Медицина",
    icon: "fas fa-heartbeat",
    description:
      "Медичні консультації, догляд за пацієнтами та медичне обладнання",
  },
  {
    name: "Енергетика",
    icon: "fas fa-bolt",
    description:
      "Енергетичні рішення, відновлювані джерела енергії та енергоефективність",
  },
  {
    name: "Аграрна галузь",
    icon: "fas fa-tractor",
    description: "Сільськогосподарські послуги, агрономія та тваринництво",
  },
  {
    name: "Фінанси та банківська справа",
    icon: "fas fa-money-bill-wave",
    description: "Фінансові консультації, бухгалтерія та інвестиційні поради",
  },
  {
    name: "Освіта",
    icon: "fas fa-graduation-cap",
    description: "Навчання, тренінги та освітні програми",
  },
  {
    name: "Туризм і гостинність",
    icon: "fas fa-plane",
    description:
      "Туристичні послуги, організація подорожей та готельний бізнес",
  },
  {
    name: "Будівництво та нерухомість",
    icon: "fas fa-hard-hat",
    description: "Будівельні роботи, ремонт та консультації з нерухомості",
  },
  {
    name: "Транспорт",
    icon: "fas fa-truck",
    description: "Транспортні послуги, логістика та доставка",
  },
  {
    name: "Мистецтво і культура",
    icon: "fas fa-palette",
    description: "Творчі послуги, дизайн та організація культурних заходів",
  },
];

// Render industries with animations
function renderIndustries() {
  const industriesContainer = document.getElementById("industriesContainer");
  industriesContainer.innerHTML = "";

  industryData.forEach((industry, index) => {
    const industryCard = document.createElement("div");
    industryCard.className = "industry-card";
    industryCard.style.opacity = "0";
    industryCard.style.transform = "translateY(20px)";

    industryCard.innerHTML = `
    <i class="${industry.icon} industry-icon"></i>
    <div class="industry-name">${industry.name}</div>
    <div class="industry-description">${industry.description}</div>
  `;

    industriesContainer.appendChild(industryCard);

    // Staggered animation
    setTimeout(() => {
      industryCard.style.opacity = "1";
      industryCard.style.transform = "translateY(0)";
      industryCard.style.transition =
        "all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    }, 100 * index);
  });
}

// Render industries for dropdown
function renderIndustriesDropdown() {
  const industrySelect = document.getElementById("industrySelect");
  const reviewIndustry = document.getElementById("reviewIndustry");

  if (!industrySelect && !reviewIndustry) return;

  // Clear existing options except the first one for industrySelect
  if (industrySelect) {
    while (industrySelect.options.length > 1) {
      industrySelect.remove(1);
    }
  }

  // Clear existing options except the first one for reviewIndustry
  if (reviewIndustry) {
    while (reviewIndustry.options.length > 1) {
      reviewIndustry.remove(1);
    }
  }

  // Add industry options
  industryData.forEach((industry) => {
    if (industrySelect) {
      const option = document.createElement("option");
      option.value = industry.name;
      option.textContent = industry.name;
      industrySelect.appendChild(option);
    }

    if (reviewIndustry) {
      const option = document.createElement("option");
      option.value = industry.name;
      option.textContent = industry.name;
      reviewIndustry.appendChild(option);
    }
  });
}

// UPDATED: Order Form Submission with validation and animations
const orderForm = document.getElementById("orderForm");
const orderFormMessage = document.getElementById("orderFormMessage");

if (orderForm) {
  // Phone number validation
  const phoneInput = document.getElementById("orderPhone");
  phoneInput.addEventListener("input", function () {
    let phoneNumber = this.value.replace(/\D/g, "");

    if (phoneNumber.startsWith("380")) {
      phoneNumber = "+" + phoneNumber;
    } else if (phoneNumber.startsWith("0")) {
      phoneNumber = "+38" + phoneNumber;
    }

    // Format the phone number
    if (phoneNumber.length > 12) {
      phoneNumber = phoneNumber.substring(0, 13);
    }

    this.value = phoneNumber;
  });

  orderForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById("submitOrderBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Відправка...';

    const title = document.getElementById("orderTitle").value;
    const industry = document.getElementById("industrySelect").value;
    const description = document.getElementById("orderDescription").value;
    const phone = document.getElementById("orderPhone").value;

    // Validate phone number
    const phoneRegex = /^\+380\d{9}$/;
    if (!phoneRegex.test(phone)) {
      orderFormMessage.textContent =
        "Введіть коректний номер телефону у форматі +380XXXXXXXXX";
      orderFormMessage.className = "form-message error";
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<span>Відправити заявку</span><i class="fas fa-paper-plane"></i>';

      // Shake the phone input
      phoneInput.style.animation = "shake 0.5s";
      phoneInput.addEventListener("animationend", () => {
        phoneInput.style.animation = "";
      });

      return;
    }

    // Check if user is logged in
    const userId = localStorage.getItem("userId");
    if (!userId) {
      orderFormMessage.textContent =
        "Будь ласка, авторизуйтесь для відправки заявки";
      orderFormMessage.className = "form-message error";
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<span>Відправити заявку</span><i class="fas fa-paper-plane"></i>';

      // Show login modal
      document.getElementById("loginModal").classList.add("active");
      return;
    }

    try {
      // Create order data
      const orderData = {
        user_id: userId,
        title,
        industry,
        description,
        phone,
      };

      // Send order to server
      const response = await fetch("/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (data.success) {
        // Success response
        orderFormMessage.textContent =
          "Заявку успішно відправлено! Наші майстри зв'яжуться з вами найближчим часом.";
        orderFormMessage.className = "form-message success";
        orderForm.reset();

        // Success animation
        const formContainer = document.querySelector(".order-form-container");
        formContainer.style.animation = "pulse 1s";
        formContainer.addEventListener("animationend", () => {
          formContainer.style.animation = "";
        });

        // Add link to view orders
        const viewOrdersLink = document.createElement("a");
        viewOrdersLink.href = "order.html";
        viewOrdersLink.className = "view-orders-link";
        viewOrdersLink.innerHTML =
          '<i class="fas fa-list"></i> Переглянути мої заявки';
        orderFormMessage.appendChild(document.createElement("br"));
        orderFormMessage.appendChild(viewOrdersLink);
      } else {
        // Error response
        orderFormMessage.textContent =
          data.message || "Помилка при відправці заявки";
        orderFormMessage.className = "form-message error";
      }
    } catch (error) {
      console.error("Помилка:", error);
      orderFormMessage.textContent = "Помилка з'єднання з сервером";
      orderFormMessage.className = "form-message error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<span>Відправити заявку</span><i class="fas fa-paper-plane"></i>';

      // Hide message after 5 seconds with fade out
      setTimeout(() => {
        orderFormMessage.style.animation = "fadeOut 1s forwards";
        orderFormMessage.addEventListener("animationend", () => {
          orderFormMessage.style.display = "none";
          orderFormMessage.style.animation = "";
          setTimeout(() => {
            orderFormMessage.style.display = "block";
            orderFormMessage.textContent = "";
            orderFormMessage.className = "form-message";
          }, 500);
        });
      }, 10000);
    }
  });
}

// NEW: Review Form Functionality
const reviewForm = document.getElementById("reviewForm");
const reviewFormMessage = document.getElementById("reviewFormMessage");
const addReviewBtn = document.getElementById("addReviewBtn");
const reviewSection = document.getElementById("review-form");

// Star rating functionality
const starRating = document.querySelector(".star-rating");
if (starRating) {
  const stars = starRating.querySelectorAll("i");
  const ratingInput = document.getElementById("reviewRating");

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      const rating = star.getAttribute("data-rating");
      ratingInput.value = rating;

      // Reset all stars
      stars.forEach((s) => s.classList.remove("active"));

      // Activate stars up to the selected one
      stars.forEach((s) => {
        if (s.getAttribute("data-rating") <= rating) {
          s.classList.add("active");
        }
      });
    });
  });
}

// Show/hide review form when "Add Review" button is clicked
if (addReviewBtn) {
  addReviewBtn.addEventListener("click", () => {
    if (checkUserLoggedIn()) {
      reviewSection.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      document.getElementById("loginModal").classList.add("active");
    }
  });
}

// Handle review form submission
if (reviewForm) {
  reviewForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const submitBtn = document.getElementById("submitReviewBtn");
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Відправка...';

    const name = document.getElementById("reviewName").value;
    const industry = document.getElementById("reviewIndustry").value;
    const rating = document.getElementById("reviewRating").value;
    const text = document.getElementById("reviewText").value;
    const master = document.getElementById("reviewMaster").value;

    // Validate rating
    if (!rating) {
      reviewFormMessage.textContent = "Будь ласка, виберіть оцінку";
      reviewFormMessage.className = "form-message error";
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<span>Відправити відгук</span><i class="fas fa-paper-plane"></i>';
      return;
    }

    // Check if user is logged in
    const userId = localStorage.getItem("userId");
    if (!userId) {
      reviewFormMessage.textContent =
        "Будь ласка, авторизуйтесь для відправки відгуку";
      reviewFormMessage.className = "form-message error";
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<span>Відправити відгук</span><i class="fas fa-paper-plane"></i>';

      // Show login modal
      document.getElementById("loginModal").classList.add("active");
      return;
    }

    try {
      // Create review data
      const reviewData = {
        user_id: userId,
        name,
        industry,
        rating: parseInt(rating),
        text,
        master_name: master,
      };

      // Send review to server
      const response = await fetch("/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      const data = await response.json();

      if (data.success) {
        // Success response
        reviewFormMessage.textContent =
          "Відгук успішно відправлено! Дякуємо за ваш відгук.";
        reviewFormMessage.className = "form-message success";
        reviewForm.reset();

        // Reset star rating
        const stars = document.querySelectorAll(".star-rating i");
        stars.forEach((star) => star.classList.remove("active"));
        document.getElementById("reviewRating").value = "";

        // Success animation
        const formContainer = document.querySelector(".review-form-container");
        formContainer.style.animation = "pulse 1s";
        formContainer.addEventListener("animationend", () => {
          formContainer.style.animation = "";
        });

        // Reload testimonials
        loadTestimonials();
      } else {
        // Error response
        reviewFormMessage.textContent =
          data.message || "Помилка при відправці відгуку";
        reviewFormMessage.className = "form-message error";
      }
    } catch (error) {
      console.error("Помилка:", error);
      reviewFormMessage.textContent = "Помилка з'єднання з сервером";
      reviewFormMessage.className = "form-message error";
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML =
        '<span>Відправити відгук</span><i class="fas fa-paper-plane"></i>';

      // Hide message after 5 seconds with fade out
      setTimeout(() => {
        reviewFormMessage.style.animation = "fadeOut 1s forwards";
        reviewFormMessage.addEventListener("animationend", () => {
          reviewFormMessage.style.display = "none";
          reviewFormMessage.style.animation = "";
          setTimeout(() => {
            reviewFormMessage.style.display = "block";
            reviewFormMessage.textContent = "";
            reviewFormMessage.className = "form-message";
          }, 500);
        });
      }, 10000);
    }
  });
}

// Load testimonials from server
async function loadTestimonials() {
  const testimonialsTrack = document.getElementById("testimonialsTrack");
  if (!testimonialsTrack) return;

  try {
    const response = await fetch("/reviews");
    const data = await response.json();

    if (data.reviews && data.reviews.length > 0) {
      testimonialsTrack.innerHTML = "";

      data.reviews.forEach((review) => {
        const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
        const date = new Date(review.created_at).toLocaleDateString("uk-UA");

        const testimonialCard = document.createElement("div");
        testimonialCard.className = "testimonial-card";
        testimonialCard.innerHTML = `
          <div class="testimonial-rating">${stars}</div>
          <div class="testimonial-industry">${review.industry}</div>
          <div class="testimonial-quote">${review.text}</div>
          <div class="testimonial-author">${review.name}</div>
          ${
            review.master_name
              ? `<div class="testimonial-role">Майстер: ${review.master_name}</div>`
              : ""
          }
          <div class="testimonial-date">${date}</div>
        `;

        testimonialsTrack.appendChild(testimonialCard);
      });

      // Initialize testimonial slider
      initTestimonialSlider();
    } else {
      testimonialsTrack.innerHTML = `
        <div class="testimonial-card">
          <div class="testimonial-quote">Поки що немає відгуків. Будьте першим, хто залишить відгук!</div>
        </div>
      `;
    }
  } catch (error) {
    console.error("Помилка при завантаженні відгуків:", error);
    testimonialsTrack.innerHTML = `
      <div class="testimonial-card">
        <div class="testimonial-quote">Не вдалося завантажити відгуки. Спробуйте пізніше.</div>
      </div>
    `;
  }
}

// Initialize testimonial slider
function initTestimonialSlider() {
  const track = document.getElementById("testimonialsTrack");
  const prevBtn = document.getElementById("testimonialPrev");
  const nextBtn = document.getElementById("testimonialNext");

  if (!track || !prevBtn || !nextBtn) return;

  let currentIndex = 0;
  const testimonials = track.querySelectorAll(".testimonial-card");

  if (testimonials.length <= 1) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    return;
  }

  function updateSlider() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  }

  prevBtn.addEventListener("click", () => {
    currentIndex =
      (currentIndex - 1 + testimonials.length) % testimonials.length;
    updateSlider();
  });

  nextBtn.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % testimonials.length;
    updateSlider();
  });

  // Auto-slide every 5 seconds
  let slideInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % testimonials.length;
    updateSlider();
  }, 5000);

  // Pause auto-slide on hover
  track.parentElement.addEventListener("mouseenter", () => {
    clearInterval(slideInterval);
  });

  // Resume auto-slide when mouse leaves
  track.parentElement.addEventListener("mouseleave", () => {
    slideInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % testimonials.length;
      updateSlider();
    }, 5000);
  });
}

// Parallax effect for hero section
window.addEventListener("scroll", function () {
  const scrollPosition = window.scrollY;
  const hero = document.querySelector(".hero");
  const heroContent = document.querySelector(".hero-content");

  if (scrollPosition < 600) {
    hero.style.backgroundPosition = `center ${scrollPosition * 0.4}px`;
    heroContent.style.transform = `translateY(${scrollPosition * 0.2}px)`;
  }
});

// Scroll Animation with Intersection Observer
const observerOptions = {
  root: null,
  rootMargin: "0px",
  threshold: 0.1,
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("animate");
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe elements with animation classes
function setupAnimations() {
  const animatedElements = document.querySelectorAll(
    ".section-title, .order-form-container, .review-form-container, .footer-section, .stats-card"
  );

  animatedElements.forEach((element) => {
    element.classList.add("to-animate");
    observer.observe(element);
  });
}

// Add CSS for intersection observer animations
const style = document.createElement("style");
style.textContent = `
.to-animate {
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.8s ease, transform 0.8s ease;
}

.animate {
  opacity: 1;
  transform: translateY(0);
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(90deg); }
}

@keyframes rotate-back {
  from { transform: rotate(90deg); }
  to { transform: rotate(0deg); }
}

@keyframes jello {
  0%, 11.1%, 100% {
    transform: none;
  }
  22.2% {
    transform: skewX(-12.5deg) skewY(-12.5deg);
  }
  33.3% {
    transform: skewX(6.25deg) skewY(6.25deg);
  }
  44.4% {
    transform: skewX(-3.125deg) skewY(-3.125deg);
  }
  55.5% {
    transform: skewX(1.5625deg) skewY(1.5625deg);
  }
  66.6% {
    transform: skewX(-0.78125deg) skewY(-0.78125deg);
  }
  77.7% {
    transform: skewX(0.390625deg) skewY(0.390625deg);
  }
  88.8% {
    transform: skewX(-0.1953125deg) skewY(-0.1953125deg);
  }
}

.view-orders-link {
  display: inline-block;
  margin-top: 10px;
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
}

.view-orders-link:hover {
  color: var(--primary-dark);
  transform: translateX(5px);
}

.view-orders-link i {
  margin-right: 5px;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
`;
document.head.appendChild(style);

// Typing animation for hero title
function setupTypingAnimation() {
  const heroTitle = document.querySelector(".hero-title");
  const originalText = heroTitle.textContent;
  heroTitle.textContent = "";

  let i = 0;
  const typingSpeed = 50; // milliseconds per character

  function typeWriter() {
    if (i < originalText.length) {
      heroTitle.textContent += originalText.charAt(i);
      i++;
      setTimeout(typeWriter, typingSpeed);
    }
  }

  // Start typing after a short delay
  setTimeout(typeWriter, 500);
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  // Update UI based on login status
  updateUIForLoginStatus();

  // Fetch statistics data
  fetchStatistics();

  // Render industries
  renderIndustries();
  renderIndustriesDropdown();

  // Load testimonials
  loadTestimonials();

  // Setup animations
  setupAnimations();
  setupTypingAnimation();

  // Add hover effects to buttons
  const buttons = document.querySelectorAll(
    ".hero-btn, .nav-button, .submit-btn, .modal-btn"
  );
  buttons.forEach((button) => {
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-5px)";
      button.style.boxShadow = "0 10px 20px rgba(52, 152, 219, 0.4)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
      button.style.boxShadow = "";
    });
  });
});
document.addEventListener("DOMContentLoaded", function () {
  const stars = document.querySelectorAll(".star-rating i");
  const ratingInput = document.getElementById("reviewRating");

  stars.forEach((star) => {
    star.addEventListener("mouseover", () => {
      stars.forEach((s) => s.classList.remove("hovered"));
      star.classList.add("hovered");
      let currentRating = star.getAttribute("data-rating");
      stars.forEach((s) => {
        if (s.getAttribute("data-rating") <= currentRating) {
          s.classList.add("hovered");
        }
      });
    });

    star.addEventListener("mouseout", () => {
      stars.forEach((s) => s.classList.remove("hovered"));
    });

    star.addEventListener("click", () => {
      let selectedRating = star.getAttribute("data-rating");
      ratingInput.value = selectedRating;
      stars.forEach((s) => s.classList.remove("selected"));
      stars.forEach((s) => {
        if (s.getAttribute("data-rating") <= selectedRating) {
          s.classList.add("selected");
        }
      });
    });
  });
});

console.log("ProFix Network Hub script loaded successfully!");

// Find the admin panel link in the footer and add an event listener
document.addEventListener("DOMContentLoaded", function () {
  // Find all links to admin.html in the footer
  const adminLinks = document.querySelectorAll('footer a[href="admin.html"]');

  adminLinks.forEach((link) => {
    // Change the href attribute to point to admin-login.html
    link.setAttribute("href", "admin-login.html");
  });
});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/service-worker.js")
      .then((reg) =>
        console.log("✅ Service Worker зареєстрований:", reg.scope)
      )
      .catch((err) =>
        console.log("❌ Реєстрація Service Worker не вдалася:", err)
      );
  });
}
// Observe elements with animation classes
function setupAnimations() {
  const animatedElements = document.querySelectorAll(
    ".section-title, .order-form-container, .review-form-container, .footer-section, .stats-card, .partner-card"
  );

  animatedElements.forEach((element) => {
    element.classList.add("to-animate");
    observer.observe(element);
  });
}
