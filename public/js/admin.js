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

  // Update charts with new theme
  updateChartsTheme();
});

// User Menu Toggle
const userMenuBtn = document.getElementById("userMenuBtn");
const userMenuDropdown = document.getElementById("userMenuDropdown");

userMenuBtn.addEventListener("click", function () {
  userMenuDropdown.classList.toggle("show");
});

// Close dropdown when clicking outside
document.addEventListener("click", function (event) {
  if (
    !userMenuBtn.contains(event.target) &&
    !userMenuDropdown.contains(event.target)
  ) {
    userMenuDropdown.classList.remove("show");
  }
});

// Tab Navigation
const tabLinks = document.querySelectorAll(".sidebar-menu a");
const tabContents = document.querySelectorAll(".tab-content");

tabLinks.forEach((link) => {
  link.addEventListener("click", function (e) {
    if (this.getAttribute("href").startsWith("#")) {
      e.preventDefault();
      const tabId = this.getAttribute("data-tab");

      // Remove active class from all links and contents
      tabLinks.forEach((link) => link.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to current link and content
      this.classList.add("active");
      document.getElementById(`${tabId}-tab`).classList.add("active");

      // Load data for the active tab
      if (tabId === "dashboard") {
        loadDashboardData();
      } else if (tabId === "users") {
        loadUsers();
      } else if (tabId === "masters") {
        loadMasters();
      } else if (tabId === "orders") {
        loadOrders();
      } else if (tabId === "reviews") {
        loadReviews();
      }
    }
  });
});

// Content Tabs
const contentTabs = document.querySelectorAll(".content-tab");
const contentTabPanes = document.querySelectorAll(".content-tab-pane");

contentTabs.forEach((tab) => {
  tab.addEventListener("click", function () {
    const contentId = this.getAttribute("data-content");

    // Remove active class from all tabs and panes
    contentTabs.forEach((tab) => tab.classList.remove("active"));
    contentTabPanes.forEach((pane) => pane.classList.remove("active"));

    // Add active class to current tab and pane
    this.classList.add("active");
    document.getElementById(`${contentId}-content`).classList.add("active");

    // Load data for the active content tab
    if (contentId === "master-list") {
      loadMasters();
    } else if (contentId === "master-requests") {
      loadMasterRequests();
    }
  });
});

// Show notification
function showNotification(message, type = "success") {
  const notification = document.getElementById("notification");
  const notificationText = document.getElementById("notificationText");

  notification.className = "notification";
  notification.classList.add(type);
  notification.classList.add("show");

  notificationText.textContent = message;

  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}
// Load Age Demographics Chart with real data from database
function loadAgeChart() {
  fetch("/api/age-demographics")
    .then((response) => response.json())
    .then((data) => {
      const ctx = document.getElementById("ageChart").getContext("2d")

      // Format data from real database values
      const labels = data.map((item) => item.category)
      const percentages = data.map((item) => item.percentage)

      // Create chart with real data
      const ageChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Відсоток користувачів",
              data: percentages,
              backgroundColor: [
                "rgba(255, 99, 132, 0.7)",
                "rgba(54, 162, 235, 0.7)",
                "rgba(255, 206, 86, 0.7)",
                "rgba(75, 192, 192, 0.7)",
                "rgba(153, 102, 255, 0.7)",
                "rgba(255, 159, 64, 0.7)",
                "rgba(255, 99, 132, 0.7)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
                "rgba(255, 99, 132, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: htmlElement.classList.contains("light") ? "#333" : "#fff",
              },
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.raw.toFixed(1)}%`,
              },
            },
          },
          scales: {
            x: {
              grid: {
                color: htmlElement.classList.contains("light") ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
              },
              ticks: {
                color: htmlElement.classList.contains("light") ? "#333" : "#fff",
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: htmlElement.classList.contains("light") ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)",
              },
              ticks: {
                color: htmlElement.classList.contains("light") ? "#333" : "#fff",
                callback: (value) => value + "%",
              },
            },
          },
        },
      })

      // Store chart reference for theme updates
      window.ageChart = ageChart
    })
    .catch((error) => {
      console.error("Error loading age demographics:", error)
      showNotification("Помилка при завантаженні вікової демографії", "error")
    })
}

// Load Dashboard Data
function loadDashboardData() {
  // Load user and master counts with real data
  fetch("/api/user-master-count")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("totalUsers").textContent = data.users;
      document.getElementById("totalMasters").textContent = data.masters;

      // Calculate percentage change based on real growth data
      const usersGrowthPercent = data.users > 0 
        ? Math.round((data.usersGrowth / data.users) * 100) 
        : 0;
      const mastersGrowthPercent = data.masters > 0 
        ? Math.round((data.mastersGrowth / data.masters) * 100) 
        : 0;
      
      document.getElementById("usersChange").textContent = `${usersGrowthPercent}%`;
      document.getElementById("mastersChange").textContent = `${mastersGrowthPercent}%`;
    })
    .catch((error) => {
      console.error("Error loading user-master count:", error);
      showNotification("Помилка при завантаженні даних користувачів", "error");
    });

  // Rest of the loadDashboardData function remains unchanged
  // Load orders count
  fetch("/orders")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("totalOrders").textContent = data.orders.length;

      // Count pending requests
      const pendingOrders = data.orders.filter(
        (order) => order.status === "pending"
      ).length;
      document.getElementById("pendingRequests").textContent = pendingOrders;

      // Load recent orders for dashboard
      loadRecentOrders(data.orders.slice(0, 5));
    })
    .catch((error) => console.error("Error loading orders:", error));

  // Load reviews count
  fetch("/reviews")
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("totalReviews").textContent = data.reviews.length;

      // Calculate percentage change (placeholder)
      document.getElementById("reviewsChange").textContent = "10%";
    })
    .catch((error) => console.error("Error loading reviews count:", error));

  // Load master requests count
  fetch("/master-requests")
    .then((response) => response.json())
    .then((data) => {
      const pendingRequests = data.requests.filter(
        (request) => request.status === "pending"
      ).length;
      // Add to pending count
      const currentPending = parseInt(
        document.getElementById("pendingRequests").textContent
      );
      document.getElementById("pendingRequests").textContent =
        currentPending + pendingRequests;
    })
    .catch((error) => console.error("Error loading master requests:", error));

  // Load charts with real data
  loadUserMasterChart();
  loadAgeChart();
}
// Load User-Master Timeline Chart
function loadUserMasterChart() {
  fetch("/api/user-master-timeline")
    .then((response) => response.json())
    .then((data) => {
      const ctx = document.getElementById("userMasterChart").getContext("2d");

      // Format labels and datasets
      const labels = data.map((item) => item.month);
      const usersData = data.map((item) => item.users);
      const mastersData = data.map((item) => item.masters);

      // Create chart
      const userMasterChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Користувачі",
              data: usersData,
              borderColor: "#007bff",
              backgroundColor: "rgba(0, 123, 255, 0.1)",
              tension: 0.3,
              fill: true,
            },
            {
              label: "Майстри",
              data: mastersData,
              borderColor: "#ff3300",
              backgroundColor: "rgba(255, 51, 0, 0.1)",
              tension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: htmlElement.classList.contains("light")
                  ? "#333"
                  : "#fff",
              },
            },
            tooltip: {
              mode: "index",
              intersect: false,
            },
          },
          scales: {
            x: {
              grid: {
                color: htmlElement.classList.contains("light")
                  ? "rgba(0,0,0,0.1)"
                  : "rgba(255,255,255,0.1)",
              },
              ticks: {
                color: htmlElement.classList.contains("light")
                  ? "#333"
                  : "#fff",
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: htmlElement.classList.contains("light")
                  ? "rgba(0,0,0,0.1)"
                  : "rgba(255,255,255,0.1)",
              },
              ticks: {
                color: htmlElement.classList.contains("light")
                  ? "#333"
                  : "#fff",
              },
            },
          },
        },
      });

      // Store chart reference for theme updates
      window.userMasterChart = userMasterChart;
    })
    .catch((error) =>
      console.error("Error loading user-master timeline:", error)
    );
}

// Load Age Demographics Chart
function loadAgeChart() {
  fetch("/api/age-demographics")
    .then((response) => response.json())
    .then((data) => {
      const ctx = document.getElementById("ageChart").getContext("2d");

      // Format data
      const labels = data.map((item) => item.category);
      const percentages = data.map((item) => item.percentage);

      // Create chart
      const ageChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Відсоток користувачів",
              data: percentages,
              backgroundColor: [
                "rgba(255, 99, 132, 0.7)",
                "rgba(54, 162, 235, 0.7)",
                "rgba(255, 206, 86, 0.7)",
                "rgba(75, 192, 192, 0.7)",
                "rgba(153, 102, 255, 0.7)",
                "rgba(255, 159, 64, 0.7)",
                "rgba(255, 99, 132, 0.7)",
              ],
              borderColor: [
                "rgba(255, 99, 132, 1)",
                "rgba(54, 162, 235, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
                "rgba(153, 102, 255, 1)",
                "rgba(255, 159, 64, 1)",
                "rgba(255, 99, 132, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: htmlElement.classList.contains("light")
                  ? "#333"
                  : "#fff",
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.raw.toFixed(1)}%`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: {
                color: htmlElement.classList.contains("light")
                  ? "rgba(0,0,0,0.1)"
                  : "rgba(255,255,255,0.1)",
              },
              ticks: {
                color: htmlElement.classList.contains("light")
                  ? "#333"
                  : "#fff",
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: htmlElement.classList.contains("light")
                  ? "rgba(0,0,0,0.1)"
                  : "rgba(255,255,255,0.1)",
              },
              ticks: {
                color: htmlElement.classList.contains("light")
                  ? "#333"
                  : "#fff",
                callback: function (value) {
                  return value + "%";
                },
              },
            },
          },
        },
      });

      // Store chart reference for theme updates
      window.ageChart = ageChart;
    })
    .catch((error) => console.error("Error loading age demographics:", error));
}

