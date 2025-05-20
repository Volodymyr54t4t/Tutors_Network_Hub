// Ініціалізація сторінки
document.addEventListener("DOMContentLoaded", async () => {
  try {
    setupThemeToggle();
    setupMobileMenu();
    setupBackToTop();
    setupMessageFilters();
    setupModal();

    // Check if we have URL parameters from a form submission
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("username")) {
      // Display the message from URL parameters
      displayMessageFromParams(urlParams);
    } else {
      // Load messages from server
      await loadMessages();
    }
  } catch (err) {
    console.error("Помилка при ініціалізації сторінки:", err);
  }
});

// Function to display message from URL parameters
function displayMessageFromParams(params) {
  const messagesList = document.getElementById("messagesList");

  // Get data from URL parameters
  const username = params.get("username");
  const email = params.get("email");
  const messageType = params.get("messageType");
  const textMessageContent = params.get("textMessage") || "";
  let industries = [];

  // Try multiple ways to get industries
  try {
    // First try to get industries from JSON string
    if (params.get("industries")) {
      const industriesJson = params.get("industries");
      industries = JSON.parse(industriesJson);
    }
    // If that fails or returns empty, try to get individual industry values
    if (industries.length === 0) {
      // Get all values with the name 'industry'
      industries = params.getAll("industry");
    }
  } catch (e) {
    console.error("Error parsing industries:", e);
    // Try to get individual industry values as fallback
    industries = params.getAll("industry");
  }

  // If still no industries, check for industries[] parameter
  if (industries.length === 0) {
    industries = params.getAll("industries[]");
  }

  console.log("Parsed industries:", industries);

  // Create a message object
  const message = {
    id: "new",
    username: username,
    email: email,
    message_type: messageType,
    message: textMessageContent, // Add the message text
    industries: industries,
    created_at: new Date().toISOString(),
  };

  // Clear loading indicator
  messagesList.innerHTML = "";

  // Create and append message card
  const messageCard = createMessageCard(message);
  messagesList.appendChild(messageCard);

  // Show notification
  showNotification("Нове повідомлення отримано!", "success");
}

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

// Налаштування фільтрів повідомлень
function setupMessageFilters() {
  const messageTypeFilter = document.getElementById("messageTypeFilter");
  const dateFilter = document.getElementById("dateFilter");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");

  // Обробник зміни типу повідомлення
  messageTypeFilter.addEventListener("change", async () => {
    await loadMessages();
  });

  // Обробник зміни сортування за датою
  dateFilter.addEventListener("change", async () => {
    await loadMessages();
  });

  // Обробник пошуку
  searchBtn.addEventListener("click", async () => {
    await loadMessages();
  });

  // Обробник натискання Enter в полі пошуку
  searchInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await loadMessages();
    }
  });
}

