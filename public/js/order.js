// Global variables
let allOrders = [];
let currentFilter = "all";
let currentIndustryFilter = "all";
let userRole = null;
let userId = null;
let socket = null;

// Pagination variables
let currentPage = 1;
let itemsPerPage = 9;
let totalPages = 1;

// DOM Elements
const ordersContainer = document.getElementById("ordersContainer");
const noOrdersMessage = document.getElementById("noOrdersMessage");
const filterButtons = document.querySelectorAll(".filter-btn");
const industryFilter = document.getElementById("industryFilter");
const orderDetailsModal = document.getElementById("orderDetailsModal");
const orderModalClose = document.getElementById("orderModalClose");
const orderModalContent = document.getElementById("orderModalContent");
const orderModalActions = document.getElementById("orderModalActions");
const confirmationModal = document.getElementById("confirmationModal");
const confirmationModalClose = document.getElementById(
  "confirmationModalClose"
);
const confirmBtn = document.getElementById("confirmBtn");
const cancelBtn = document.getElementById("cancelBtn");
const confirmationMessage = document.getElementById("confirmationMessage");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const currentPageSpan = document.getElementById("currentPage");
const totalPagesSpan = document.getElementById("totalPages");

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  // Check user authentication
  checkUserLoggedIn();

  // Set up event listeners
  setupEventListeners();

  // Initialize Socket.io connection
  initializeSocket();

  // Load orders
  fetchOrders();
});

// Initialize Socket.io connection
function initializeSocket() {
  try {
    socket = io();

    // Listen for new orders
    socket.on("new-order", (order) => {
      console.log("New order received:", order);

      // Add the new order to our list if it's not already there
      if (!allOrders.some((o) => o.id === order.id)) {
        allOrders.unshift(order);
        showNotification("Отримано нову заявку", "info");
        filterAndRenderOrders();
      }
    });

    // Listen for order updates
    socket.on("order-updated", (updatedOrder) => {
      console.log("Order updated:", updatedOrder);

      // Update the order in our list
      const index = allOrders.findIndex((o) => o.id === updatedOrder.id);
      if (index !== -1) {
        allOrders[index] = updatedOrder;
        showNotification(`Заявку #${updatedOrder.id} оновлено`, "info");
        filterAndRenderOrders();
      }
    });

    // Listen for order deletions
    socket.on("order-deleted", (orderId) => {
      console.log("Order deleted:", orderId);

      // Remove the order from our list
      allOrders = allOrders.filter((o) => o.id !== orderId);
      showNotification(`Заявку #${orderId} видалено`, "info");
      filterAndRenderOrders();
    });

    console.log("Socket.io connection established");
  } catch (error) {
    console.error("Failed to initialize Socket.io:", error);
    showNotification(
      "Не вдалося встановити з'єднання для оновлень в реальному часі",
      "error"
    );
  }
}

// Check if user is logged in and get role
function checkUserLoggedIn() {
  userId = localStorage.getItem("userId");

  if (!userId) {
    // Redirect to login page if not logged in
    window.location.href = "auth.html";
    return;
  }

  // Fetch user profile to determine role
  fetch(`/profile/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch user profile");
      }
      return response.json();
    })
    .then((data) => {
      if (data.profile) {
        userRole = data.profile.role_master ? "master" : "user";

        // Check if user is admin (for demo purposes, user with ID 1 is admin)
        if (userId === "1") {
          userRole = "admin";
        }

        // Update UI based on user role
        updateUIForRole();

        // Join the appropriate room for real-time updates
        if (socket) {
          socket.emit("join-room", { userId, userRole });
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching user profile:", error);
      showNotification("Помилка при отриманні профілю користувача", "error");
    });
}

// Update UI elements based on user role
function updateUIForRole() {
  // Show/hide elements based on role
  if (userRole === "admin") {
    // Admin can see all orders
    fetchOrders("/orders");
  } else if (userRole === "master") {
    // Masters can see pending orders and their own orders
    fetchOrders(`/orders/master/${userId}`);

    // Also fetch user's selected industry
    fetchMasterIndustry();
  } else {
    // Regular users can only see their own orders
    fetchOrders(`/orders/user/${userId}`);
  }
}

// Fetch master's selected industry
function fetchMasterIndustry() {
  fetch(`/api/user-selected-industry/${userId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch master industry");
      }
      return response.json();
    })
    .then((data) => {
      if (data.success && data.selectedIndustry) {
        // Store the master's industry for later use
        localStorage.setItem("masterIndustry", data.selectedIndustry);
      }
    })
    .catch((error) => {
      console.error("Error fetching master industry:", error);
    });
}

