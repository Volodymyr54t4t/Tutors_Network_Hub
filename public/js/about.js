document.addEventListener("DOMContentLoaded", () => {
  // Animate elements when they come into view
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
      ".section-title, .about-content, .mission-content, .feature-card, .tech-card, .team-card, .contact-info, .contact-form-container"
    );

    animatedElements.forEach((element) => {
      element.classList.add("to-animate");
      observer.observe(element);
    });
  }

  setupAnimations();

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Contact form submission
  const contactForm = document.getElementById("contactForm");
  const contactFormMessage = document.getElementById("contactFormMessage");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const submitBtn = document.getElementById("submitContactBtn");
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading"></span> Відправка...';

      const name = document.getElementById("contactName").value;
      const email = document.getElementById("contactEmail").value;
      const subject = document.getElementById("contactSubject").value;
      const message = document.getElementById("contactMessage").value;

      try {
        // Simulate API call with timeout
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Success response
        contactFormMessage.textContent =
          "Повідомлення успішно відправлено! Ми зв'яжемося з вами найближчим часом.";
        contactFormMessage.className = "form-message success";
        contactForm.reset();

        // Success animation
        const formContainer = document.querySelector(".contact-form-container");
        formContainer.style.animation = "pulse 1s";
        formContainer.addEventListener("animationend", () => {
          formContainer.style.animation = "";
        });
      } catch (error) {
        console.error("Помилка:", error);
        contactFormMessage.textContent =
          "Помилка при відправці повідомлення. Спробуйте пізніше.";
        contactFormMessage.className = "form-message error";
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML =
          '<span>Надіслати повідомлення</span><i class="fas fa-paper-plane"></i>';

        // Hide message after 5 seconds with fade out
        setTimeout(() => {
          contactFormMessage.style.animation = "fadeOut 1s forwards";
          contactFormMessage.addEventListener("animationend", () => {
            contactFormMessage.style.display = "none";
            contactFormMessage.style.animation = "";
            setTimeout(() => {
              contactFormMessage.style.display = "block";
              contactFormMessage.textContent = "";
              contactFormMessage.className = "form-message";
            }, 500);
          });
        }, 5000);
      }
    });
  }

  // Add parallax effect to hero section
  window.addEventListener("scroll", () => {
    const scrollPosition = window.scrollY;
    const hero = document.querySelector(".about-hero");
    const heroContent = document.querySelector(".about-hero-content");

    if (hero && heroContent && scrollPosition < 600) {
      hero.style.backgroundPosition = `center ${scrollPosition * 0.4}px`;
      heroContent.style.transform = `translateY(${scrollPosition * 0.2}px)`;
    }
  });

  // Team Member Details Modal
  const teamMemberModal = document.getElementById("teamMemberModal");
  const teamModalClose = document.getElementById("teamModalClose");
  const teamModalContent = document.getElementById("teamModalContent");
  const detailsBtns = document.querySelectorAll(".details-btn");

  // Team member data
  const teamMembersData = {
    shatkivskyi: {
      name: "Шатківський Віталій Миколайович",
      role: "Науковий керівник",
      image: "../images/Шатківський Віталій Миколайович.jpg",
      position: "Вчитель",
      description:
        'Вчитель інформатики в Відокремленому підрозділі "Науковий ліцей" Державного університету "Житомирська політехніка"',
      education: [
        "Освіта вища",
        "Житомирський державний університет імені Івана Франка",
        "Закінчив навчання в аспірантурі Інституту інформаційних технологій та засобів навчання",
      ],
      qualification: [
        "Посада: вчитель інформатики",
        "Кваліфікація: вчитель-методист",
        "Педагогічне звання, почесне звання: заслужений вчитель України",
      ],
      methodology:
        "Використання веб-орієнтованих середовищ навчання програмування",
      credo: "Діти здатні на більше ніж вони думають",
      career: [
        "Житомирська ЗОШ №30, вчитель інформатики з 2003 р. по 2022 р.",
        'Житомирський міський центр науково-технічної творчості учнівської молоді, керівник гуртка "Програмування та дизайн" з 2008 р. і по теперішній час',
        'Державний університет "Житомирська політехніка", старший викладач кафедри інженерії програмного забезпечення, 2018-2020 н.р.',
        "Відокремлений підрозділ «Науковий ліцей» Державного університету «Житомирська політехніка», вчитель інформатики з 2021 р. і по теперішній час",
      ],
    },
    furikhata: {
      name: "Фуріхата Денис Вікторович",
      role: "Науковий керівник",
      image: "../images/Фуріхата Денис Вікторович.png",
      position: "Викладач",
      description:
        'Старший викладач кафедри комп\'ютерних наук Державного університету "Житомирська Політехніка"',
      education: [
        'Alma mater: Державний університет "Житомирська політехніка"',
        'Освіта: "Інженерія програмного забезпечення", кваліфікація магістр з інженерії програмного забезпечення',
      ],
      scientific: [
        "Наукова діяльність: автор декількох наукових та науково-методичних праць",
        "Наукові інтереси: веборієнтовані системи, інтелектуальний аналіз даних",
        "Профілі у наукометричних базах",
      ],
      awards: [
        'Подяка члену журі конкурсу ідей "Креатив в ІТ" у секції Branding/UX',
      ],
      membership: ["Член Вченої ради ФІКТ університету"],
      contact: "Email: kkn_fdv@ztu.edu.ua",
    },
    chyzhevskyi: {
      name: "Чижевський Володимир Володимирович",
      role: "Розробник проєкту",
      image: "../images/Чижевський Володимир Володимирович.jpg",
      position: "Учень",
      description:
        'Учень 10 класу Відокремленого підрозділу "Науковий ліцей" Державного університету "Житомирська політехніка", вихованець гуртка «Програмування та дизайн» ЖМЦНТТУМ',
      achievements: [
        "Розробка веб-додатків",
        "Участь у конкурсах з програмування",
        "Створення проєкту ProFix Network Hub",
      ],
      interests: [
        "Веб-розробка",
        "Мобільні додатки",
        "Штучний інтелект",
        "Дизайн інтерфейсів",
      ],
      skills: [
        "HTML, CSS, JavaScript",
        "Node.js, Express",
        "PostgreSQL",
        "Розробка PWA додатків",
      ],
    },
  };

  // Open modal with team member details
  function openTeamMemberModal(memberId) {
    const member = teamMembersData[memberId];
    if (!member) return;

    let modalHTML = `
      <div class="team-modal-header">
        <div class="team-modal-image">
          <img src="${member.image}" alt="${member.name}" />
        </div>
        <div class="team-modal-title">
          <h2 class="team-modal-name">${member.name}</h2>
          <p class="team-modal-role">${member.position}</p>
        </div>
      </div>
      <div class="team-modal-info">
    `;

    // Add description
    modalHTML += `
      <div class="info-section">
        <p>${member.description}</p>
      </div>
    `;

    // Add specific sections based on member
    if (memberId === "shatkivskyi") {
      modalHTML += `
        <div class="info-section">
          <h3 class="info-section-title">Інформація про освіту</h3>
          <ul class="info-list">
            ${member.education
              .map((item) => `<li class="info-item">${item}</li>`)
              .join("")}
          </ul>
        </div>
        
        <div class="info-section">
          <h3 class="info-section-title">Кваліфікація</h3>
          <ul class="info-list">
            ${member.qualification
              .map((item) => `<li class="info-item">${item}</li>`)
              .join("")}
          </ul>
        </div>
        
        <div class="info-section">
          <h3 class="info-section-title">Індивідуальна науково-методична тема</h3>
          <p class="team-modal-quote">${member.methodology}</p>
        </div>
        
        <div class="info-section">
          <h3 class="info-section-title">Педагогічне кредо</h3>
          <p class="team-modal-quote">${member.credo}</p>
        </div>
        
        <div class="info-section">
          <h3 class="info-section-title">Педагогічна діяльність</h3>
          <ul class="info-list">
            ${member.career
              .map((item) => `<li class="info-item">${item}</li>`)
              .join("")}
          </ul>
        </div>
      `;
    } else if (memberId === "furikhata") {
      modalHTML += `
        <div class="info-section">
          <h3 class="info-section-title">Освіта</h3>
          <ul class="info-list">
            ${member.education
              .map((item) => `<li class="info-item">${item}</li>`)
              .join("")}
          </ul>
        </div>
        
        <div class="info-section">
          <h3 class="info-section-title">Наукова діяльність</h3>
          <ul class="info-list">
            ${member.scientific
              .map((item) => `<li class="info-item">${item}</li>`)
              .join("")}
          </ul>
        </div>
        
        <div class="info-section">
          <h3 class="info-section-title">Державні нагороди та відзнаки</h3>
          <ul class="info-list">
            ${member.awards
              .map((item) => `<li class="info-item">${item}</li>`)
              .join("")}
          </ul>
        </div>
        
        <div class="info-section">
          <h3 class="info-section-title">Членство в радах, дорадчих та консультативних органах</h3>
          <ul class="info-list">
            ${member.membership
              .map((item) => `<li class="info-item">${item}</li>`)
              .join("")}
          </ul>
        </div>
        
        <div class="info-section">
          <h3 class="info-section-title">Контактна інформація</h3>
          <p>${member.contact}</p>
        </div>
      `;
    } else if (memberId === "chyzhevskyi") {
      modalHTML += `
        <div class="info-section">
          <h3 class="info-section-title">Досягнення</h3>
          <ul class="info-list">
            ${member.achievements
              .map((item) => `<li class="info-item">${item}</li>`)
              .join("")}
          </ul>
        </div>
        
        <div class="info-section">
          <h3 class="info-section-title">Інтереси</h3>
          <ul class="info-list">
            ${member.interests
              .map((item) => `<li class="info-item">${item}</li>`)
              .join("")}
          </ul>
        </div>
        
        <div class="info-section">
          <h3 class="info-section-title">Навички</h3>
          <ul class="info-list">
            ${member.skills
              .map((item) => `<li class="info-item">${item}</li>`)
              .join("")}
          </ul>
        </div>
      `;
    }

    modalHTML += `</div>`;

    teamModalContent.innerHTML = modalHTML;
    teamMemberModal.classList.add("active");
    document.body.style.overflow = "hidden"; // Prevent scrolling when modal is open
  }

  // Close modal
  function closeTeamMemberModal() {
    teamMemberModal.classList.remove("active");
    document.body.style.overflow = ""; // Restore scrolling
  }

  // Add event listeners for modal
  if (detailsBtns) {
    detailsBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const memberId = btn.getAttribute("data-member");
        openTeamMemberModal(memberId);
      });
    });
  }

  if (teamModalClose) {
    teamModalClose.addEventListener("click", closeTeamMemberModal);
  }

  // Close modal when clicking outside
  teamMemberModal.addEventListener("click", (e) => {
    if (e.target === teamMemberModal) {
      closeTeamMemberModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && teamMemberModal.classList.contains("active")) {
      closeTeamMemberModal();
    }
  });

  console.log("About page script loaded successfully!");
});
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