// Налаштування модального вікна
function setupModal() {
  const modal = document.getElementById("messageModal");
  const closeModal = document.getElementById("closeModal");
  const replyBtn = document.getElementById("replyBtn");
  const deleteBtn = document.getElementById("deleteBtn");

  // Закриття модального вікна
  closeModal.addEventListener("click", () => {
    modal.classList.remove("show");
  });

  // Закриття модального вікна при кліку поза ним
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });

  // Обробник кнопки відповіді
  replyBtn.addEventListener("click", () => {
    const messageId = modal.dataset.messageId;
    const email = modal.dataset.email;

    // Перенаправлення на сторінку повідомлення з заповненим email
    window.location.href = `message.html?reply=${email}`;
  });

  // Обробник кнопки видалення
  deleteBtn.addEventListener("click", async () => {
    const messageId = modal.dataset.messageId;

    if (confirm("Ви впевнені, що хочете видалити це повідомлення?")) {
      try {
        const response = await fetch(`/api/messages/${messageId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          modal.classList.remove("show");
          await loadMessages();
          showNotification("Повідомлення успішно видалено", "success");
        } else {
          const data = await response.json();
          showNotification(`Помилка: ${data.error}`, "error");
        }
      } catch (err) {
        console.error("Помилка при видаленні повідомлення:", err);
        showNotification("Не вдалося видалити повідомлення", "error");
      }
    }
  });
}

// Завантаження повідомлень
let currentPage = 1;
const messagesPerPage = 10;
let totalMessages = 0;

async function loadMessages() {
  const messagesList = document.getElementById("messagesList");
  const messageTypeFilter = document.getElementById("messageTypeFilter").value;
  const dateFilter = document.getElementById("dateFilter").value;
  const searchQuery = document.getElementById("searchInput").value.trim();

  // Показуємо індикатор завантаження
  messagesList.innerHTML = `
      <div class="loading-indicator">
          <div class="spinner"></div>
          <p>Завантаження повідомлень...</p>
      </div>
  `;

  try {
    // Формуємо URL з параметрами
    let url = `/api/messages?page=${currentPage}&limit=${messagesPerPage}`;

    if (messageTypeFilter !== "all") {
      url += `&type=${messageTypeFilter}`;
    }

    if (dateFilter === "oldest") {
      url += "&sort=asc";
    } else {
      url += "&sort=desc";
    }

    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }

    // Отримуємо повідомлення з сервера
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Не вдалося отримати повідомлення");
    }

    const data = await response.json();
    totalMessages = data.total || 0;

    // Оновлюємо пагінацію
    updatePagination();

    // Якщо повідомлень немає
    if (!data.messages || data.messages.length === 0) {
      messagesList.innerHTML = `
              <div class="no-messages">
                  <i class="fas fa-inbox fa-3x"></i>
                  <p>Повідомлень не знайдено</p>
              </div>
          `;
      return;
    }

    // Відображаємо повідомлення
    messagesList.innerHTML = "";

    data.messages.forEach((message) => {
      // Ensure industries is always an array
      if (!message.industries) {
        message.industries = [];
      }

      const messageCard = createMessageCard(message);
      messagesList.appendChild(messageCard);
    });
  } catch (err) {
    console.error("Помилка при завантаженні повідомлень:", err);
    messagesList.innerHTML = `
          <div class="error-message">
              <i class="fas fa-exclamation-circle fa-3x"></i>
              <p>Не вдалося завантажити повідомлення. Спробуйте ще раз.</p>
          </div>
      `;
  }
}

// Функція для обробки масиву галузей
function processIndustries(industries) {
  // If industries is null or undefined, return empty array
  if (!industries) {
    return [];
  }
  // If industries is already an array
  if (Array.isArray(industries)) {
    return industries;
  }
  // If industries is a string, but may be JSON
  else if (typeof industries === "string") {
    try {
      const parsed = JSON.parse(industries);
      if (Array.isArray(parsed)) {
        return parsed;
      } else if (typeof parsed === "string") {
        return [parsed];
      }
    } catch (e) {
      // If not JSON, split by comma
      if (industries.includes(",")) {
        return industries.split(",").map((item) => item.trim());
      } else {
        return [industries];
      }
    }
  }
  // If nothing else works, return empty array
  return [];
}

function createMessageCard(message) {
  const messageCard = document.createElement("div");
  messageCard.className = "message-card";
  messageCard.dataset.id = message.id;

  // Отримуємо ініціали для аватара
  const initials = getInitials(message.username);

  // Форматуємо дату
  const formattedDate = formatDate(message.created_at);

  // Визначаємо тип повідомлення та його іконку
  let typeIcon, typeName, typeClass;

  switch (message.message_type) {
    case "text":
      typeIcon = "fas fa-comment";
      typeName = "Текстове";
      typeClass = "text";
      break;
    case "voice":
      typeIcon = "fas fa-microphone";
      typeName = "Голосове";
      typeClass = "voice";
      break;
    case "video":
      typeIcon = "fas fa-video";
      typeName = "Відео";
      typeClass = "video";
      break;
    default:
      typeIcon = "fas fa-comment";
      typeName = "Текстове";
      typeClass = "text";
  }

  // Отримуємо галузі, якщо вони є
  const industriesArray = processIndustries(message.industries);
  console.log(`Message ID ${message.id} industries:`, industriesArray);

  // Створюємо превью контенту
  let contentPreview;

  if (message.message_type === "text") {
    // Use message.message if available, otherwise try message.content or message.textMessage or default to empty string
    const messageText =
      message.message || message.content || message.textMessage || "";

    contentPreview = `
      <div class="message-content">
          <p class="message-preview">${messageText}</p>
          <div class="message-industries">
              <span class="industries-label">Галузі:</span>
              <div class="industries-value">
                  ${
                    industriesArray.length === 0
                      ? "Не вказано"
                      : industriesArray
                          .map(
                            (industry) =>
                              `<span class="industry-tag">${industry}</span>`
                          )
                          .join(" ")
                  }
              </div>
          </div>
      </div>
    `;
  } else {
    contentPreview = `
      <div class="message-media">
          <div class="media-icon">
              <i class="${typeIcon}"></i>
          </div>
          <div class="media-info">
              ${typeName} повідомлення
          </div>
          <div class="message-industries">
              <span class="industries-label">Галузі:</span>
              <div class="industries-value">
                  ${
                    industriesArray.length === 0
                      ? "Не вказано"
                      : industriesArray
                          .map(
                            (industry) =>
                              `<span class="industry-tag">${industry}</span>`
                          )
                          .join(" ")
                  }
              </div>
          </div>
      </div>
    `;
  }

  // Заповнюємо картку
  messageCard.innerHTML = `
    <div class="message-header">
        <div class="message-sender">
            <div class="message-avatar">${initials}</div>
            <div class="message-info">
                <div class="message-name">${message.username}</div>
                <div class="message-email">${message.email}</div>
                <div class="message-type-badge ${typeClass}">
                    <i class="${typeIcon}"></i> ${typeName}
                </div>
            </div>
        </div>
        <div class="message-date">${formattedDate}</div>
    </div>
    ${contentPreview}
    <div class="message-actions">
        <button class="message-btn view-btn">
            <i class="fas fa-eye"></i> Переглянути
        </button>
        <button class="message-btn delete">
            <i class="fas fa-trash"></i> Видалити
        </button>
    </div>
  `;

  // Обробник перегляду
  messageCard.querySelector(".view-btn").addEventListener("click", () => {
    openMessageModal(message);
  });

  // Обробник видалення
  messageCard.querySelector(".delete").addEventListener("click", async (e) => {
    e.stopPropagation();

    if (confirm("Ви впевнені, що хочете видалити це повідомлення?")) {
      try {
        const response = await fetch(`/api/messages/${message.id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          messageCard.remove();
          showNotification("Повідомлення успішно видалено", "success");

          // Якщо більше немає повідомлень — оновити
          if (document.querySelectorAll(".message-card").length === 0) {
            await loadMessages();
          }
        } else {
          const data = await response.json();
          showNotification(`Помилка: ${data.error}`, "error");
        }
      } catch (err) {
        console.error("Помилка при видаленні повідомлення:", err);
        showNotification("Не вдалося видалити повідомлення", "error");
      }
    }
  });

  return messageCard;
}