// Set up event listeners
function setupEventListeners() {
  // Filter buttons
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Update active filter
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Apply filter
      currentFilter = button.dataset.status;
      currentPage = 1; // Reset to first page when filter changes
      filterAndRenderOrders();
    });
  });

  // Industry filter
  industryFilter.addEventListener("change", () => {
    currentIndustryFilter = industryFilter.value;
    currentPage = 1; // Reset to first page when filter changes
    filterAndRenderOrders();
  });

  // Modal close button
  orderModalClose.addEventListener("click", () => {
    orderDetailsModal.classList.remove("active");
  });

  // Close modal when clicking outside
  orderDetailsModal.addEventListener("click", (e) => {
    if (e.target === orderDetailsModal) {
      orderDetailsModal.classList.remove("active");
    }
  });

  // Confirmation modal close button
  confirmationModalClose.addEventListener("click", () => {
    confirmationModal.classList.remove("active");
  });

  // Cancel button in confirmation modal
  cancelBtn.addEventListener("click", () => {
    confirmationModal.classList.remove("active");
  });

  // Close confirmation modal when clicking outside
  confirmationModal.addEventListener("click", (e) => {
    if (e.target === confirmationModal) {
      confirmationModal.classList.remove("active");
    }
  });

  // Pagination buttons
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      filterAndRenderOrders();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      filterAndRenderOrders();
    }
  });

  // Theme toggle
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

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("navMenu");

  mobileMenuBtn.addEventListener("click", function () {
    navMenu.classList.toggle("active");

    // Change icon based on menu state
    const icon = this.querySelector("i");
    if (navMenu.classList.contains("active")) {
      icon.classList.remove("fa-bars");
      icon.classList.add("fa-times");
    } else {
      icon.classList.remove("fa-times");
      icon.classList.add("fa-bars");
    }
  });
}