// Load Review Ratings Chart
function loadReviewRatingsChart() {
  fetch("/api/review-ratings")
    .then((response) => response.json())
    .then((data) => {
      const ctx = document
        .getElementById("reviewRatingsChart")
        .getContext("2d");

      // Format data
      const labels = ["1 зірка", "2 зірки", "3 зірки", "4 зірки", "5 зірок"];
      const counts = [
        data.ratings[1] || 0,
        data.ratings[2] || 0,
        data.ratings[3] || 0,
        data.ratings[4] || 0,
        data.ratings[5] || 0,
      ];

      // Create chart
      const reviewRatingsChart = new Chart(ctx, {
        type: "pie",
        data: {
          labels: labels,
          datasets: [
            {
              data: counts,
              backgroundColor: [
                "rgba(231, 76, 60, 0.7)",
                "rgba(243, 156, 18, 0.7)",
                "rgba(241, 196, 15, 0.7)",
                "rgba(46, 204, 113, 0.7)",
                "rgba(39, 174, 96, 0.7)",
              ],
              borderColor: [
                "rgba(231, 76, 60, 1)",
                "rgba(243, 156, 18, 1)",
                "rgba(241, 196, 15, 1)",
                "rgba(46, 204, 113, 1)",
                "rgba(39, 174, 96, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "right",
              labels: {
                color: htmlElement.classList.contains("light")
                  ? "#333"
                  : "#fff",
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${value} відгуків (${percentage}%)`;
                },
              },
            },
          },
        },
      });

      // Store chart reference for theme updates
      window.reviewRatingsChart = reviewRatingsChart;
    })
    .catch((error) => console.error("Error loading review ratings:", error));
}

// Load Review Industries Chart
function loadReviewIndustriesChart() {
  fetch("/api/review-industries")
    .then((response) => response.json())
    .then((data) => {
      const ctx = document
        .getElementById("reviewIndustriesChart")
        .getContext("2d");

      // Format data
      const industries = data.industries;
      const labels = Object.keys(industries);
      const counts = Object.values(industries);

      // Create chart
      const reviewIndustriesChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Кількість відгуків",
              data: counts,
              backgroundColor: "rgba(52, 152, 219, 0.7)",
              borderColor: "rgba(52, 152, 219, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                color: htmlElement.classList.contains("light")
                  ? "#333"
                  : "#fff",
              },
            },
          },
          scales: {
            x: {
              grid: {
                color: htmlElement.classList.contains("light")
                  ? "rgba(0,0,0,0.1)"
                  : "rgba(255,255,255,0.1)",
              },
              ticks: {
                color: htmlElement.classList.contains("light")
                  ? "#333"
                  : "#fff",
              },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: htmlElement.classList.contains("light")
                  ? "rgba(0,0,0,0.1)"
                  : "rgba(255,255,255,0.1)",
              },
              ticks: {
                color: htmlElement.classList.contains("light")
                  ? "#333"
                  : "#fff",
              },
            },
          },
        },
      });

      // Store chart reference for theme updates
      window.reviewIndustriesChart = reviewIndustriesChart;
    })
    .catch((error) => console.error("Error loading review industries:", error));
}

// Update charts theme
function updateChartsTheme() {
  const textColor = htmlElement.classList.contains("light") ? "#333" : "#fff";
  const gridColor = htmlElement.classList.contains("light")
    ? "rgba(0,0,0,0.1)"
    : "rgba(255,255,255,0.1)";

  // Update user-master chart
  if (window.userMasterChart) {
    window.userMasterChart.options.plugins.legend.labels.color = textColor;
    window.userMasterChart.options.scales.x.grid.color = gridColor;
    window.userMasterChart.options.scales.y.grid.color = gridColor;
    window.userMasterChart.options.scales.x.ticks.color = textColor;
    window.userMasterChart.options.scales.y.ticks.color = textColor;
    window.userMasterChart.update();
  }

  // Update age chart
  if (window.ageChart) {
    window.ageChart.options.plugins.legend.labels.color = textColor;
    window.ageChart.options.scales.x.grid.color = gridColor;
    window.ageChart.options.scales.y.grid.color = gridColor;
    window.ageChart.options.scales.x.ticks.color = textColor;
    window.ageChart.options.scales.y.ticks.color = textColor;
    window.ageChart.update();
  }

  // Update review ratings chart
  if (window.reviewRatingsChart) {
    window.reviewRatingsChart.options.plugins.legend.labels.color = textColor;
    window.reviewRatingsChart.update();
  }

  // Update review industries chart
  if (window.reviewIndustriesChart) {
    window.reviewIndustriesChart.options.plugins.legend.labels.color =
      textColor;
    window.reviewIndustriesChart.options.scales.x.grid.color = gridColor;
    window.reviewIndustriesChart.options.scales.y.grid.color = gridColor;
    window.reviewIndustriesChart.options.scales.x.ticks.color = textColor;
    window.reviewIndustriesChart.options.scales.y.ticks.color = textColor;
    window.reviewIndustriesChart.update();
  }
}

// Load Recent Orders for Dashboard
function loadRecentOrders(orders) {
  const tableBody = document.querySelector("#recentOrdersTable tbody");
  tableBody.innerHTML = "";

  if (orders.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            <i class="fas fa-clipboard-list"></i>
            <div class="empty-state-text">Немає заявок для відображення</div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  orders.forEach((order) => {
    const createdDate = new Date(order.created_at).toLocaleString("uk-UA");
    const clientName = `${order.user_first_name || ""} ${
      order.user_last_name || ""
    } (${order.user_username})`;
    const masterName = order.master_id
      ? `${order.master_first_name || ""} ${order.master_last_name || ""} (${
          order.master_username
        })`
      : "Не призначено";

    const row = `
      <tr>
        <td>${order.id}</td>
        <td>${order.title}</td>
        <td>${clientName}</td>
        <td>${order.phone}</td>
        <td><span class="status-badge status-${order.status}">${getStatusText(
      order.status
    )}</span></td>
        <td>${masterName}</td>
        <td>${createdDate}</td>
        <td>
          <button class="btn btn-info" onclick="showOrderDetails(${order.id})">
            <i class="fas fa-eye"></i>
          </button>
        </td>
      </tr>
    `;
    tableBody.innerHTML += row;
  });
}

// Load Users
function loadUsers() {
  fetch("/admin/users-with-services")
    .then((response) => response.json())
    .then((usersWithServices) => {
      const tableBody = document.querySelector("#usersTable tbody");
      tableBody.innerHTML = "";

      if (usersWithServices.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="9">
              <div class="empty-state">
                <i class="fas fa-users"></i>
                <div class="empty-state-text">Немає користувачів для відображення</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      usersWithServices.forEach((user) => {
        const industries = user.services
          .filter((service) => service.service_type === "industry")
          .map((service) => service.service_name)
          .join(", ");

        const skills = user.services
          .filter(
            (service) =>
              service.service_type.endsWith("-skills-text") ||
              service.service_type === "custom-skills"
          )
          .map((service) => service.service_name)
          .join(", ");

        const row = `
          <tr>
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.role_master ? "Майстер" : "Користувач"} ${
          user.approval_status
            ? `<span class="status-badge status-${
                user.approval_status
              }">${getStatusText(user.approval_status)}</span>`
            : ""
        }</td>
            <td>${user.first_name || ""}</td>
            <td>${user.last_name || ""}</td>
            <td>${user.email || ""}</td>
            <td>${industries || "Не вказано"}</td>
            <td>${skills || "Не вказано"}</td>
            <td class="action-buttons">
              <button class="btn btn-info" onclick="showUserDetails(${
                user.id
              })">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-danger" onclick="deleteUser(${user.id})">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });

      // Create pagination
      createPagination(usersWithServices.length, 10, "usersPagination");
    })
    .catch((error) => {
      console.error("Помилка при завантаженні користувачів:", error);
      showNotification("Помилка при завантаженні користувачів", "error");
    });
}

// Load Masters
function loadMasters() {
  fetch("/admin/users-with-services")
    .then((response) => response.json())
    .then((usersWithServices) => {
      // Filter only masters
      const masters = usersWithServices.filter((user) => user.role_master);

      const tableBody = document.querySelector("#mastersTable tbody");
      tableBody.innerHTML = "";

      if (masters.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="9">
              <div class="empty-state">
                <i class="fas fa-user-tie"></i>
                <div class="empty-state-text">Немає майстрів для відображення</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      masters.forEach((master) => {
        const industries = master.services
          .filter((service) => service.service_type === "industry")
          .map((service) => service.service_name)
          .join(", ");

        const skills = master.services
          .filter(
            (service) =>
              service.service_type.endsWith("-skills-text") ||
              service.service_type === "custom-skills"
          )
          .map((service) => service.service_name)
          .join(", ");

        const row = `
          <tr>
            <td>${master.id}</td>
            <td>${master.username}</td>
            <td>${master.first_name || ""}</td>
            <td>${master.last_name || ""}</td>
            <td>${master.email || ""}</td>
            <td>${industries || "Не вказано"}</td>
            <td>${skills || "Не вказано"}</td>
            <td><span class="status-badge status-${
              master.approval_status
            }">${getStatusText(master.approval_status)}</span></td>
            <td class="action-buttons">
              <button class="btn btn-info" onclick="showUserDetails(${
                master.id
              })">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-danger" onclick="deleteUser(${master.id})">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });

      // Create pagination
      createPagination(masters.length, 10, "mastersPagination");
    })
    .catch((error) => {
      console.error("Помилка при завантаженні майстрів:", error);
      showNotification("Помилка при завантаженні майстрів", "error");
    });
}

// Load Reviews
function loadReviews() {
  fetch("/reviews")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.querySelector("#reviewsTable tbody");
      tableBody.innerHTML = "";

      if (!data.reviews || data.reviews.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state">
                <i class="fas fa-star"></i>
                <div class="empty-state-text">Немає відгуків для відображення</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      data.reviews.forEach((review) => {
        const createdDate = new Date(review.created_at).toLocaleString("uk-UA");
        const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

        const row = `
          <tr>
            <td>${review.id}</td>
            <td>${review.name}</td>
            <td>${review.industry}</td>
            <td><span class="review-stars" title="${
              review.rating
            } з 5">${stars}</span></td>
            <td>${
              review.text.length > 50
                ? review.text.substring(0, 50) + "..."
                : review.text
            }</td>
            <td>${review.master_name || "Не вказано"}</td>
            <td>${createdDate}</td>
            <td class="action-buttons">
              <button class="btn btn-info" onclick="showReviewDetails(${
                review.id
              })">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-danger" onclick="deleteReview(${
                review.id
              })">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });

      // Create pagination
      createPagination(data.reviews.length, 10, "reviewsPagination");

      // Load review charts
      loadReviewRatingsChart();
      loadReviewIndustriesChart();
    })
    .catch((error) => {
      console.error("Помилка при завантаженні відгуків:", error);
      showNotification("Помилка при завантаженні відгуків", "error");
    });
}