// Відкриття модального вікна з повідомленням
function openMessageModal(message) {
  const modal = document.getElementById("messageModal");
  const modalBody = document.getElementById("modalBody");

  // Зберігаємо ID повідомлення та email для можливих дій
  modal.dataset.messageId = message.id;
  modal.dataset.email = message.email;

  // Отримуємо ініціали для аватара
  const initials = getInitials(message.username);

  // Форматуємо дату
  const formattedDate = formatDate(message.created_at);

  // Визначаємо тип повідомлення та його іконку
  let typeIcon, typeName, typeClass;

  switch (message.message_type) {
    case "text":
      typeIcon = "fas fa-comment";
      typeName = "Текстове";
      typeClass = "text";
      break;
    case "voice":
      typeIcon = "fas fa-microphone";
      typeName = "Голосове";
      typeClass = "voice";
      break;
    case "video":
      typeIcon = "fas fa-video";
      typeName = "Відео";
      typeClass = "video";
      break;
    default:
      typeIcon = "fas fa-comment";
      typeName = "Текстове";
      typeClass = "text";
  }

  // Отримуємо галузі, якщо вони є
  const industriesArray = processIndustries(message.industries);
  console.log(`Modal: Message ID ${message.id} industries:`, industriesArray);

  // Створюємо вміст модального вікна
  let contentHtml;

  if (message.message_type === "text") {
    // Use message.message if available, otherwise try message.content or message.textMessage or default to empty string
    const messageText =
      message.message || message.content || message.textMessage || "";

    contentHtml = `
          <div class="details-content">
              <p class="details-text">${messageText}</p>
              <div class="details-industries">
                  <span class="industries-label">Галузі:</span>
                  <div class="industries-value">
                      ${
                        industriesArray.length === 0
                          ? "Не вказано"
                          : industriesArray
                              .map(
                                (industry) =>
                                  `<span class="industry-tag">${industry}</span>`
                              )
                              .join(" ")
                      }
                  </div>
              </div>
          </div>
      `;
  } else if (message.message_type === "voice") {
    contentHtml = `
          <div class="details-content">
              <div class="details-media">
                  <audio controls src="${message.media_url}"></audio>
              </div>
              <div class="details-industries">
                  <span class="industries-label">Галузі:</span>
                  <div class="industries-value">
                      ${
                        industriesArray.length === 0
                          ? "Не вказано"
                          : industriesArray
                              .map(
                                (industry) =>
                                  `<span class="industry-tag">${industry}</span>`
                              )
                              .join(" ")
                      }
                  </div>
              </div>
          </div>
      `;
  } else if (message.message_type === "video") {
    contentHtml = `
          <div class="details-content">
              <div class="details-media">
                  <video controls src="${message.media_url}"></video>
              </div>
              <div class="details-industries">
                  <span class="industries-label">Галузі:</span>
                  <div class="industries-value">
                      ${
                        industriesArray.length === 0
                          ? "Не вказано"
                          : industriesArray
                              .map(
                                (industry) =>
                                  `<span class="industry-tag">${industry}</span>`
                              )
                              .join(" ")
                      }
                  </div>
              </div>
          </div>
      `;
  }

  // Заповнюємо модальне вікно
  modalBody.innerHTML = `
      <div class="message-details">
          <div class="details-header">
              <div class="details-sender">
                  <div class="details-avatar">${initials}</div>
                  <div class="details-info">
                      <div class="details-name">${message.username}</div>
                      <div class="details-email">${message.email}</div>
                      <div class="details-date">${formattedDate}</div>
                      <div class="details-type ${typeClass}">
                          <i class="${typeIcon}"></i> ${typeName} повідомлення
                      </div>
                  </div>
              </div>
          </div>
          ${contentHtml}
      </div>
  `;

  // Показуємо модальне вікно
  modal.classList.add("show");
}