// Fetch orders from the server
function fetchOrders(endpoint = "/orders") {
  // Show loading spinner
  ordersContainer.innerHTML = `
    <div class="loading-spinner">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Завантаження заявок...</span>
    </div>
  `;

  fetch(endpoint)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.orders && data.orders.length > 0) {
        allOrders = data.orders;
        filterAndRenderOrders();
        noOrdersMessage.style.display = "none";
      } else {
        ordersContainer.innerHTML = "";
        noOrdersMessage.style.display = "flex";
        updatePaginationControls(0, 0);
      }
    })
    .catch((error) => {
      console.error("Error fetching orders:", error);
      ordersContainer.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Помилка при завантаженні заявок. Спробуйте оновити сторінку.</p>
        </div>
      `;
      updatePaginationControls(0, 0);
    });
}

// Filter orders based on current filters and render them
function filterAndRenderOrders() {
  let filteredOrders = [...allOrders];

  // Apply status filter
  if (currentFilter !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) => order.status === currentFilter
    );
  }

  // Apply industry filter
  if (currentIndustryFilter !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) => order.industry === currentIndustryFilter
    );
  }

  // Calculate pagination
  totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const ordersToRender = filteredOrders.slice(startIndex, endIndex);

  // Update pagination controls
  updatePaginationControls(currentPage, totalPages);

  // Render the orders
  renderOrders(ordersToRender, filteredOrders.length);
}

// Update pagination controls
function updatePaginationControls(page, total) {
  currentPageSpan.textContent = page;
  totalPagesSpan.textContent = total;

  // Enable/disable pagination buttons
  prevPageBtn.disabled = page <= 1;
  nextPageBtn.disabled = page >= total;

  // Show/hide pagination controls
  const paginationControls = document.getElementById("paginationControls");
  paginationControls.style.display = total > 0 ? "flex" : "none";
}

// Render orders to the container
function renderOrders(orders, totalCount) {
  if (orders.length === 0) {
    ordersContainer.innerHTML = "";
    noOrdersMessage.style.display = "flex";
    return;
  }

  noOrdersMessage.style.display = "none";
  ordersContainer.innerHTML = "";

  orders.forEach((order) => {
    const orderCard = document.createElement("div");
    orderCard.className = `order-card ${order.status}`;
    orderCard.dataset.id = order.id;

    // Add new order animation if created in the last hour
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const isNew = now - orderDate < 3600000; // 1 hour in milliseconds
    if (isNew) {
      orderCard.classList.add("new-order");
    }

    // Format date
    const formattedDate = new Date(order.created_at).toLocaleDateString(
      "uk-UA",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    // Get status class and text
    const statusClass = getStatusClass(order.status);
    const statusText = getStatusText(order.status);

    // Truncate description
    const shortDescription = order.description
      ? order.description.length > 100
        ? order.description.substring(0, 100) + "..."
        : order.description
      : "Опис відсутній";

    // Get industry icon
    const industryIcon = getIndustryIcon(order.industry);

    orderCard.innerHTML = `
      <div class="order-status ${statusClass}">${statusText}</div>
      <h3 class="order-title">${order.title}</h3>
      <div class="order-industry">
        <i class="${industryIcon}"></i>
        <span>${order.industry || "Галузь не вказана"}</span>
      </div>
      <p class="order-description">${shortDescription}</p>
      <div class="order-meta">
        <div class="order-date">
          <i class="far fa-calendar-alt"></i>
          <span>${formattedDate}</span>
        </div>
      </div>
      <div class="order-actions">
        <button class="order-btn view-btn" data-id="${order.id}">
          <i class="fas fa-eye"></i>
          Переглянути
        </button>
      </div>
    `;

    // Add action buttons for masters and admins if order is pending
    if (
      (userRole === "master" || userRole === "admin") &&
      order.status === "pending"
    ) {
      const actionsDiv = orderCard.querySelector(".order-actions");
      actionsDiv.innerHTML = `
        <button class="order-btn view-btn" data-id="${order.id}">
          <i class="fas fa-eye"></i>
          Переглянути
        </button>
        <button class="order-btn accept-btn" data-id="${order.id}">
          <i class="fas fa-check"></i>
          Прийняти
        </button>
        <button class="order-btn reject-btn" data-id="${order.id}">
          <i class="fas fa-times"></i>
          Відхилити
        </button>
      `;
    }

    ordersContainer.appendChild(orderCard);
  });

  // Add event listeners to buttons
  addOrderButtonListeners();
}

// Add event listeners to order buttons
function addOrderButtonListeners() {
  // View buttons
  const viewButtons = document.querySelectorAll(".view-btn");
  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.id;
      showOrderDetails(orderId);
    });
  });

  // Accept buttons
  const acceptButtons = document.querySelectorAll(".accept-btn");
  acceptButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.id;

      // Check if master's industry matches the order's industry
      if (userRole === "master") {
        const order = allOrders.find((o) => o.id == orderId);
        const masterIndustry = localStorage.getItem("masterIndustry");

        if (order && masterIndustry && order.industry !== masterIndustry) {
          // Show industry mismatch modal
          const industryMismatchModal = document.getElementById(
            "industryMismatchModal"
          );
          const masterIndustrySpan = document.getElementById("masterIndustry");
          const orderIndustrySpan = document.getElementById("orderIndustry");

          masterIndustrySpan.textContent = masterIndustry;
          orderIndustrySpan.textContent = order.industry;

          industryMismatchModal.classList.add("active");

          // Add event listener to close button
          const industryModalClose =
            document.getElementById("industryModalClose");
          const industryModalCloseBtn = document.getElementById(
            "industryModalCloseBtn"
          );

          industryModalClose.addEventListener("click", () => {
            industryMismatchModal.classList.remove("active");
          });

          industryModalCloseBtn.addEventListener("click", () => {
            industryMismatchModal.classList.remove("active");
          });

          return;
        }
      }

      // Show confirmation modal
      showConfirmationModal("Ви впевнені, що хочете прийняти цю заявку?", () =>
        updateOrderStatus(orderId, "completed")
      );
    });
  });

  // Reject buttons
  const rejectButtons = document.querySelectorAll(".reject-btn");
  rejectButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const orderId = button.dataset.id;

      // Show confirmation modal
      showConfirmationModal("Ви впевнені, що хочете відхилити цю заявку?", () =>
        updateOrderStatus(orderId, "rejected")
      );
    });
  });
}

// Show confirmation modal
function showConfirmationModal(message, confirmCallback) {
  confirmationMessage.textContent = message;

  // Set up confirm button
  confirmBtn.onclick = () => {
    confirmCallback();
    confirmationModal.classList.remove("active");
  };

  // Show modal
  confirmationModal.classList.add("active");
}

// Show order details in modal
function showOrderDetails(orderId) {
  const order = allOrders.find((o) => o.id == orderId);

  if (!order) {
    console.error("Order not found:", orderId);
    return;
  }

  // Format dates
  const createdDate = new Date(order.created_at).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const updatedDate = new Date(order.updated_at).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Get status class and text
  const statusClass = getStatusClass(order.status);
  const statusText = getStatusText(order.status);

  // Get industry icon
  const industryIcon = getIndustryIcon(order.industry);

  // Populate modal content
  orderModalContent.innerHTML = `
    <h2 class="modal-title">${order.title}</h2>
    
    <div class="modal-info-group">
      <span class="modal-label">Статус:</span>
      <span class="modal-status ${statusClass}">${statusText}</span>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Галузь:</span>
      <div class="modal-value">
        <i class="${industryIcon}"></i>
        ${order.industry || "Не вказано"}
      </div>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Опис проблеми:</span>
      <div class="modal-value">${order.description || "Опис відсутній"}</div>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Контактний телефон:</span>
      <div class="modal-value">
        <a href="tel:${order.phone}">${order.phone}</a>
      </div>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Замовник:</span>
      <div class="modal-value">
        ${order.user_first_name || ""} ${order.user_last_name || ""} 
        ${
          order.user_first_name || order.user_last_name
            ? ""
            : order.user_username || "Невідомо"
        }
      </div>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Створено:</span>
      <div class="modal-value">${createdDate}</div>
    </div>
    
    <div class="modal-info-group">
      <span class="modal-label">Оновлено:</span>
      <div class="modal-value">${updatedDate}</div>
    </div>
  `;

  // Add master info if assigned
  if (order.master_id) {
    const masterName =
      order.master_first_name || order.master_last_name
        ? `${order.master_first_name || ""} ${order.master_last_name || ""}`
        : order.master_username || "Невідомо";

    orderModalContent.innerHTML += `
      <div class="modal-info-group">
        <span class="modal-label">Майстер:</span>
        <div class="modal-value">${masterName}</div>
      </div>
    `;
  }

  // Set up action buttons based on status and role
  orderModalActions.innerHTML = "";

  if (
    (userRole === "master" || userRole === "admin") &&
    order.status === "pending"
  ) {
    orderModalActions.innerHTML = `
      <button class="modal-btn modal-btn-accept" data-id="${order.id}">
        <i class="fas fa-check"></i>
        Прийняти заявку
      </button>
      <button class="modal-btn modal-btn-reject" data-id="${order.id}">
        <i class="fas fa-times"></i>
        Відхилити заявку
      </button>
    `;
  } else {
    orderModalActions.innerHTML = `
      <button class="modal-btn modal-btn-close">
        <i class="fas fa-times"></i>
        Закрити
      </button>
    `;
  }

  // Add event listeners to modal buttons
  const modalAcceptBtn = orderModalActions.querySelector(".modal-btn-accept");
  if (modalAcceptBtn) {
    modalAcceptBtn.addEventListener("click", () => {
      const orderId = modalAcceptBtn.dataset.id;

      // Check if master's industry matches the order's industry
      if (userRole === "master") {
        const masterIndustry = localStorage.getItem("masterIndustry");

        if (masterIndustry && order.industry !== masterIndustry) {
          // Show industry mismatch modal
          const industryMismatchModal = document.getElementById(
            "industryMismatchModal"
          );
          const masterIndustrySpan = document.getElementById("masterIndustry");
          const orderIndustrySpan = document.getElementById("orderIndustry");

          masterIndustrySpan.textContent = masterIndustry;
          orderIndustrySpan.textContent = order.industry;

          industryMismatchModal.classList.add("active");
          orderDetailsModal.classList.remove("active");

          // Add event listener to close button
          const industryModalClose =
            document.getElementById("industryModalClose");
          const industryModalCloseBtn = document.getElementById(
            "industryModalCloseBtn"
          );

          industryModalClose.addEventListener("click", () => {
            industryMismatchModal.classList.remove("active");
          });

          industryModalCloseBtn.addEventListener("click", () => {
            industryMismatchModal.classList.remove("active");
          });

          return;
        }
      }

      // Show confirmation modal
      orderDetailsModal.classList.remove("active");
      showConfirmationModal("Ви впевнені, що хочете прийняти цю заявку?", () =>
        updateOrderStatus(orderId, "completed")
      );
    });
  }

  const modalRejectBtn = orderModalActions.querySelector(".modal-btn-reject");
  if (modalRejectBtn) {
    modalRejectBtn.addEventListener("click", () => {
      const orderId = modalRejectBtn.dataset.id;

      // Show confirmation modal
      orderDetailsModal.classList.remove("active");
      showConfirmationModal("Ви впевнені, що хочете відхилити цю заявку?", () =>
        updateOrderStatus(orderId, "rejected")
      );
    });
  }

  const modalCloseBtn = orderModalActions.querySelector(".modal-btn-close");
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () => {
      orderDetailsModal.classList.remove("active");
    });
  }

  // Show modal
  orderDetailsModal.classList.add("active");
}

// Update order status
function updateOrderStatus(orderId, status) {
  // Show loading state
  const orderCard = document.querySelector(`.order-card[data-id="${orderId}"]`);
  if (orderCard) {
    orderCard.style.opacity = "0.7";
    orderCard.style.pointerEvents = "none";
  }

  // Prepare request data
  const requestData = {
    status: status,
    master_id: userId,
  };

  // Send update request
  fetch(`/orders/${orderId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(requestData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to update order status");
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        // Show success message
        showNotification(
          `Заявку успішно ${status === "completed" ? "прийнято" : "відхилено"}`,
          "success"
        );

        // Update local data
        const orderIndex = allOrders.findIndex((o) => o.id == orderId);
        if (orderIndex !== -1) {
          allOrders[orderIndex].status = status;
          allOrders[orderIndex].master_id = userId;
          allOrders[orderIndex].updated_at = new Date().toISOString();

          // If we have socket connection, emit the update
          if (socket) {
            socket.emit("order-updated", allOrders[orderIndex]);
          }
        }

        // Re-render orders
        filterAndRenderOrders();
      } else {
        showNotification("Помилка при оновленні статусу заявки", "error");

        // Reset order card
        if (orderCard) {
          orderCard.style.opacity = "1";
          orderCard.style.pointerEvents = "auto";
        }
      }
    })
    .catch((error) => {
      console.error("Error updating order status:", error);
      showNotification("Помилка з'єднання з сервером", "error");

      // Reset order card
      if (orderCard) {
        orderCard.style.opacity = "1";
        orderCard.style.pointerEvents = "auto";
      }
    });
}