// Show Review Details
function showReviewDetails(reviewId) {
  fetch(`/reviews/${reviewId}`)
    .then((response) => response.json())
    .then((data) => {
      const review = data.review;
      if (!review) {
        showNotification("Відгук не знайдено", "error");
        return;
      }

      const createdDate = new Date(review.created_at).toLocaleString("uk-UA");
      const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

      const reviewDetailsBody = document.getElementById("reviewDetailsBody");
      reviewDetailsBody.innerHTML = `
        <div class="user-profile-details">
          <div class="detail-item">
            <div class="detail-label">ID</div>
            <div class="detail-value">${review.id}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Ім'я</div>
            <div class="detail-value">${review.name}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Галузь</div>
            <div class="detail-value">${review.industry}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Оцінка</div>
            <div class="detail-value"><span class="review-stars">${stars}</span> (${
        review.rating
      } з 5)</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Майстер</div>
            <div class="detail-value">${
              review.master_name || "Не вказано"
            }</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Користувач</div>
            <div class="detail-value">${
              review.user_id ? `ID: ${review.user_id}` : "Анонімний"
            }</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Дата створення</div>
            <div class="detail-value">${createdDate}</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Текст відгуку</label>
          <div class="detail-value review-text">${review.text}</div>
        </div>
      `;

      const reviewDetailsFooter = document.getElementById(
        "reviewDetailsFooter"
      );
      reviewDetailsFooter.innerHTML = `
        <button class="btn btn-danger" onclick="deleteReview(${review.id}); closeReviewDetailsModal();">
          <i class="fas fa-trash"></i> Видалити
        </button>
        <button class="btn btn-primary" id="closeReviewModalBtn">Закрити</button>
      `;

      // Set up close button
      document.getElementById("closeReviewModalBtn").onclick =
        closeReviewDetailsModal;

      // Show modal
      document.getElementById("reviewDetailsModal").classList.add("show");
    })
    .catch((error) => {
      console.error("Помилка при завантаженні деталей відгуку:", error);
      showNotification("Помилка при завантаженні деталей відгуку", "error");
    });
}

// Close Review Details Modal
function closeReviewDetailsModal() {
  document.getElementById("reviewDetailsModal").classList.remove("show");
}

// Delete Review
function deleteReview(reviewId) {
  if (confirm(`Ви впевнені, що хочете видалити відгук з ID ${reviewId}?`)) {
    fetch(`/reviews/${reviewId}`, { method: "DELETE" })
      .then((response) => response.json())
      .then((data) => {
        showNotification(data.message, "success");
        loadReviews();
        loadDashboardData();
      })
      .catch((error) => {
        console.error("Помилка при видаленні відгуку:", error);
        showNotification("Помилка при видаленні відгуку", "error");
      });
  }
}

