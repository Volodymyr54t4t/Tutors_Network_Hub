document.addEventListener("DOMContentLoaded", () => {
  // Check for existing chat history first
  const hasExistingHistory = checkExistingChatHistory();
  console.log("Has existing chat history:", hasExistingHistory);

  // DOM Elements
  const loginContainer = document.getElementById("login-container");
  const chatContent = document.getElementById("chat-content");
  const logoutBtn = document.getElementById("logout-btn");
  const currentUserDisplay = document.getElementById("current-user");
  const messagesContainer = document.getElementById("messages-container");
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const loginBtn = document.getElementById("loginBtn");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  const navMenu = document.getElementById("navMenu");

  // Connect to Socket.io server with connection optimization options
  const socket = io({
    transports: ["websocket"], // Use WebSocket transport only for better performance
    upgrade: false, // Disable transport upgrades
    reconnectionAttempts: 5, // Limit reconnection attempts
    timeout: 10000, // Connection timeout
  });

  // User data
  let currentUser = {
    username: "",
    type: "",
    userId: null,
  };

  // Chat history cache
  let chatHistory = [];
  const MAX_DISPLAYED_MESSAGES = 50; // Limit displayed messages for performance

  // Scroll state tracking
  let isAutoScrollEnabled = true;
  let isNearBottom = true;

  // Create scroll buttons
  createScrollButtons();

  // Mobile menu toggle
  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      mobileMenuBtn.querySelector("i").classList.toggle("fa-bars");
      mobileMenuBtn.querySelector("i").classList.toggle("fa-times");
    });
  }

  // Check if user is logged in (token in localStorage)
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");

  if (!token || !userId) {
    // Show login error
    loginContainer.innerHTML = `
        <div class="login-error">
          <i class="fas fa-exclamation-circle"></i>
          <p>Для використання чату необхідно <a href="auth.html">увійти в систему</a>.</p>
        </div>
      `;

    // Update login button
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        window.location.href = "auth.html";
      });
    }

    return;
  }

  // Event Listeners
  logoutBtn.addEventListener("click", handleLogout);
  sendBtn.addEventListener("click", sendMessage);
  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Add scroll event listener to messages container
  messagesContainer.addEventListener("scroll", handleScroll);

  // Socket event listeners
  socket.on("connect", () => {
    console.log("Connected to server");

    // If we have local history, send it to the server
    if (chatHistory.length > 0) {
      console.log("Sending local history to server");
      socket.emit("update-server-history", chatHistory);
    } else {
      // Request chat history immediately after connection
      console.log("Requesting chat history from server");
      socket.emit("get-chat-history");
    }
  });

  socket.on("message", (message) => {
    // Add message to history
    chatHistory.push(message);

    // Save updated chat history to localStorage
    saveHistoryToLocalStorage();

    displayMessage(message, message.username === currentUser.username);

    // Auto-scroll to bottom for new messages if auto-scroll is enabled
    if (isAutoScrollEnabled) {
      scrollToBottom();
    } else if (message.username === currentUser.username) {
      // Always scroll to bottom for user's own messages
      scrollToBottom();
    } else {
      // Show new message notification if not scrolled to bottom
      showNewMessageNotification();
    }
  });

  // Listen for chat history when joining
  socket.on("chat-history", (history) => {
    // If we already have local history and server sends empty history, keep our local history
    if (chatHistory.length > 0 && (!history || history.length === 0)) {
      console.log(
        "Server sent empty history but we have local history. Keeping local history."
      );

      // Send our history to the server to update it
      socket.emit("update-server-history", chatHistory);
    } else {
      // Merge received history with any locally cached history
      mergeAndDeduplicateHistory(history);
    }

    // Clear existing messages before displaying history
    messagesContainer.innerHTML = "";

    // Display only the last MAX_DISPLAYED_MESSAGES messages for performance
    const messagesToDisplay = chatHistory.slice(-MAX_DISPLAYED_MESSAGES);

    // Display each message from history
    messagesToDisplay.forEach((message) => {
      displayMessage(message, message.username === currentUser.username);
    });

    // Add a system message indicating there are more messages if needed
    if (chatHistory.length > MAX_DISPLAYED_MESSAGES) {
      const systemMessage = {
        username: "Система",
        type: "system",
        text: `Показано останні ${MAX_DISPLAYED_MESSAGES} повідомлень з ${chatHistory.length}`,
        timestamp: new Date().toISOString(),
      };
      displayMessage(systemMessage, false, true);
    }

    // Save the merged history to localStorage
    saveHistoryToLocalStorage();

    // Scroll to bottom after loading history
    scrollToBottom();

    // Update scroll buttons visibility
    updateScrollButtonsVisibility();
  });

  socket.on("user-joined", (user) => {
    const systemMessage = {
      username: "Система",
      type: "system",
      text: `${user.username} приєднався до чату`,
      timestamp: new Date().toISOString(),
    };
    displayMessage(systemMessage, false, true);

    // When a user joins, send them our local chat history
    // This helps ensure all users have the complete history
    if (chatHistory.length > 0) {
      socket.emit("share-history", {
        userId: user.userId,
        history: chatHistory,
      });
    }

    // Auto-scroll for system messages if enabled
    if (isAutoScrollEnabled) {
      scrollToBottom();
    }
  });

  socket.on("user-left", (user) => {
    const systemMessage = {
      username: "Система",
      type: "system",
      text: `${user.username} покинув чат`,
      timestamp: new Date().toISOString(),
    };
    displayMessage(systemMessage, false, true);

    // Add the system message to history so it persists
    chatHistory.push(systemMessage);
    saveHistoryToLocalStorage();

    // Auto-scroll for system messages if enabled
    if (isAutoScrollEnabled) {
      scrollToBottom();
    }
  });

  // New event to receive history from other clients
  socket.on("receive-shared-history", (sharedHistory) => {
    if (sharedHistory && Array.isArray(sharedHistory)) {
      mergeAndDeduplicateHistory(sharedHistory);

      // If this is a new user with no messages yet, display the shared history
      if (messagesContainer.children.length === 0) {
        // Display only the last MAX_DISPLAYED_MESSAGES messages for performance
        const messagesToDisplay = chatHistory.slice(-MAX_DISPLAYED_MESSAGES);

        // Display each message from history
        messagesToDisplay.forEach((message) => {
          displayMessage(message, message.username === currentUser.username);
        });

        // Scroll to bottom after loading shared history
        scrollToBottom();
      }
    }
  });

  // Functions
  async function loadUserData() {
    try {
      // Show loading spinner
      loginContainer.innerHTML = `
        <div class="login-spinner">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Завантаження даних користувача...</p>
        </div>
      `;

      // Fetch user profile data
      const profileResponse = await fetch(`/profile/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const profileData = await profileResponse.json();

      // Fetch user data
      const userResponse = await fetch(`/admin/users-with-services`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user data");
      }

      const usersData = await userResponse.json();
      const userData = usersData.find((user) => user.id == userId);

      if (!userData) {
        throw new Error("User not found");
      }

      // Set current user data
      currentUser = {
        username: userData.username,
        type: userData.role_master ? "master" : "user",
        userId: userId,
      };

      // Load chat history from localStorage first
      loadHistoryFromLocalStorage();

      // Update UI
      currentUserDisplay.textContent = `${currentUser.username} (${
        currentUser.type === "master" ? "Майстер" : "Користувач"
      })`;
      loginContainer.classList.add("hidden");
      chatContent.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");

      // Join the chat and request chat history from server
      socket.emit("join", currentUser);
      ensureScrollbarVisibility();
      // Update login button in header
      if (loginBtn) {
        loginBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Вийти`;
        loginBtn.addEventListener("click", handleLogout);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // Show error message
      loginContainer.innerHTML = `
          <div class="login-error">
            <i class="fas fa-exclamation-circle"></i>
            <p>Помилка завантаження даних користувача. <a href="auth.html">Увійдіть знову</a>.</p>
          </div>
        `;
    }
  }

  // Add this function after loadUserData() to ensure scrollbar is working
  function ensureScrollbarVisibility() {
    // Force scrollbar recalculation
    const messagesContainer = document.getElementById("messages-container");
    if (messagesContainer) {
      // Add a small delay to ensure DOM is fully rendered
      setTimeout(() => {
        // Force a reflow
        messagesContainer.style.display = "none";
        messagesContainer.offsetHeight; // This line forces a reflow
        messagesContainer.style.display = "flex";

        // Add a dummy spacer element if needed to ensure content is scrollable
        if (messagesContainer.scrollHeight <= messagesContainer.clientHeight) {
          const spacer = document.createElement("div");
          spacer.style.height = "1px";
          spacer.style.minHeight = "1px";
          spacer.style.width = "100%";
          messagesContainer.appendChild(spacer);
        }

        // Scroll to bottom
        scrollToBottom();

        console.log("Scrollbar visibility check completed");
      }, 300);
    }
  }

  function handleLogout() {
    // Save chat history before leaving
    saveHistoryToLocalStorage();

    // Leave the chat
    socket.emit("leave", currentUser);

    // Clear user data but keep chat history in localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("userId");

    // Redirect to login page
    window.location.href = "auth.html";
  }

  function sendMessage() {
    const text = messageInput.value.trim();

    if (!text) return;

    const message = {
      username: currentUser.username,
      type: currentUser.type,
      text,
      timestamp: new Date().toISOString(),
      id: generateMessageId(), // Add unique ID to help with deduplication
    };

    // Send message to server
    socket.emit("message", message);

    // Clear input
    messageInput.value = "";

    // Always enable auto-scroll when sending a message
    isAutoScrollEnabled = true;
    updateAutoScrollButton();
  }

  // Generate a unique ID for messages to help with deduplication
  function generateMessageId() {
    return `${currentUser.userId}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  // Save chat history to localStorage
  function saveHistoryToLocalStorage() {
    try {
      // Only keep the last 200 messages to prevent localStorage from getting too large
      const historyToSave = chatHistory.slice(-200);
      localStorage.setItem("chatHistory", JSON.stringify(historyToSave));
    } catch (error) {
      console.error("Error saving chat history to localStorage:", error);
    }
  }

  // Load chat history from localStorage
  function loadHistoryFromLocalStorage() {
    try {
      const savedHistory = localStorage.getItem("chatHistory");
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
          chatHistory = parsedHistory;

          // Display the loaded history immediately
          messagesContainer.innerHTML = "";
          const messagesToDisplay = chatHistory.slice(-MAX_DISPLAYED_MESSAGES);
          messagesToDisplay.forEach((message) => {
            displayMessage(message, message.username === currentUser.username);
          });

          console.log(
            `Loaded ${chatHistory.length} messages from localStorage`
          );

          // Scroll to bottom after loading history
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (error) {
      console.error("Error loading chat history from localStorage:", error);
    }
  }

  // Merge and deduplicate history to prevent duplicate messages
  function mergeAndDeduplicateHistory(newHistory) {
    if (!Array.isArray(newHistory) || newHistory.length === 0) return;

    // Create a map of existing messages by ID or content+timestamp
    const existingMessages = new Map();
    chatHistory.forEach((msg) => {
      const key = msg.id || `${msg.username}-${msg.text}-${msg.timestamp}`;
      existingMessages.set(key, true);
    });

    // Add only new messages
    newHistory.forEach((msg) => {
      const key = msg.id || `${msg.username}-${msg.text}-${msg.timestamp}`;
      if (!existingMessages.has(key)) {
        chatHistory.push(msg);
      }
    });

    // Sort by timestamp to ensure chronological order
    chatHistory.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  // Optimized message display function with debouncing for better performance
  const displayMessage = (() => {
    const pendingMessages = [];
    let isProcessing = false;

    // Process messages in batches for better performance
    function processPendingMessages() {
      if (pendingMessages.length === 0) {
        isProcessing = false;
        return;
      }

      isProcessing = true;
      const fragment = document.createDocumentFragment();

      // Process up to 10 messages at once
      const messagesToProcess = pendingMessages.splice(0, 10);

      messagesToProcess.forEach(({ message, isSent, isSystem }) => {
        const messageElement = document.createElement("div");

        // Add message ID as data attribute for potential future reference
        if (message.id) {
          messageElement.dataset.messageId = message.id;
        }

        if (isSystem) {
          messageElement.classList.add("message", "system");
          messageElement.textContent = message.text;
        } else {
          messageElement.classList.add("message");
          messageElement.classList.add(isSent ? "sent" : "received");

          const messageInfo = document.createElement("div");
          messageInfo.classList.add("message-info");

          const userTypeSpan = document.createElement("span");
          userTypeSpan.classList.add("user-type");
          userTypeSpan.classList.add(message.type);
          userTypeSpan.textContent =
            message.type === "master" ? "Майстер" : "Користувач";

          messageInfo.textContent = message.username;
          messageInfo.appendChild(userTypeSpan);

          const messageText = document.createElement("div");
          messageText.textContent = message.text;

          // Add timestamp
          const timestampDiv = document.createElement("div");
          timestampDiv.classList.add("message-timestamp");
          const messageDate = new Date(message.timestamp);
          timestampDiv.textContent = messageDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          messageElement.appendChild(messageInfo);
          messageElement.appendChild(messageText);
          messageElement.appendChild(timestampDiv);
        }

        fragment.appendChild(messageElement);
      });

      messagesContainer.appendChild(fragment);

      // Scroll to bottom only after all messages are added if auto-scroll is enabled
      if (pendingMessages.length === 0 && isAutoScrollEnabled) {
        scrollToBottom();
      }

      // Update scroll buttons visibility and ensure scrollbar is visible
      updateScrollButtonsVisibility();
      ensureScrollbarVisibility();

      // Continue processing remaining messages if any
      if (pendingMessages.length > 0) {
        setTimeout(processPendingMessages, 10); // Small delay to prevent UI blocking
      } else {
        isProcessing = false;
      }
    }

    // Return the actual function that will be called
    return (message, isSent, isSystem = false) => {
      pendingMessages.push({ message, isSent, isSystem });

      if (!isProcessing) {
        processPendingMessages();
      }
    };
  })();

  // Limit the number of messages in the container for performance
  function pruneOldMessages() {
    while (messagesContainer.children.length > MAX_DISPLAYED_MESSAGES) {
      messagesContainer.removeChild(messagesContainer.firstChild);
    }
  }

  // Periodically prune old messages to maintain performance
  setInterval(pruneOldMessages, 60000); // Check every minute

  // Handle window/tab visibility changes to ensure we're up to date when user returns
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      // When tab becomes visible again, request latest chat history
      socket.emit("get-chat-history");
    }
  });

  // Create scroll buttons
  function createScrollButtons() {
    // Create scroll to top button
    const scrollTopBtn = document.createElement("button");
    scrollTopBtn.id = "scroll-top-btn";
    scrollTopBtn.className = "scroll-btn scroll-top-btn";
    scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollTopBtn.title = "Прокрутити вгору";
    scrollTopBtn.addEventListener("click", scrollToTop);

    // Create scroll to bottom button
    const scrollBottomBtn = document.createElement("button");
    scrollBottomBtn.id = "scroll-bottom-btn";
    scrollBottomBtn.className = "scroll-btn scroll-bottom-btn";
    scrollBottomBtn.innerHTML = '<i class="fas fa-arrow-down"></i>';
    scrollBottomBtn.title = "Прокрутити вниз";
    scrollBottomBtn.addEventListener("click", scrollToBottom);

    // Create auto-scroll toggle button
    const autoScrollBtn = document.createElement("button");
    autoScrollBtn.id = "auto-scroll-btn";
    autoScrollBtn.className = "scroll-btn auto-scroll-btn active";
    autoScrollBtn.innerHTML = '<i class="fas fa-magic"></i>';
    autoScrollBtn.title = "Автоматичне прокручування";
    autoScrollBtn.addEventListener("click", toggleAutoScroll);

    // Create new message notification
    const newMessageNotification = document.createElement("div");
    newMessageNotification.id = "new-message-notification";
    newMessageNotification.className = "new-message-notification hidden";
    newMessageNotification.innerHTML =
      'Нові повідомлення <i class="fas fa-arrow-down"></i>';
    newMessageNotification.addEventListener("click", scrollToBottom);

    // Create scroll controls container
    const scrollControls = document.createElement("div");
    scrollControls.className = "scroll-controls";
    scrollControls.appendChild(scrollTopBtn);
    scrollControls.appendChild(autoScrollBtn);
    scrollControls.appendChild(scrollBottomBtn);

    // Add elements to the chat content
    const chatContent = document.getElementById("chat-content");
    chatContent.appendChild(scrollControls);
    chatContent.appendChild(newMessageNotification);
  }

  // Scroll to top function
  function scrollToTop() {
    messagesContainer.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Scroll to bottom function
  function scrollToBottom() {
    messagesContainer.scrollTo({
      top: messagesContainer.scrollHeight,
      behavior: "smooth",
    });

    // Hide new message notification when scrolling to bottom
    hideNewMessageNotification();
  }

  // Toggle auto-scroll function
  function toggleAutoScroll() {
    isAutoScrollEnabled = !isAutoScrollEnabled;
    updateAutoScrollButton();

    if (isAutoScrollEnabled) {
      scrollToBottom();
    }
  }

  // Update auto-scroll button appearance
  function updateAutoScrollButton() {
    const autoScrollBtn = document.getElementById("auto-scroll-btn");
    if (autoScrollBtn) {
      if (isAutoScrollEnabled) {
        autoScrollBtn.classList.add("active");
        autoScrollBtn.title = "Автоматичне прокручування увімкнено";
      } else {
        autoScrollBtn.classList.remove("active");
        autoScrollBtn.title = "Автоматичне прокручування вимкнено";
      }
    }
  }

  // Handle scroll event
  function handleScroll() {
    // Check if user is near bottom
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
    isNearBottom = scrollHeight - scrollTop - clientHeight < 50;

    // Update auto-scroll based on scroll position
    if (isNearBottom && !isAutoScrollEnabled) {
      isAutoScrollEnabled = true;
      updateAutoScrollButton();
    } else if (!isNearBottom && isAutoScrollEnabled) {
      isAutoScrollEnabled = false;
      updateAutoScrollButton();
    }

    // Update scroll buttons visibility
    updateScrollButtonsVisibility();

    // Hide new message notification if scrolled to bottom
    if (isNearBottom) {
      hideNewMessageNotification();
    }
  }

  // Update scroll buttons visibility based on scroll position
  function updateScrollButtonsVisibility() {
    const scrollTopBtn = document.getElementById("scroll-top-btn");
    const scrollBottomBtn = document.getElementById("scroll-bottom-btn");

    if (scrollTopBtn && scrollBottomBtn) {
      // Show/hide scroll to top button
      if (messagesContainer.scrollTop > 100) {
        scrollTopBtn.classList.add("visible");
      } else {
        scrollTopBtn.classList.remove("visible");
      }

      // Show/hide scroll to bottom button
      if (!isNearBottom) {
        scrollBottomBtn.classList.add("visible");
      } else {
        scrollBottomBtn.classList.remove("visible");
      }
    }
  }

  // Show new message notification
  function showNewMessageNotification() {
    const notification = document.getElementById("new-message-notification");
    if (notification) {
      notification.classList.remove("hidden");
    }
  }

  // Hide new message notification
  function hideNewMessageNotification() {
    const notification = document.getElementById("new-message-notification");
    if (notification) {
      notification.classList.add("hidden");
    }
  }

  // Check if chat history exists in localStorage at page load
  function checkExistingChatHistory() {
    try {
      const savedHistory = localStorage.getItem("chatHistory");
      if (savedHistory) {
        console.log("Found existing chat history in localStorage");
        return true;
      }
    } catch (error) {
      console.error("Error checking chat history:", error);
    }
    return false;
  }

  // Load user data when page loads
  loadUserData();
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