// Helper function to get status class
function getStatusClass(status) {
  switch (status) {
    case "pending":
      return "status-pending";
    case "completed":
      return "status-completed";
    case "rejected":
      return "status-rejected";
    default:
      return "";
  }
}

// Helper function to get status text
function getStatusText(status) {
  switch (status) {
    case "pending":
      return "Очікує розгляду";
    case "completed":
      return "Виконано";
    case "rejected":
      return "Відхилено";
    default:
      return "Невідомо";
  }
}

// Helper function to get industry icon
function getIndustryIcon(industry) {
  const industryIcons = {
    "Інформаційні технології": "fas fa-laptop-code",
    Медицина: "fas fa-heartbeat",
    Енергетика: "fas fa-bolt",
    "Аграрна галузь": "fas fa-tractor",
    "Фінанси та банківська справа": "fas fa-money-bill-wave",
    Освіта: "fas fa-graduation-cap",
    "Туризм і гостинність": "fas fa-plane",
    "Будівництво та нерухомість": "fas fa-hard-hat",
    Транспорт: "fas fa-truck",
    "Мистецтво і культура": "fas fa-palette",
  };

  return industryIcons[industry] || "fas fa-briefcase";
}

// Show notification
function showNotification(message, type = "info") {
  // Create notification element if it doesn't exist
  let notification = document.querySelector(".notification");

  if (!notification) {
    notification = document.createElement("div");
    notification.className = "notification";
    document.body.appendChild(notification);
  }

  // Set notification type
  notification.className = `notification ${type}`;

  // Set message
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas ${
        type === "success"
          ? "fa-check-circle"
          : type === "error"
          ? "fa-exclamation-circle"
          : "fa-info-circle"
      }"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">
      <i class="fas fa-times"></i>
    </button>
  `;

  // Show notification
  notification.classList.add("active");

  // Add close button event listener
  const closeBtn = notification.querySelector(".notification-close");
  closeBtn.addEventListener("click", () => {
    notification.classList.remove("active");
  });

  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.classList.remove("active");
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