// Export Reviews to CSV
document
  .getElementById("exportReviewsBtn")
  .addEventListener("click", function () {
    fetch("/reviews")
      .then((response) => response.json())
      .then((data) => {
        // Prepare CSV content
        let csvContent = "data:text/csv;charset=utf-8,";

        // Add headers
        csvContent += "ID,Ім'я,Галузь,Оцінка,Відгук,Майстер,Дата створення\n";

        // Add rows
        data.reviews.forEach((review) => {
          const createdDate = new Date(review.created_at).toLocaleString(
            "uk-UA"
          );

          // Create CSV row
          const row = [
            review.id,
            `"${review.name.replace(/"/g, '""')}"`,
            `"${review.industry.replace(/"/g, '""')}"`,
            review.rating,
            `"${review.text.replace(/"/g, '""')}"`,
            `"${(review.master_name || "Не вказано").replace(/"/g, '""')}"`,
            createdDate,
          ].join(",");

          csvContent += row + "\n";
        });

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
          "download",
          `reviews_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);

        // Trigger download
        link.click();
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.error("Помилка при експорті відгуків:", error);
        showNotification("Помилка при експорті відгуків", "error");
      });
  });

// Load Master Requests
function loadMasterRequests() {
  fetch("/master-requests")
    .then((response) => response.json())
    .then(async (data) => {
      const tableBody = document.querySelector("#masterRequestsTable tbody");
      tableBody.innerHTML = "";

      if (data.requests.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="10">
              <div class="empty-state">
                <i class="fas fa-clipboard-check"></i>
                <div class="empty-state-text">Немає запитів на роль майстра</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      for (const request of data.requests) {
        // Fetch user services
        const servicesResponse = await fetch(`/services/${request.user_id}`);
        const servicesData = await servicesResponse.json();

        const industries = servicesData.services
          .filter((service) => service.service_type === "industry")
          .map((service) => service.service_name)
          .join(", ");

        const skills = servicesData.services
          .filter(
            (service) =>
              service.service_type.endsWith("-skills-text") ||
              service.service_type === "custom-skills"
          )
          .map((service) => service.service_name)
          .join(", ");

        const createdDate = new Date(request.created_at).toLocaleString(
          "uk-UA"
        );

        const row = `
          <tr>
            <td>${request.id}</td>
            <td>${request.username}</td>
            <td>${request.first_name || ""}</td>
            <td>${request.last_name || ""}</td>
            <td>${request.email || ""}</td>
            <td>${industries || "Не вказано"}</td>
            <td>${skills || "Не вказано"}</td>
            <td><span class="status-badge status-${
              request.status
            }">${getStatusText(request.status)}</span></td>
            <td>${createdDate}</td>
            <td class="action-buttons">
              ${
                request.status === "pending"
                  ? `
                <button class="btn btn-success" onclick="updateRequestStatus(${request.id}, 'approved')">
                  <i class="fas fa-check"></i> Затвердити
                </button>
                <button class="btn btn-danger" onclick="updateRequestStatus(${request.id}, 'rejected')">
                  <i class="fas fa-times"></i> Відхилити
                </button>
              `
                  : ""
              }
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      }

      // Create pagination
      createPagination(data.requests.length, 10, "requestsPagination");
    })
    .catch((error) => {
      console.error("Помилка при завантаженні запитів майстрів:", error);
      showNotification("Помилка при завантаженні запитів майстрів", "error");
    });
}