// Оновлення пагінації
function updatePagination() {
  const prevPageBtn = document.getElementById("prevPage");
  const nextPageBtn = document.getElementById("nextPage");
  const pageInfo = document.getElementById("pageInfo");

  const totalPages = Math.ceil(totalMessages / messagesPerPage);

  pageInfo.textContent = `Сторінка ${currentPage} з ${totalPages || 1}`;

  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;

  // Додаємо обробники кліків на кнопки пагінації
  prevPageBtn.onclick = async () => {
    if (currentPage > 1) {
      currentPage--;
      await loadMessages();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  nextPageBtn.onclick = async () => {
    if (currentPage < totalPages) {
      currentPage++;
      await loadMessages();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
}

// Отримання ініціалів з імені
function getInitials(name) {
  if (!name) return "?";

  const parts = name.trim().split(" ");
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  } else {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
}

// Форматування дати
function formatDate(dateString) {
  const date = new Date(dateString);

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Показ повідомлення користувачу
function showNotification(message, type) {
  // Створюємо елемент повідомлення
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.innerHTML = `
      <div class="notification-content">
          <i class="fas ${
            type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
          }"></i>
          <span>${message}</span>
      </div>
      <button class="notification-close">&times;</button>
  `;

  // Додаємо стилі для повідомлення
  notification.style.position = "fixed";
  notification.style.bottom = "20px";
  notification.style.right = "20px";
  notification.style.padding = "15px 20px";
  notification.style.borderRadius = "5px";
  notification.style.display = "flex";
  notification.style.alignItems = "center";
  notification.style.justifyContent = "space-between";
  notification.style.minWidth = "300px";
  notification.style.maxWidth = "400px";
  notification.style.zIndex = "9999";
  notification.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)";
  notification.style.transform = "translateY(100px)";
  notification.style.opacity = "0";
  notification.style.transition = "all 0.3s ease";

  if (type === "success") {
    notification.style.backgroundColor = "rgba(46, 204, 113, 0.9)";
    notification.style.color = "white";
  } else {
    notification.style.backgroundColor = "rgba(231, 76, 60, 0.9)";
    notification.style.color = "white";
  }

  // Додаємо стилі для вмісту повідомлення
  const content = notification.querySelector(".notification-content");
  content.style.display = "flex";
  content.style.alignItems = "center";
  content.style.gap = "10px";

  // Додаємо стилі для кнопки закриття
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.style.background = "none";
  closeBtn.style.border = "none";
  closeBtn.style.color = "white";
  closeBtn.style.fontSize = "1.5rem";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.marginLeft = "10px";

  // Додаємо повідомлення на сторінку
  document.body.appendChild(notification);

  // Анімуємо появу повідомлення
  setTimeout(() => {
    notification.style.transform = "translateY(0)";
    notification.style.opacity = "1";
  }, 10);

  // Додаємо обробник кліку на кнопку закриття
  closeBtn.addEventListener("click", () => {
    notification.style.transform = "translateY(100px)";
    notification.style.opacity = "0";

    setTimeout(() => {
      notification.remove();
    }, 300);
  });

  // Автоматично закриваємо повідомлення через 5 секунд
  setTimeout(() => {
    if (document.body.contains(notification)) {
      notification.style.transform = "translateY(100px)";
      notification.style.opacity = "0";

      setTimeout(() => {
        notification.remove();
      }, 300);
    }
  }, 5000);
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
