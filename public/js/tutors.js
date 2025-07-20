// Tutors page functionality
class TutorsPage {
  constructor() {
    this.tutors = [];
    this.filteredTutors = [];
    this.currentPage = 1;
    this.tutorsPerPage = 12;
    this.currentFilters = {
      search: "",
      subject: "",
      sortBy: "name",
    };

    this.init();
  }

  init() {
    this.bindEvents();
    this.loadTutors();
    this.loadSubjects();
  }

  bindEvents() {
    // Search functionality
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");

    searchInput?.addEventListener(
      "input",
      this.debounce(() => {
        this.currentFilters.search = searchInput.value;
        this.applyFilters();
      }, 300)
    );

    searchBtn?.addEventListener("click", () => {
      this.currentFilters.search = searchInput.value;
      this.applyFilters();
    });

    // Filter controls
    const subjectFilter = document.getElementById("subjectFilter");
    const sortBy = document.getElementById("sortBy");
    const clearFilters = document.getElementById("clearFilters");

    subjectFilter?.addEventListener("change", () => {
      this.currentFilters.subject = subjectFilter.value;
      this.applyFilters();
    });

    sortBy?.addEventListener("change", () => {
      this.currentFilters.sortBy = sortBy.value;
      this.applyFilters();
    });

    clearFilters?.addEventListener("click", () => {
      this.clearAllFilters();
    });

    // Load more button
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    loadMoreBtn?.addEventListener("click", () => {
      this.loadMoreTutors();
    });

    // Modal events
    const tutorModal = document.getElementById("tutorModal");
    const tutorModalClose = document.getElementById("tutorModalClose");

    tutorModalClose?.addEventListener("click", () => {
      this.closeModal();
    });

    tutorModal?.addEventListener("click", (e) => {
      if (e.target === tutorModal) {
        this.closeModal();
      }
    });

    // Communication panel
    this.bindCommunicationEvents();
  }

  async loadTutors() {
    try {
      this.showLoading(true);

      const response = await fetch("/api/tutors");
      const data = await response.json();

      if (data.success) {
        this.tutors = data.tutors;
        this.filteredTutors = [...this.tutors];
        this.updateStats();
        this.renderTutors();
      } else {
        this.showError("Помилка завантаження репетиторів");
      }
    } catch (error) {
      console.error("Error loading tutors:", error);
      this.showError("Помилка з'єднання з сервером");
    } finally {
      this.showLoading(false);
    }
  }