// Load Orders
function loadOrders() {
  fetch("/orders")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.querySelector("#ordersTable tbody");
      tableBody.innerHTML = "";

      if (data.orders.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="9">
              <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <div class="empty-state-text">Немає заявок для відображення</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      data.orders.forEach((order) => {
        const createdDate = new Date(order.created_at).toLocaleString("uk-UA");
        const clientName = `${order.user_first_name || ""} ${
          order.user_last_name || ""
        } (${order.user_username})`;
        const masterName = order.master_id
          ? `${order.master_first_name || ""} ${
              order.master_last_name || ""
            } (${order.master_username})`
          : "Не призначено";

        // Отримуємо ID поточного користувача
        const currentUserId = localStorage.getItem("userId");

        let actionButtons = `
          <button class="btn btn-info" onclick="showOrderDetails(${order.id})">
            <i class="fas fa-eye"></i>
          </button>
        `;

        if (order.status === "pending") {
          actionButtons += `
            <button class="btn btn-success" onclick="updateOrderStatus(${order.id}, 'approved', ${currentUserId})">
              <i class="fas fa-check"></i>
            </button>
            <button class="btn btn-danger" onclick="updateOrderStatus(${order.id}, 'rejected', ${currentUserId})">
              <i class="fas fa-times"></i>
            </button>
          `;
        } else if (
          order.status === "approved" &&
          order.master_id == currentUserId
        ) {
          actionButtons += `
            <button class="btn btn-primary" onclick="updateOrderStatus(${order.id}, 'completed', ${currentUserId})">
              <i class="fas fa-check-double"></i>
            </button>
          `;
        }

        // Додаємо кнопку для дзвінка
        if (order.phone) {
          actionButtons += `
            <button class="btn btn-purple" onclick="callClient('${order.phone}')">
              <i class="fas fa-phone"></i>
            </button>
          `;
        }

        const row = `
          <tr>
            <td>${order.id}</td>
            <td>${order.title}</td>
            <td>${order.description || "Немає опису"}</td>
            <td>${clientName}</td>
            <td>${order.phone}</td>
            <td><span class="status-badge status-${
              order.status
            }">${getStatusText(order.status)}</span></td>
            <td>${masterName}</td>
            <td>${createdDate}</td>
            <td class="action-buttons">
              ${actionButtons}
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });

      // Create pagination
      createPagination(data.orders.length, 10, "ordersPagination");
    })
    .catch((error) => {
      console.error("Помилка при завантаженні замовлень:", error);
      showNotification("Помилка при завантаженні замовлень", "error");
    });
}

// Create Pagination
function createPagination(totalItems, itemsPerPage, paginationId) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginationContainer = document.getElementById(paginationId);
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) {
    return;
  }

  // Previous button
  const prevButton = document.createElement("button");
  prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevButton.disabled = true;
  paginationContainer.appendChild(prevButton);

  // Page buttons
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;
    if (i === 1) {
      pageButton.classList.add("active");
    }
    pageButton.addEventListener("click", function () {
      // Handle page change
      const activeButton = paginationContainer.querySelector("button.active");
      if (activeButton) {
        activeButton.classList.remove("active");
      }
      this.classList.add("active");

      // Enable/disable prev/next buttons
      prevButton.disabled = i === 1;
      nextButton.disabled = i === totalPages;

      // TODO: Implement actual pagination logic
    });
    paginationContainer.appendChild(pageButton);
  }

  // Next button
  const nextButton = document.createElement("button");
  nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextButton.disabled = totalPages === 1;
  paginationContainer.appendChild(nextButton);
}

// Show User Details Modal
function showUserDetails(userId) {
  // Fetch user data
  fetch(`/profile/${userId}`)
    .then((response) => response.json())
    .then(async (userData) => {
      const profile = userData.profile;

      // Fetch user services
      const servicesResponse = await fetch(`/services/${userId}`);
      const servicesData = await servicesResponse.json();

      // Populate user details
      const userProfileDetails = document.getElementById("userProfileDetails");
      userProfileDetails.innerHTML = `
        <div class="detail-item">
          <div class="detail-label">ID</div>
          <div class="detail-value">${profile.user_id}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Ім'я</div>
          <div class="detail-value">${profile.first_name || "Не вказано"}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Прізвище</div>
          <div class="detail-value">${profile.last_name || "Не вказано"}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Email</div>
          <div class="detail-value">${profile.email || "Не вказано"}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Телефон</div>
          <div class="detail-value">${profile.phone || "Не вказано"}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Адреса</div>
          <div class="detail-value">${profile.address || "Не вказано"}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Дата народження</div>
          <div class="detail-value">${
            profile.date_of_birth
              ? new Date(profile.date_of_birth).toLocaleDateString("uk-UA")
              : "Не вказано"
          }</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Роль</div>
          <div class="detail-value">${
            profile.role_master ? "Майстер" : "Користувач"
          }</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">Статус</div>
          <div class="detail-value">${
            profile.approval_status
              ? `<span class="status-badge status-${
                  profile.approval_status
                }">${getStatusText(profile.approval_status)}</span>`
              : "Не визначено"
          }</div>
        </div>
      `;

      // Populate industries
      const userIndustries = document.getElementById("userIndustries");
      const industries = servicesData.services.filter(
        (service) => service.service_type === "industry"
      );

      if (industries.length > 0) {
        userIndustries.innerHTML = industries
          .map(
            (industry) =>
              `<span class="status-badge status-approved">${industry.service_name}</span>`
          )
          .join(" ");
      } else {
        userIndustries.innerHTML = "Не вказано";
      }

      // Populate skills
      const userSkills = document.getElementById("userSkills");
      const skills = servicesData.services.filter(
        (service) =>
          service.service_type.endsWith("-skills-text") ||
          service.service_type === "custom-skills"
      );

      if (skills.length > 0) {
        userSkills.innerHTML = skills
          .map(
            (skill) =>
              `<span class="status-badge status-info">${skill.service_name}</span>`
          )
          .join(" ");
      } else {
        userSkills.innerHTML = "Не вказано";
      }

      // Set up delete button
      const deleteUserBtn = document.getElementById("deleteUserBtn");
      deleteUserBtn.onclick = function () {
        if (
          confirm(`Ви впевнені, що хочете видалити користувача з ID ${userId}?`)
        ) {
          deleteUser(userId);
          closeUserDetailsModal();
        }
      };

      // Show modal
      document.getElementById("userDetailsModal").classList.add("show");
    })
    .catch((error) => {
      console.error("Помилка при завантаженні деталей користувача:", error);
      showNotification("Помилка при завантаженні деталей користувача", "error");
    });
}

// Close User Details Modal
function closeUserDetailsModal() {
  document.getElementById("userDetailsModal").classList.remove("show");
}

// Show Order Details Modal
function showOrderDetails(orderId) {
  // Fetch order data
  fetch("/orders")
    .then((response) => response.json())
    .then((data) => {
      const order = data.orders.find((o) => o.id === orderId);

      if (!order) {
        showNotification("Замовлення не знайдено", "error");
        return;
      }

      const createdDate = new Date(order.created_at).toLocaleString("uk-UA");
      const updatedDate = new Date(order.updated_at).toLocaleString("uk-UA");
      const clientName = `${order.user_first_name || ""} ${
        order.user_last_name || ""
      } (${order.user_username})`;
      const masterName = order.master_id
        ? `${order.master_first_name || ""} ${order.master_last_name || ""} (${
            order.master_username
          })`
        : "Не призначено";

      // Populate order details
      const orderDetailsBody = document.getElementById("orderDetailsBody");
      orderDetailsBody.innerHTML = `
        <div class="user-profile-details">
          <div class="detail-item">
            <div class="detail-label">ID</div>
            <div class="detail-value">${order.id}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Тема</div>
            <div class="detail-value">${order.title}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Статус</div>
            <div class="detail-value"><span class="status-badge status-${
              order.status
            }">${getStatusText(order.status)}</span></div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Клієнт</div>
            <div class="detail-value">${clientName}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Телефон</div>
            <div class="detail-value">${order.phone}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Майстер</div>
            <div class="detail-value">${masterName}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Дата створення</div>
            <div class="detail-value">${createdDate}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Дата оновлення</div>
            <div class="detail-value">${updatedDate}</div>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Опис</label>
          <div class="detail-value">${order.description || "Немає опису"}</div>
        </div>
      `;

      // Populate action buttons
      const orderDetailsFooter = document.getElementById("orderDetailsFooter");
      const currentUserId = localStorage.getItem("userId");

      let actionButtons = `
        <button class="btn btn-primary" id="closeOrderModalBtn">Закрити</button>
      `;

      if (order.status === "pending") {
        actionButtons = `
          <button class="btn btn-success" onclick="updateOrderStatus(${order.id}, 'approved', ${currentUserId}); closeOrderDetailsModal();">
            <i class="fas fa-check"></i> Прийняти
          </button>
          <button class="btn btn-danger" onclick="updateOrderStatus(${order.id}, 'rejected', ${currentUserId}); closeOrderDetailsModal();">
            <i class="fas fa-times"></i> Відхилити
          </button>
          ${actionButtons}
        `;
      } else if (
        order.status === "approved" &&
        order.master_id == currentUserId
      ) {
        actionButtons = `
          <button class="btn btn-info" onclick="updateOrderStatus(${order.id}, 'completed', ${currentUserId}); closeOrderDetailsModal();">
            <i class="fas fa-check-double"></i> Завершити
          </button>
          ${actionButtons}
        `;
      }

      // Додаємо кнопку для дзвінка
      if (order.phone) {
        actionButtons = `
          <button class="btn btn-purple" onclick="callClient('${order.phone}')">
            <i class="fas fa-phone"></i> Зателефонувати
          </button>
          ${actionButtons}
        `;
      }

      orderDetailsFooter.innerHTML = actionButtons;

      // Set up close button
      document.getElementById("closeOrderModalBtn").onclick =
        closeOrderDetailsModal;

      // Show modal
      document.getElementById("orderDetailsModal").classList.add("show");
    })
    .catch((error) => {
      console.error("Помилка при завантаженні деталей замовлення:", error);
      showNotification("Помилка при завантаженні деталей замовлення", "error");
    });
}

// Close Order Details Modal
function closeOrderDetailsModal() {
  document.getElementById("orderDetailsModal").classList.remove("show");
}

// Delete User
function deleteUser(userId) {
  if (confirm(`Ви впевнені, що хочете видалити користувача з ID ${userId}?`)) {
    fetch(`/admin/users/${userId}`, { method: "DELETE" })
      .then((response) => response.json())
      .then((data) => {
        showNotification(data.message, "success");
        loadUsers();
        loadMasters();
        loadDashboardData();
      })
      .catch((error) => {
        console.error("Помилка при видаленні користувача:", error);
        showNotification("Помилка при видаленні користувача", "error");
      });
  }
}

// Update Request Status
function updateRequestStatus(requestId, status) {
  const statusText = status === "approved" ? "затвердити" : "відхилити";
  if (confirm(`Ви впевнені, що хочете ${statusText} цей запит?`)) {
    fetch(`/master-requests/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
      .then((response) => response.json())
      .then((data) => {
        showNotification(data.message, "success");
        loadMasterRequests();
        loadMasters();
        loadDashboardData();
      })
      .catch((error) => {
        console.error(
          `Помилка при ${
            statusText === "затвердити" ? "затвердженні" : "відхиленні"
          } запиту:`,
          error
        );
        showNotification(
          `Помилка при ${
            statusText === "затвердити" ? "затвердженні" : "відхиленні"
          } запиту`,
          "error"
        );
      });
  }
}

// Update Order Status
function updateOrderStatus(orderId, status, masterId) {
  const statusTexts = {
    approved: "прийняти",
    rejected: "відхилити",
    completed: "завершити",
  };

  const statusText = statusTexts[status] || status;

  if (confirm(`Ви впевнені, що хочете ${statusText} цю заявку?`)) {
    fetch(`/orders/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`, // Додаємо токен для авторизації
      },
      body: JSON.stringify({
        status: status,
        master_id: status === "rejected" ? null : masterId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification(data.message, "success");
          loadOrders();
          loadDashboardData();
        } else {
          showNotification(
            data.message || "Помилка при оновленні статусу заявки",
            "error"
          );
        }
      })
      .catch((error) => {
        console.error(`Помилка при оновленні статусу заявки:`, error);
        showNotification("Помилка при оновленні статусу заявки", "error");
      });
  }
}

// Call Client
function callClient(phoneNumber) {
  // Видаляємо всі нецифрові символи з номера телефону
  const cleanPhoneNumber = phoneNumber.replace(/\D/g, "");

  // Створюємо посилання для дзвінка
  window.location.href = `tel:${cleanPhoneNumber}`;
}

// Get Status Text
function getStatusText(status) {
  switch (status) {
    case "pending":
      return "На розгляді";
    case "approved":
      return "Затверджено";
    case "rejected":
      return "Відхилено";
    case "completed":
      return "Завершено";
    default:
      return "";
  }
}

// Export Orders to CSV
document
  .getElementById("exportOrdersBtn")
  .addEventListener("click", function () {
    fetch("/orders")
      .then((response) => response.json())
      .then((data) => {
        // Prepare CSV content
        let csvContent = "data:text/csv;charset=utf-8,";

        // Add headers
        csvContent +=
          "ID,Тема,Опис,Клієнт,Телефон,Статус,Майстер,Дата створення\n";

        // Add rows
        data.orders.forEach((order) => {
          const clientName = `${order.user_first_name || ""} ${
            order.user_last_name || ""
          } (${order.user_username})`;
          const masterName = order.master_id
            ? `${order.master_first_name || ""} ${
                order.master_last_name || ""
              } (${order.master_username})`
            : "Не призначено";
          const createdDate = new Date(order.created_at).toLocaleString(
            "uk-UA"
          );
          const status = getStatusText(order.status);

          // Create CSV row
          const row = [
            order.id,
            `"${order.title.replace(/"/g, '""')}"`,
            `"${(order.description || "Немає опису").replace(/"/g, '""')}"`,
            `"${clientName.replace(/"/g, '""')}"`,
            order.phone,
            status,
            `"${masterName.replace(/"/g, '""')}"`,
            createdDate,
          ].join(",");

          csvContent += row + "\n";
        });

        // Create download link
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
          "download",
          `orders_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);

        // Trigger download
        link.click();
        document.body.removeChild(link);
      })
      .catch((error) => {
        console.error("Помилка при експорті замовлень:", error);
        showNotification("Помилка при експорті замовлень", "error");
      });
  });

// Settings Form Submit
document
  .getElementById("settingsForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form values
    const siteName = document.getElementById("siteName").value;
    const adminEmail = document.getElementById("adminEmail").value;
    const autoApprove = document.getElementById("autoApprove").value;
    const maxServices = document.getElementById("maxServices").value;
    const reviewModeration = document.getElementById("reviewModeration").value;

    // Save settings (mock implementation)
    localStorage.setItem("siteName", siteName);
    localStorage.setItem("adminEmail", adminEmail);
    localStorage.setItem("autoApprove", autoApprove);
    localStorage.setItem("maxServices", maxServices);
    localStorage.setItem("reviewModeration", reviewModeration);

    showNotification("Налаштування успішно збережено", "success");
  });

// Search functionality
document
  .getElementById("userSearchInput")
  .addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll("#usersTable tbody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  });

document
  .getElementById("masterSearchInput")
  .addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll("#mastersTable tbody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  });

document
  .getElementById("requestSearchInput")
  .addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll("#masterRequestsTable tbody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  });

document
  .getElementById("ordersSearchInput")
  .addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll("#ordersTable tbody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  });

document
  .getElementById("orderSearchInput")
  .addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll("#recentOrdersTable tbody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  });

document
  .getElementById("reviewsSearchInput")
  .addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll("#reviewsTable tbody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  });

// Modal close buttons
document
  .getElementById("closeUserDetailsModal")
  .addEventListener("click", closeUserDetailsModal);
document
  .getElementById("closeUserModalBtn")
  .addEventListener("click", closeUserDetailsModal);
document
  .getElementById("closeOrderDetailsModal")
  .addEventListener("click", closeOrderDetailsModal);
document
  .getElementById("closeReviewDetailsModal")
  .addEventListener("click", closeReviewDetailsModal);

// Get user data on page load
function getUserData() {
  const token = localStorage.getItem("token");
  if (token) {
    fetch("/user-data", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          localStorage.setItem("userId", data.userId);
          localStorage.setItem("userRole", data.role);

          // Update user avatar with first letter of username
          if (data.username) {
            const firstLetter = data.username.charAt(0).toUpperCase();
            document.querySelector(".user-avatar").textContent = firstLetter;
            document.querySelector(".user-menu-btn span").textContent =
              data.username;
          }
        } else {
          console.error("Помилка отримання даних користувача:", data.message);
        }
      })
      .catch((error) =>
        console.error("Помилка при отриманні даних користувача:", error)
      );
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  getUserData();
  loadDashboardData();
});

// Add CSS for review stars
const reviewStarsStyle = document.createElement("style");
reviewStarsStyle.textContent = `
  .review-stars {
    color: #ffc107;
    font-size: 1.2rem;
  }
  
  .review-text {
    white-space: pre-wrap;
    background: rgba(255, 255, 255, 0.05);
    padding: 15px;
    border-radius: var(--border-radius-md);
    max-height: 200px;
    overflow-y: auto;
  }
  
  .card-icon.reviews {
    background-color: rgba(255, 193, 7, 0.2);
    color: #ffc107;
  }
`;
document.head.appendChild(reviewStarsStyle);

// Update card icon colors in admin.css
const cardIconStyle = document.createElement("style");
cardIconStyle.textContent = `
  .card-icon.reviews {
    background-color: rgba(255, 193, 7, 0.2);
    color: #ffc107;
  }
`;
document.head.appendChild(cardIconStyle);

console.log("✅ Admin panel review functionality has been added successfully!");

// News Management Functions

// Load News
function loadNews() {
  fetch("/api/news")
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.querySelector("#newsTable tbody");
      tableBody.innerHTML = "";

      if (!data.news || data.news.length === 0) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state">
                <i class="fas fa-newspaper"></i>
                <div class="empty-state-text">Немає новин для відображення</div>
              </div>
            </td>
          </tr>
        `;
        return;
      }

      data.news.forEach((news) => {
        const createdDate = new Date(news.created_at).toLocaleString("uk-UA");

        const row = `
          <tr>
            <td>${news.id}</td>
            <td>${news.title}</td>
            <td>${
              news.short_description.length > 50
                ? news.short_description.substring(0, 50) + "..."
                : news.short_description
            }</td>
            <td>${getCategoryText(news.category)}</td>
            <td><span class="status-badge status-${
              news.status === "published" ? "approved" : "pending"
            }">${
          news.status === "published" ? "Опубліковано" : "Чернетка"
        }</span></td>
            <td>${news.views || 0}</td>
            <td>${createdDate}</td>
            <td class="action-buttons">
              <button class="btn btn-info" onclick="showNewsDetails(${
                news.id
              })">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-primary" onclick="editNews(${news.id})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-danger" onclick="deleteNews(${news.id})">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
        tableBody.innerHTML += row;
      });

      // Create pagination
      createPagination(data.news.length, 10, "newsPagination");

      // Load news charts
      loadNewsViewsChart(data.news);
      loadNewsCategoriesChart(data.news);
    })
    .catch((error) => {
      console.error("Помилка при завантаженні новин:", error);
      showNotification("Помилка при завантаженні новин", "error");
    });
}

// Load News Views Chart
function loadNewsViewsChart(newsData) {
  // Sort news by views (descending) and take top 5
  const topNews = [...newsData]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  const ctx = document.getElementById("newsViewsChart").getContext("2d");

  // Format data
  const labels = topNews.map((news) =>
    news.title.length > 20 ? news.title.substring(0, 20) + "..." : news.title
  );
  const views = topNews.map((news) => news.views || 0);
  const likes = topNews.map((news) => news.likes || 0);

  // Create chart
  const newsViewsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Перегляди",
          data: views,
          backgroundColor: "rgba(52, 152, 219, 0.7)",
          borderColor: "rgba(52, 152, 219, 1)",
          borderWidth: 1,
        },
        {
          label: "Вподобання",
          data: likes,
          backgroundColor: "rgba(231, 76, 60, 0.7)",
          borderColor: "rgba(231, 76, 60, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: htmlElement.classList.contains("light") ? "#333" : "#fff",
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          grid: {
            color: htmlElement.classList.contains("light")
              ? "rgba(0,0,0,0.1)"
              : "rgba(255,255,255,0.1)",
          },
          ticks: {
            color: htmlElement.classList.contains("light") ? "#333" : "#fff",
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: htmlElement.classList.contains("light")
              ? "rgba(0,0,0,0.1)"
              : "rgba(255,255,255,0.1)",
          },
          ticks: {
            color: htmlElement.classList.contains("light") ? "#333" : "#fff",
          },
        },
      },
    },
  });

  // Store chart reference for theme updates
  window.newsViewsChart = newsViewsChart;
}

// Load News Categories Chart
function loadNewsCategoriesChart(newsData) {
  // Count news by category
  const categoryCounts = {};

  newsData.forEach((news) => {
    const category = news.category || "uncategorized";
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const ctx = document.getElementById("newsCategoriesChart").getContext("2d");

  // Format data
  const categories = Object.keys(categoryCounts);
  const counts = Object.values(categoryCounts);
  const categoryLabels = categories.map((category) =>
    getCategoryText(category)
  );

  // Create chart
  const newsCategoriesChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: categoryLabels,
      datasets: [
        {
          data: counts,
          backgroundColor: [
            "rgba(52, 152, 219, 0.7)",
            "rgba(155, 89, 182, 0.7)",
            "rgba(46, 204, 113, 0.7)",
            "rgba(241, 196, 15, 0.7)",
            "rgba(231, 76, 60, 0.7)",
          ],
          borderColor: [
            "rgba(52, 152, 219, 1)",
            "rgba(155, 89, 182, 1)",
            "rgba(46, 204, 113, 1)",
            "rgba(241, 196, 15, 1)",
            "rgba(231, 76, 60, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "right",
          labels: {
            color: htmlElement.classList.contains("light") ? "#333" : "#fff",
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const value = context.raw;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${value} новин (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  // Store chart reference for theme updates
  window.newsCategoriesChart = newsCategoriesChart;
}

// Show News Details
function showNewsDetails(newsId) {
  fetch(`/api/news/${newsId}`)
    .then((response) => response.json())
    .then((data) => {
      const news = data.news;
      if (!news) {
        showNotification("Новину не знайдено", "error");
        return;
      }

      const createdDate = new Date(news.created_at).toLocaleString("uk-UA");
      const updatedDate = new Date(news.updated_at).toLocaleString("uk-UA");

      // Prepare images HTML
      let mainImageHtml = "";
      if (news.main_image) {
        mainImageHtml = `
          <div class="news-main-image">
            <img src="${news.main_image}" alt="${news.title}">
          </div>
        `;
      }

      let additionalImagesHtml = "";
      if (news.additional_images && news.additional_images.length > 0) {
        additionalImagesHtml = `
          <div class="news-additional-images">
            <h4>Додаткові зображення:</h4>
            <div class="news-image-gallery">
              ${news.additional_images
                .map(
                  (img) => `
                <div class="news-image-item">
                  <img src="${img}" alt="Додаткове зображення">
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        `;
      }

      let externalLinksHtml = "";
      if (news.external_links && news.external_links.length > 0) {
        externalLinksHtml = `
          <div class="news-external-links">
            <h4>Зовнішні посилання:</h4>
            <ul>
              ${news.external_links
                .map(
                  (link) => `
                <li><a href="${link}" target="_blank">${link}</a></li>
              `
                )
                .join("")}
            </ul>
          </div>
        `;
      }

      const newsDetailsBody = document.getElementById("newsDetailsBody");
      newsDetailsBody.innerHTML = `
        <div class="user-profile-details">
          <div class="detail-item">
            <div class="detail-label">ID</div>
            <div class="detail-value">${news.id}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Заголовок</div>
            <div class="detail-value">${news.title}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Категорія</div>
            <div class="detail-value">${getCategoryText(news.category)}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Статус</div>
            <div class="detail-value"><span class="status-badge status-${
              news.status === "published" ? "approved" : "pending"
            }">${
        news.status === "published" ? "Опубліковано" : "Чернетка"
      }</span></div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Перегляди</div>
            <div class="detail-value">${news.views || 0}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Вподобання</div>
            <div class="detail-value">${news.likes || 0}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Дата створення</div>
            <div class="detail-value">${createdDate}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Дата оновлення</div>
            <div class="detail-value">${updatedDate}</div>
          </div>
        </div>
        
        ${mainImageHtml}
        
        <div class="form-group">
          <label class="form-label">Короткий опис</label>
          <div class="detail-value">${news.short_description}</div>
        </div>
        
        <div class="form-group">
          <label class="form-label">Повний текст</label>
          <div class="detail-value news-content">${news.content}</div>
        </div>
        
        ${additionalImagesHtml}
        ${externalLinksHtml}
      `;

      const newsDetailsFooter = document.getElementById("newsDetailsFooter");
      newsDetailsFooter.innerHTML = `
        <button class="btn btn-primary" onclick="editNews(${news.id}); closeNewsDetailsModal();">
          <i class="fas fa-edit"></i> Редагувати
        </button>
        <button class="btn btn-danger" onclick="deleteNews(${news.id}); closeNewsDetailsModal();">
          <i class="fas fa-trash"></i> Видалити
        </button>
        <button class="btn btn-secondary" id="closeNewsModalBtn">Закрити</button>
      `;

      // Set up close button
      document.getElementById("closeNewsModalBtn").onclick =
        closeNewsDetailsModal;

      // Show modal
      document.getElementById("newsDetailsModal").classList.add("show");
    })
    .catch((error) => {
      console.error("Помилка при завантаженні деталей новини:", error);
      showNotification("Помилка при завантаженні деталей новини", "error");
    });
}

// Close News Details Modal
function closeNewsDetailsModal() {
  document.getElementById("newsDetailsModal").classList.remove("show");
}

// Add/Edit News
function editNews(newsId = null) {
  const isEdit = newsId !== null;
  const newsEditorTitle = document.getElementById("newsEditorTitle");
  const newsForm = document.getElementById("newsForm");

  // Reset form
  newsForm.reset();
  document.getElementById("newsId").value = "";
  document.getElementById("mainImagePreview").innerHTML = "";
  document.getElementById("additionalImagesPreview").innerHTML = "";

  // Set title based on mode
  newsEditorTitle.textContent = isEdit ? "Редагувати новину" : "Додати новину";

  if (isEdit) {
    // Fetch news data
    fetch(`/api/news/${newsId}`)
      .then((response) => response.json())
      .then((data) => {
        const news = data.news;
        if (!news) {
          showNotification("Новину не знайдено", "error");
          return;
        }

        // Fill form with news data
        document.getElementById("newsId").value = news.id;
        document.getElementById("newsTitle").value = news.title;
        document.getElementById("newsShortDescription").value =
          news.short_description;
        document.getElementById("newsContent").value = news.content;
        document.getElementById("newsCategory").value =
          news.category || "updates";
        document.getElementById("newsStatus").value =
          news.status || "published";

        // Show main image preview if exists
        if (news.main_image) {
          const mainImagePreview = document.getElementById("mainImagePreview");
          mainImagePreview.innerHTML = `<img src="${news.main_image}" alt="Головне зображення">`;
        }

        // Show additional images preview if exists
        if (news.additional_images && news.additional_images.length > 0) {
          const additionalImagesPreview = document.getElementById(
            "additionalImagesPreview"
          );
          additionalImagesPreview.innerHTML = news.additional_images
            .map(
              (img, index) => `
            <div class="image-preview-item" data-path="${img}">
              <img src="${img}" alt="Додаткове зображення ${index + 1}">
              <div class="image-preview-remove" onclick="removeAdditionalImage(this)">
                <i class="fas fa-times"></i>
              </div>
            </div>
          `
            )
            .join("");
        }

        // Fill external links
        if (news.external_links && news.external_links.length > 0) {
          document.getElementById("newsExternalLinks").value =
            news.external_links.join("\n");
        }

        // Show modal
        document.getElementById("newsEditorModal").classList.add("show");
      })
      .catch((error) => {
        console.error("Помилка при завантаженні даних новини:", error);
        showNotification("Помилка при завантаженні даних новини", "error");
      });
  } else {
    // Show empty form for new news
    document.getElementById("newsEditorModal").classList.add("show");
  }
}

// Remove Additional Image
function removeAdditionalImage(element) {
  const imageItem = element.parentElement;
  imageItem.remove();
}

// Close News Editor Modal
function closeNewsEditorModal() {
  document.getElementById("newsEditorModal").classList.remove("show");
}

// Save News
function saveNews() {
  const newsId = document.getElementById("newsId").value;
  const isEdit = newsId !== "";

  // Get form data
  const title = document.getElementById("newsTitle").value;
  const shortDescription = document.getElementById(
    "newsShortDescription"
  ).value;
  const content = document.getElementById("newsContent").value;
  const category = document.getElementById("newsCategory").value;
  const status = document.getElementById("newsStatus").value;

  // Validate required fields
  if (!title || !shortDescription || !content) {
    showNotification("Заповніть всі обов'язкові поля", "error");
    return;
  }

  // Create FormData object
  const formData = new FormData();
  formData.append("title", title);
  formData.append("short_description", shortDescription);
  formData.append("content", content);
  formData.append("category", category);
  formData.append("status", status);

  // Add main image if selected
  const mainImageInput = document.getElementById("newsMainImage");
  if (mainImageInput.files.length > 0) {
    formData.append("main_image", mainImageInput.files[0]);
  }

  // Add additional images if selected
  const additionalImagesInput = document.getElementById("newsAdditionalImages");
  if (additionalImagesInput.files.length > 0) {
    for (let i = 0; i < additionalImagesInput.files.length; i++) {
      formData.append("additional_images", additionalImagesInput.files[i]);
    }
  }

  // Add existing additional images paths
  const existingImages = document.querySelectorAll(
    "#additionalImagesPreview .image-preview-item"
  );
  existingImages.forEach((item) => {
    const imagePath = item.getAttribute("data-path");
    if (imagePath) {
      formData.append("existing_additional_images", imagePath);
    }
  });

  // Add external links
  const externalLinksText = document.getElementById("newsExternalLinks").value;
  if (externalLinksText.trim()) {
    const links = externalLinksText
      .split("\n")
      .filter((link) => link.trim() !== "");
    links.forEach((link) => {
      formData.append("external_links", link.trim());
    });
  }

  // Send request
  const url = isEdit ? `/api/news/${newsId}` : "/api/news";
  const method = isEdit ? "PUT" : "POST";

  fetch(url, {
    method: method,
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification(
          isEdit ? "Новину успішно оновлено" : "Новину успішно створено",
          "success"
        );
        closeNewsEditorModal();
        loadNews();
      } else {
        showNotification(
          data.message || "Помилка при збереженні новини",
          "error"
        );
      }
    })
    .catch((error) => {
      console.error("Помилка при збереженні новини:", error);
      showNotification("Помилка при збереженні новини", "error");
    });
}

// Delete News
function deleteNews(newsId) {
  if (confirm(`Ви впевнені, що хочете видалити новину з ID ${newsId}?`)) {
    fetch(`/api/news/${newsId}`, { method: "DELETE" })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          showNotification("Новину успішно видалено", "success");
          loadNews();
        } else {
          showNotification(
            data.message || "Помилка при видаленні новини",
            "error"
          );
        }
      })
      .catch((error) => {
        console.error("Помилка при видаленні новини:", error);
        showNotification("Помилка при видаленні новини", "error");
      });
  }
}