  async loadSubjects() {
    try {
      const response = await fetch("/api/industries");
      const data = await response.json();

      const subjectFilter = document.getElementById("subjectFilter");
      if (subjectFilter && data) {
        // Clear existing options except the first one
        subjectFilter.innerHTML = '<option value="">Всі предмети</option>';

        data.forEach((subject) => {
          const option = document.createElement("option");
          option.value = subject.name;
          option.textContent = subject.name;
          subjectFilter.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Error loading subjects:", error);
    }
  }

  applyFilters() {
    let filtered = [...this.tutors];

    // Apply search filter
    if (this.currentFilters.search) {
      const searchTerm = this.currentFilters.search.toLowerCase();
      filtered = filtered.filter(
        (tutor) =>
          tutor.full_name.toLowerCase().includes(searchTerm) ||
          tutor.username.toLowerCase().includes(searchTerm) ||
          tutor.subjects.some((subject) =>
            subject.toLowerCase().includes(searchTerm)
          ) ||
          (tutor.email && tutor.email.toLowerCase().includes(searchTerm))
      );
    }

    // Apply subject filter
    if (this.currentFilters.subject) {
      filtered = filtered.filter((tutor) =>
        tutor.subjects.includes(this.currentFilters.subject)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.currentFilters.sortBy) {
        case "name":
          return a.full_name.localeCompare(b.full_name);
        case "subject":
          return a.subjects[0]?.localeCompare(b.subjects[0]) || 0;
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "experience":
          return (b.experience || 0) - (a.experience || 0);
        default:
          return 0;
      }
    });

    this.filteredTutors = filtered;
    this.currentPage = 1;
    this.updateStats();
    this.renderTutors();
  }

  clearAllFilters() {
    this.currentFilters = {
      search: "",
      subject: "",
      sortBy: "name",
    };

    // Reset form elements
    const searchInput = document.getElementById("searchInput");
    const subjectFilter = document.getElementById("subjectFilter");
    const sortBy = document.getElementById("sortBy");

    if (searchInput) searchInput.value = "";
    if (subjectFilter) subjectFilter.value = "";
    if (sortBy) sortBy.value = "name";

    this.applyFilters();
  }

  renderTutors() {
    const tutorsGrid = document.getElementById("tutorsGrid");
    const noResults = document.getElementById("noResults");
    const loadMoreBtn = document.getElementById("loadMoreBtn");

    if (!tutorsGrid) return;

    if (this.filteredTutors.length === 0) {
      tutorsGrid.innerHTML = "";
      noResults.style.display = "block";
      loadMoreBtn.style.display = "none";
      return;
    }

    noResults.style.display = "none";

    const startIndex = 0;
    const endIndex = this.currentPage * this.tutorsPerPage;
    const tutorsToShow = this.filteredTutors.slice(startIndex, endIndex);

    tutorsGrid.innerHTML = tutorsToShow
      .map((tutor) => this.createTutorCard(tutor))
      .join("");

    // Show/hide load more button
    if (endIndex < this.filteredTutors.length) {
      loadMoreBtn.style.display = "block";
    } else {
      loadMoreBtn.style.display = "none";
    }

    // Bind card events
    this.bindCardEvents();
  }

  loadMoreTutors() {
    this.currentPage++;
    this.renderTutors();
  }

  createTutorCard(tutor) {
    const isOnline = tutor.online || false;
    const statusClass = isOnline ? "online" : "offline";
    const statusText = isOnline ? "Онлайн" : "Офлайн";

    const avatar =
      tutor.profile_image_url || "/placeholder.svg?height=80&width=80";

    return `
      <div class="tutor-card" data-tutor-id="${tutor.id}">
        <div class="tutor-header">
          <img src="${avatar}" alt="${tutor.full_name}" class="tutor-avatar" />
          <div class="tutor-info">
            <h3>${tutor.full_name}</h3>
            <div class="tutor-username">@${tutor.username}</div>
            <div class="tutor-status">
              <span class="status-indicator ${statusClass}"></span>
              <span>${statusText}</span>
            </div>
          </div>
        </div>

        <div class="tutor-subjects">
          <h4>Предмети:</h4>
          <div class="subjects-list">
            ${tutor.subjects
              .slice(0, 3)
              .map((subject) => `<span class="subject-tag">${subject}</span>`)
              .join("")}
            ${
              tutor.subjects.length > 3
                ? `<span class="subject-tag">+${
                    tutor.subjects.length - 3
                  }</span>`
                : ""
            }
          </div>
        </div>

        <div class="tutor-contact">
          ${
            tutor.email
              ? `
            <div class="contact-item">
              <i class="fas fa-envelope"></i>
              <span>${tutor.email}</span>
            </div>
          `
              : ""
          }
          ${
            tutor.phone
              ? `
            <div class="contact-item">
              <i class="fas fa-phone"></i>
              <span>${tutor.phone}</span>
            </div>
          `
              : ""
          }
          ${
            tutor.address
              ? `
            <div class="contact-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>${tutor.address}</span>
            </div>
          `
              : ""
          }
        </div>

        <div class="tutor-actions">
          <button class="action-btn primary" onclick="tutorsPage.viewTutorDetails(${
            tutor.id
          })">
            <i class="fas fa-eye"></i>
            Детальніше
          </button>
          <button class="action-btn secondary" onclick="tutorsPage.contactTutor(${
            tutor.id
          })">
            <i class="fas fa-envelope"></i>
            Написати
          </button>
          ${
            isOnline
              ? `
            <button class="action-btn success" onclick="tutorsPage.startChat(${tutor.id})">
              <i class="fas fa-comments"></i>
              Чат
            </button>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  bindCardEvents() {
    const tutorCards = document.querySelectorAll(".tutor-card");
    tutorCards.forEach((card) => {
      card.addEventListener("click", (e) => {
        // Don't trigger if clicking on action buttons
        if (e.target.closest(".action-btn")) return;

        const tutorId = card.dataset.tutorId;
        this.viewTutorDetails(Number.parseInt(tutorId));
      });
    });
  }

  async viewTutorDetails(tutorId) {
    try {
      const tutor = this.tutors.find((t) => t.id === tutorId);
      if (!tutor) return;

      const modalContent = document.getElementById("tutorModalContent");
      if (!modalContent) return;

      const avatar =
        tutor.profile_image_url || "/placeholder.svg?height=120&width=120";
      const isOnline = tutor.online || false;
      const statusClass = isOnline ? "online" : "offline";
      const statusText = isOnline ? "Онлайн" : "Офлайн";

      modalContent.innerHTML = `
        <div class="tutor-modal-header">
          <img src="${avatar}" alt="${tutor.full_name}" class="modal-avatar" />
          <div class="modal-tutor-info">
            <h2>${tutor.full_name}</h2>
            <div class="modal-username">@${tutor.username}</div>
            <div class="modal-status">
              <span class="status-indicator ${statusClass}"></span>
              <span>${statusText}</span>
            </div>
          </div>
        </div>

        <div class="modal-section">
          <h3><i class="fas fa-book"></i> Предмети викладання</h3>
          <div class="modal-subjects-grid">
            ${tutor.subjects
              .map(
                (subject) => `<div class="modal-subject-item">${subject}</div>`
              )
              .join("")}
          </div>
        </div>

        <div class="modal-section">
          <h3><i class="fas fa-address-book"></i> Контактна інформація</h3>
          <div class="modal-contact-grid">
            ${
              tutor.email
                ? `
              <div class="modal-contact-item">
                <div class="modal-contact-icon">
                  <i class="fas fa-envelope"></i>
                </div>
                <div class="modal-contact-info">
                  <div class="modal-contact-label">Email</div>
                  <div class="modal-contact-value">${tutor.email}</div>
                </div>
              </div>
            `
                : ""
            }
            ${
              tutor.phone
                ? `
              <div class="modal-contact-item">
                <div class="modal-contact-icon">
                  <i class="fas fa-phone"></i>
                </div>
                <div class="modal-contact-info">
                  <div class="modal-contact-label">Телефон</div>
                  <div class="modal-contact-value">${tutor.phone}</div>
                </div>
              </div>
            `
                : ""
            }
            ${
              tutor.address
                ? `
              <div class="modal-contact-item">
                <div class="modal-contact-icon">
                  <i class="fas fa-map-marker-alt"></i>
                </div>
                <div class="modal-contact-info">
                  <div class="modal-contact-label">Адреса</div>
                  <div class="modal-contact-value">${tutor.address}</div>
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>

        <div class="modal-actions">
          <button class="modal-action-btn primary" onclick="tutorsPage.contactTutor(${
            tutor.id
          })">
            <i class="fas fa-envelope"></i>
            Написати повідомлення
          </button>
          ${
            isOnline
              ? `
            <button class="modal-action-btn success" onclick="tutorsPage.startChat(${tutor.id})">
              <i class="fas fa-comments"></i>
              Почати чат
            </button>
            <button class="modal-action-btn secondary" onclick="tutorsPage.startVideoCall(${tutor.id})">
              <i class="fas fa-video"></i>
              Відеодзвінок
            </button>
          `
              : ""
          }
        </div>
      `;

      this.showModal();
    } catch (error) {
      console.error("Error viewing tutor details:", error);
      this.showError("Помилка завантаження деталей репетитора");
    }
  }

  contactTutor(tutorId) {
    // Check if user is logged in
    const userId = localStorage.getItem("userId");
    if (!userId) {
      this.showLoginModal();
      return;
    }

    // Redirect to message page with tutor info
    window.location.href = `message.html?tutor=${tutorId}`;
  }

  startChat(tutorId) {
    // Check if user is logged in
    const userId = localStorage.getItem("userId");
    if (!userId) {
      this.showLoginModal();
      return;
    }

    // Redirect to chat page
    window.location.href = `chat.html?master=${tutorId}`;
  }

  startVideoCall(tutorId) {
    // Check if user is logged in
    const userId = localStorage.getItem("userId");
    if (!userId) {
      this.showLoginModal();
      return;
    }

    // Redirect to video call page
    window.location.href = `call.html?master=${tutorId}`;
  }

  updateStats() {
    const totalTutors = document.getElementById("totalTutors");
    const totalSubjects = document.getElementById("totalSubjects");
    const onlineTutors = document.getElementById("onlineTutors");

    if (totalTutors) {
      totalTutors.textContent = this.filteredTutors.length;
    }

    if (totalSubjects) {
      const uniqueSubjects = new Set();
      this.filteredTutors.forEach((tutor) => {
        tutor.subjects.forEach((subject) => uniqueSubjects.add(subject));
      });
      totalSubjects.textContent = uniqueSubjects.size;
    }

    if (onlineTutors) {
      const online = this.filteredTutors.filter((tutor) => tutor.online).length;
      onlineTutors.textContent = online;
    }
  }

  showModal() {
    const modal = document.getElementById("tutorModal");
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  }

  closeModal() {
    const modal = document.getElementById("tutorModal");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  showLoginModal() {
    const loginModal = document.getElementById("loginModal");
    if (loginModal) {
      loginModal.classList.add("active");
    }
  }

  showLoading(show) {
    const loadingSpinner = document.getElementById("loadingSpinner");
    const tutorsGrid = document.getElementById("tutorsGrid");

    if (loadingSpinner) {
      loadingSpinner.style.display = show ? "block" : "none";
    }

    if (tutorsGrid) {
      tutorsGrid.style.display = show ? "none" : "grid";
    }
  }

  showError(message) {
    // You can implement a toast notification system here
    console.error(message);
    alert(message); // Temporary solution
  }

  bindCommunicationEvents() {
    const commToggleBtn = document.getElementById("commToggleBtn");
    const commMenu = document.getElementById("commMenu");

    commToggleBtn?.addEventListener("click", () => {
      commMenu?.classList.toggle("active");
      commToggleBtn?.classList.toggle("active");
    });

    // Communication panel items
    const messageBtn = document.getElementById("messageBtn");
    const chatBtn = document.getElementById("chatBtn");
    const voiceBtn = document.getElementById("voiceBtn");
    const videoBtn = document.getElementById("videoBtn");

    messageBtn?.addEventListener("click", () => {
      window.location.href = "message.html";
    });

    chatBtn?.addEventListener("click", () => {
      window.location.href = "chat.html";
    });

    voiceBtn?.addEventListener("click", () => {
      window.location.href = "call.html";
    });

    videoBtn?.addEventListener("click", () => {
      window.location.href = "call.html";
    });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Initialize the tutors page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.tutorsPage = new TutorsPage();
});

// Back to top functionality
const backToTop = document.getElementById("backToTop");
if (backToTop) {
  window.addEventListener("scroll", () => {
    if (window.pageYOffset > 300) {
      backToTop.classList.add("visible");
    } else {
      backToTop.classList.remove("visible");
    }
  });

  backToTop.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}