// Get Category Text
function getCategoryText(category) {
  switch (category) {
    case "updates":
      return "Оновлення";
    case "events":
      return "Події";
    case "tips":
      return "Поради";
    case "announcements":
      return "Оголошення";
    default:
      return category || "Загальне";
  }
}

// Export News to CSV
function exportNewsToCSV() {
  fetch("/api/news")
    .then((response) => response.json())
    .then((data) => {
      // Prepare CSV content
      let csvContent = "data:text/csv;charset=utf-8,";

      // Add headers
      csvContent +=
        "ID,Заголовок,Короткий опис,Категорія,Статус,Перегляди,Вподобання,Дата створення\n";

      // Add rows
      data.news.forEach((news) => {
        const createdDate = new Date(news.created_at).toLocaleString("uk-UA");
        const status =
          news.status === "published" ? "Опубліковано" : "Чернетка";

        // Create CSV row
        const row = [
          news.id,
          `"${news.title.replace(/"/g, '""')}"`,
          `"${news.short_description.replace(/"/g, '""')}"`,
          `"${getCategoryText(news.category)}"`,
          status,
          news.views || 0,
          news.likes || 0,
          createdDate,
        ].join(",");

        csvContent += row + "\n";
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `news_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);

      // Trigger download
      link.click();
      document.body.removeChild(link);
    })
    .catch((error) => {
      console.error("Помилка при експорті новин:", error);
      showNotification("Помилка при експорті новин", "error");
    });
}

// Update charts theme for news charts
function updateNewsChartsTheme() {
  const textColor = htmlElement.classList.contains("light") ? "#333" : "#fff";
  const gridColor = htmlElement.classList.contains("light")
    ? "rgba(0,0,0,0.1)"
    : "rgba(255,255,255,0.1)";

  // Update news views chart
  if (window.newsViewsChart) {
    window.newsViewsChart.options.plugins.legend.labels.color = textColor;
    window.newsViewsChart.options.scales.x.grid.color = gridColor;
    window.newsViewsChart.options.scales.y.grid.color = gridColor;
    window.newsViewsChart.options.scales.x.ticks.color = textColor;
    window.newsViewsChart.options.scales.y.ticks.color = textColor;
    window.newsViewsChart.update();
  }

  // Update news categories chart
  if (window.newsCategoriesChart) {
    window.newsCategoriesChart.options.plugins.legend.labels.color = textColor;
    window.newsCategoriesChart.update();
  }
}

// Add news tab event listener
document
  .querySelector('[data-tab="news"]')
  .addEventListener("click", function (e) {
    if (this.getAttribute("href").startsWith("#")) {
      e.preventDefault();
      const tabId = this.getAttribute("data-tab");

      // Remove active class from all links and contents
      tabLinks.forEach((link) => link.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Add active class to current link and content
      this.classList.add("active");
      document.getElementById(`${tabId}-tab`).classList.add("active");

      // Load news data
      loadNews();
    }
  });

// Add news search functionality
document
  .getElementById("newsSearchInput")
  .addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll("#newsTable tbody tr");

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? "" : "none";
    });
  });

// Add event listeners for news modals
document
  .getElementById("closeNewsDetailsModal")
  .addEventListener("click", closeNewsDetailsModal);
document
  .getElementById("closeNewsEditorModal")
  .addEventListener("click", closeNewsEditorModal);
document
  .getElementById("addNewsBtn")
  .addEventListener("click", () => editNews());
document.getElementById("saveNewsBtn").addEventListener("click", saveNews);
document
  .getElementById("cancelNewsBtn")
  .addEventListener("click", closeNewsEditorModal);
document
  .getElementById("exportNewsBtn")
  .addEventListener("click", exportNewsToCSV);

// Add event listener for main image preview
document
  .getElementById("newsMainImage")
  .addEventListener("change", function () {
    const preview = document.getElementById("mainImagePreview");
    preview.innerHTML = "";

    if (this.files && this.files[0]) {
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.innerHTML = `<img src="${e.target.result}" alt="Головне зображення">`;
      };
      reader.readAsDataURL(this.files[0]);
    }
  });

// Add event listener for additional images preview
document
  .getElementById("newsAdditionalImages")
  .addEventListener("change", function () {
    const preview = document.getElementById("additionalImagesPreview");

    if (this.files && this.files.length > 0) {
      for (let i = 0; i < this.files.length; i++) {
        const reader = new FileReader();
        const file = this.files[i];

        reader.onload = function (e) {
          const imageItem = document.createElement("div");
          imageItem.className = "image-preview-item";
          imageItem.innerHTML = `
          <img src="${e.target.result}" alt="Додаткове зображення">
          <div class="image-preview-remove" onclick="removeAdditionalImage(this)">
            <i class="fas fa-times"></i>
          </div>
        `;
          preview.appendChild(imageItem);
        };

        reader.readAsDataURL(file);
      }
    }
  });

// Update the updateChartsTheme function to include news charts
const originalUpdateChartsTheme = updateChartsTheme;
updateChartsTheme = function () {
  originalUpdateChartsTheme();
  updateNewsChartsTheme();
};

console.log("✅ News management functionality has been added successfully!");
