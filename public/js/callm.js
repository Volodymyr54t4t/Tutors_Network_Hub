// Глобальні змінні
let userId = null;
let username = null;
let socket = null;

let selectedClientId = null;
let selectedClientName = null;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let callActive = false;
let callTimer = null;
let callDuration = 0;
let mediaDevices = {
  audioInput: [],
  videoInput: [],
  audioOutput: [],
};

// Налаштування WebRTC
const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Ініціалізація при завантаженні сторінки
document.addEventListener("DOMContentLoaded", () => {
  // Перевірка авторизації
  checkAuth();

  // Ініціалізація Socket.io
  initializeSocket();

  // Налаштування обробників подій для вкладок
  setupTabHandlers();

  // Налаштування обробників подій для кнопок
  setupButtonHandlers();

  // Завантаження списку клієнтів
  loadClients();

  // Завантаження історії дзвінків
  loadCallHistory();

  // Завантаження статистики
  loadCallStats();

  // Ініціалізація медіа-пристроїв
  initializeMediaDevices();

  // Ініціалізація графіка
  initializeChart();
});

// Перевірка авторизації
function checkAuth() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "/auth.html";
    return;
  }

  // Отримання інформації про користувача
  fetch("/profile/" + localStorage.getItem("userId"), {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Помилка авторизації");
      }
      return response.json();
    })
    .then((data) => {
      userId = localStorage.getItem("userId");
      username = data.profile.username;

      // Перевірка чи користувач є майстром
      if (!data.profile.role_master) {
        window.location.href = "/call.html";
        return;
      }

      // Оновлення інформації про користувача на сторінці
      document.getElementById("username").textContent =
        data.profile.first_name || username;

      if (data.profile.profile_image_url) {
        document.getElementById("user-avatar").src =
          data.profile.profile_image_url;
      }
    })
    .catch((error) => {
      console.error("Помилка при отриманні профілю:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/auth.html";
    });
}

// Ініціалізація Socket.io
function initializeSocket() {
  socket = io();

  // Приєднання до чату
  socket.on("connect", () => {
    console.log("З'єднано з сервером");

    // Повідомляємо сервер про приєднання
    socket.emit("join", { id: userId, username: username });
  });

  // Обробка пропозиції дзвінка
  socket.on("call-offer", handleCallOffer);

  // Обробка відповіді на дзвінок
  socket.on("call-answer", handleCallAnswer);

  // Обробка ICE кандидатів
  socket.on("ice-candidate", handleIceCandidate);

  // Обробка завершення дзвінка
  socket.on("end-call", handleEndCall);

  // Обробка відхилення дзвінка
  socket.on("call-declined", handleCallDeclined);

  // Обробка недоступності користувача
  socket.on("call-unavailable", handleCallUnavailable);

  // Обробка приєднання користувача
  socket.on("user-joined", (user) => {
    console.log("Користувач приєднався:", user);
    // Оновлюємо список клієнтів
    loadClients();
  });

  // Обробка виходу користувача
  socket.on("user-left", (user) => {
    console.log("Користувач вийшов:", user);
    // Оновлюємо список клієнтів
    loadClients();
  });
}

// Налаштування обробників подій для вкладок
function setupTabHandlers() {
  const tabButtons = document.querySelectorAll(".menu-item");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const tabName = button.getAttribute("data-tab");

      // Видаляємо активний клас з усіх кнопок і вкладок
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Додаємо активний клас до вибраної кнопки і вкладки
      button.classList.add("active");
      document.getElementById(`${tabName}-tab`).classList.add("active");
    });
  });

  // Налаштування пошуку клієнтів
  document
    .getElementById("search-clients")
    .addEventListener("input", filterClients);

  // Налаштування фільтра за статусом
  document
    .getElementById("status-filter")
    .addEventListener("change", filterClients);

  // Налаштування фільтра історії
  document
    .getElementById("history-filter")
    .addEventListener("change", filterCallHistory);
}

// Налаштування обробників подій для кнопок
function setupButtonHandlers() {
  // Кнопки тестування пристроїв
  document.getElementById("test-audio").addEventListener("click", testAudio);
  document.getElementById("test-video").addEventListener("click", testVideo);

  // Кнопки керування дзвінком
  document
    .getElementById("toggle-mic")
    .addEventListener("click", toggleMicrophone);
  document
    .getElementById("toggle-video")
    .addEventListener("click", toggleVideo);
  document.getElementById("end-call").addEventListener("click", endCall);
  document
    .getElementById("toggle-fullscreen")
    .addEventListener("click", toggleFullscreen);

  // Кнопки для вхідного дзвінка
  document.getElementById("accept-call").addEventListener("click", acceptCall);
  document
    .getElementById("decline-call")
    .addEventListener("click", declineCall);

  // Обробники змін пристроїв
  document
    .getElementById("audio-input")
    .addEventListener("change", updateAudioInput);
  document
    .getElementById("video-input")
    .addEventListener("change", updateVideoInput);
  document
    .getElementById("audio-output")
    .addEventListener("change", updateAudioOutput);

  // Обробник зміни статусу доступності
  document
    .getElementById("availability-status")
    .addEventListener("change", updateAvailabilityStatus);
}

// Завантаження списку клієнтів
function loadClients() {
  const token = localStorage.getItem("token");
  const clientsList = document.getElementById("clients-list");

  fetch("/admin/users", {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then((response) => response.json())
    .then((users) => {
      clientsList.innerHTML = "";

      // Фільтруємо користувачів (не майстрів)
      const clients = users.filter((user) => !user.role_master);

      if (clients.length === 0) {
        clientsList.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-user-slash"></i>
                    <p>Немає доступних клієнтів</p>
                </div>
            `;
        return;
      }

      clients.forEach((client) => {
        const card = document.createElement("div");
        card.className = "client-card";
        card.innerHTML = `
                <div class="client-header">
                    <div class="client-avatar">
                        <img src="${
                          client.profile_image_url ||
                          "/placeholder.svg?height=60&width=60"
                        }" alt="${client.username}">
                        <span class="status ${
                          client.online ? "online" : "offline"
                        }"></span>
                    </div>
                    <div class="client-info">
                        <h3>${client.first_name || ""} ${
          client.last_name || ""
        }</h3>
                        <p>${client.username}</p>
                    </div>
                </div>
                <div class="client-actions">
                    <button class="call-button primary" data-id="${
                      client.id
                    }" data-name="${client.first_name || client.username}">
                        <i class="fas fa-phone-alt"></i>
                        Зателефонувати
                    </button>
                    <button class="call-button secondary" data-id="${
                      client.id
                    }">
                        <i class="fas fa-info-circle"></i>
                        Деталі
                    </button>
                </div>
            `;

        clientsList.appendChild(card);

        // Додаємо обробник для кнопки дзвінка
        card
          .querySelector(".call-button.primary")
          .addEventListener("click", (e) => {
            const clientId = e.currentTarget.getAttribute("data-id");
            const clientName = e.currentTarget.getAttribute("data-name");
            initiateCall(clientId, clientName);
          });
      });
    })
    .catch((error) => {
      console.error("Помилка при завантаженні клієнтів:", error);
      clientsList.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Помилка при завантаженні клієнтів</p>
            </div>
        `;
    });
}

// Фільтрація клієнтів
function filterClients() {
  const searchQuery = document
    .getElementById("search-clients")
    .value.toLowerCase();
  const statusFilter = document.getElementById("status-filter").value;
  const clientCards = document.querySelectorAll(".client-card");

  clientCards.forEach((card) => {
    const clientName = card
      .querySelector(".client-info h3")
      .textContent.toLowerCase();
    const clientUsername = card
      .querySelector(".client-info p")
      .textContent.toLowerCase();
    const isOnline = card
      .querySelector(".client-avatar .status")
      .classList.contains("online");

    const matchesSearch =
      clientName.includes(searchQuery) || clientUsername.includes(searchQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "online" && isOnline) ||
      (statusFilter === "offline" && !isOnline);

    if (matchesSearch && matchesStatus) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Завантаження історії дзвінків
function loadCallHistory() {
  const token = localStorage.getItem("token");
  const callHistory = document.getElementById("call-history");

  fetch(`/api/call-history/master/${userId}`, {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      callHistory.innerHTML = "";

      if (!data.history || data.history.length === 0) {
        callHistory.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-history"></i>
                    <p>Історія дзвінків порожня</p>
                </div>
            `;
        return;
      }

      data.history.forEach((call) => {
        const date = new Date(call.created_at);
        const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

        let statusClass = "";
        let statusIcon = "";

        if (call.status === "completed") {
          statusClass = "incoming";
          statusIcon = "fa-phone-alt";
        } else if (call.status === "missed") {
          statusClass = "missed";
          statusIcon = "fa-phone-slash";
        } else if (call.status === "rejected") {
          statusClass = "missed";
          statusIcon = "fa-phone-slash";
        }

        const callItem = document.createElement("div");
        callItem.className = "call-item";
        callItem.dataset.status = call.status;
        callItem.innerHTML = `
                <div class="call-icon ${statusClass}">
                    <i class="fas ${statusIcon}"></i>
                </div>
                <div class="call-details">
                    <h4>${call.user_name || "Невідомий клієнт"}</h4>
                    <p>${
                      call.status === "completed"
                        ? "Завершений"
                        : call.status === "missed"
                        ? "Пропущений"
                        : "Відхилений"
                    }</p>
                </div>
                <div class="call-time">${formattedDate}</div>
                ${
                  call.duration
                    ? `<div class="call-duration">${formatDuration(
                        call.duration
                      )}</div>`
                    : ""
                }
            `;

        callHistory.appendChild(callItem);
      });

      // Застосовуємо фільтр історії
      filterCallHistory();
    })
    .catch((error) => {
      console.error("Помилка при завантаженні історії дзвінків:", error);
      callHistory.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Помилка при завантаженні історії дзвінків</p>
            </div>
        `;
    });
}

// Фільтрація історії дзвінків
function filterCallHistory() {
  const historyFilter = document.getElementById("history-filter").value;
  const callItems = document.querySelectorAll(".call-item");

  callItems.forEach((item) => {
    const status = item.dataset.status;

    if (historyFilter === "all" || status === historyFilter) {
      item.style.display = "flex";
    } else {
      item.style.display = "none";
    }
  });
}

// Завантаження статистики дзвінків
function loadCallStats() {
  const token = localStorage.getItem("token");

  fetch(`/api/call-stats/master/${userId}`, {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then((response) => response.json())
    .then((stats) => {
      // Оновлюємо статистику на сторінці
      document.getElementById("total-calls").textContent = stats.total;
      document.getElementById("accepted-calls").textContent = stats.accepted;
      document.getElementById("missed-calls").textContent = stats.missed;
      document.getElementById("avg-duration").textContent = formatDuration(
        stats.avgDuration
      );

      // Обчислюємо відсоток прийнятих дзвінків
      const acceptanceRate =
        stats.total > 0 ? Math.round((stats.accepted / stats.total) * 100) : 0;
      document.getElementById(
        "acceptance-rate"
      ).textContent = `${acceptanceRate}%`;

      // Обчислюємо кількість дзвінків сьогодні
      const today = new Date().toISOString().split("T")[0];

      fetch(`/api/call-history/master/${userId}`, {
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          const todayCalls = data.history.filter((call) => {
            const callDate = new Date(call.created_at)
              .toISOString()
              .split("T")[0];
            return callDate === today;
          }).length;

          document.getElementById("today-calls").textContent = todayCalls;

          // Оновлюємо дані графіка
          updateChart(data.history);
        })
        .catch((error) => {
          console.error(
            "Помилка при завантаженні історії дзвінків для статистики:",
            error
          );
        });
    })
    .catch((error) => {
      console.error("Помилка при завантаженні статистики дзвінків:", error);
    });
}

// Ініціалізація графіка
function initializeChart() {
  const ctx = document.getElementById("weekly-chart").getContext("2d");

  window.weeklyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"],
      datasets: [
        {
          label: "Прийняті",
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: "#4caf50",
        },
        {
          label: "Пропущені",
          data: [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: "#f44336",
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
        },
      },
    },
  });
}

// Оновлення даних графіка
function updateChart(history) {
  // Отримуємо дати останніх 7 днів
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    days.push(date.toISOString().split("T")[0]);
  }

  // Підраховуємо кількість дзвінків за кожен день
  const acceptedCalls = [0, 0, 0, 0, 0, 0, 0];
  const missedCalls = [0, 0, 0, 0, 0, 0, 0];

  history.forEach((call) => {
    const callDate = new Date(call.created_at).toISOString().split("T")[0];
    const dayIndex = days.indexOf(callDate);

    if (dayIndex !== -1) {
      if (call.status === "completed") {
        acceptedCalls[dayIndex]++;
      } else {
        missedCalls[dayIndex]++;
      }
    }
  });

  // Оновлюємо дані графіка
  window.weeklyChart.data.datasets[0].data = acceptedCalls;
  window.weeklyChart.data.datasets[1].data = missedCalls;
  window.weeklyChart.update();
}

// Ініціалізація медіа-пристроїв
async function initializeMediaDevices() {
  try {
    // Перевіряємо доступність медіа-пристроїв
    const devices = await navigator.mediaDevices.enumerateDevices();

    // Фільтруємо пристрої за типом
    mediaDevices.audioInput = devices.filter(
      (device) => device.kind === "audioinput"
    );
    mediaDevices.videoInput = devices.filter(
      (device) => device.kind === "videoinput"
    );
    mediaDevices.audioOutput = devices.filter(
      (device) => device.kind === "audiooutput"
    );

    // Заповнюємо селекти
    const audioInputSelect = document.getElementById("audio-input");
    const videoInputSelect = document.getElementById("video-input");
    const audioOutputSelect = document.getElementById("audio-output");

    // Очищаємо селекти
    audioInputSelect.innerHTML = "";
    videoInputSelect.innerHTML = "";
    audioOutputSelect.innerHTML = "";

    // Додаємо аудіо входи
    mediaDevices.audioInput.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Мікрофон ${audioInputSelect.length + 1}`;
      audioInputSelect.appendChild(option);
    });

    // Додаємо відео входи
    mediaDevices.videoInput.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Камера ${videoInputSelect.length + 1}`;
      videoInputSelect.appendChild(option);
    });

    // Додаємо аудіо виходи
    mediaDevices.audioOutput.forEach((device) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.text = device.label || `Динамік ${audioOutputSelect.length + 1}`;
      audioOutputSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Помилка при ініціалізації медіа-пристроїв:", error);
  }
}

// Тестування мікрофона
async function testAudio() {
  try {
    // Зупиняємо попередній стрім, якщо він є
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    const audioSource = document.getElementById("audio-input").value;

    // Отримуємо доступ до мікрофона
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: audioSource ? { deviceId: { exact: audioSource } } : true,
      video: false,
    });

    // Створюємо аудіо аналізатор
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(localStream);
    const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContext.destination);

    // Відображаємо рівень гучності
    javascriptNode.onaudioprocess = function () {
      const array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(array);
      let values = 0;

      const length = array.length;
      for (let i = 0; i < length; i++) {
        values += array[i];
      }

      const average = values / length;
      const levelBar = document.querySelector("#audio-level .level-bar");
      levelBar.style.width = average + "%";
    };

    // Зупиняємо тест через 10 секунд
    setTimeout(() => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
      }
      javascriptNode.disconnect();
      analyser.disconnect();
      microphone.disconnect();
      document.querySelector("#audio-level .level-bar").style.width = "0";
    }, 10000);
  } catch (error) {
    console.error("Помилка при тестуванні мікрофона:", error);
    alert(
      "Помилка при доступі до мікрофона. Перевірте налаштування дозволів браузера."
    );
  }
}

// Тестування камери
async function testVideo() {
  try {
    // Зупиняємо попередній стрім, якщо він є
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    const videoSource = document.getElementById("video-input").value;

    // Отримуємо доступ до камери
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: videoSource ? { deviceId: { exact: videoSource } } : true,
    });

    // Відображаємо відео
    const videoPreview = document.getElementById("video-preview");
    const videoPreviewContainer = document.getElementById(
      "video-preview-container"
    );

    videoPreview.srcObject = localStream;
    videoPreviewContainer.style.display = "block";

    // Зупиняємо тест через 10 секунд
    setTimeout(() => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        localStream = null;
      }
      videoPreview.srcObject = null;
      videoPreviewContainer.style.display = "none";
    }, 10000);
  } catch (error) {
    console.error("Помилка при тестуванні камери:", error);
    alert(
      "Помилка при доступі до камери. Перевірте налаштування дозволів браузера."
    );
  }
}

// Оновлення аудіо входу
function updateAudioInput() {
  // Якщо дзвінок активний, оновлюємо аудіо трек
  if (callActive && localStream) {
    const audioSource = document.getElementById("audio-input").value;

    navigator.mediaDevices
      .getUserMedia({
        audio: audioSource ? { deviceId: { exact: audioSource } } : true,
        video: false,
      })
      .then((stream) => {
        const audioTrack = stream.getAudioTracks()[0];
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track.kind === "audio");

        if (sender) {
          sender.replaceTrack(audioTrack);

          // Замінюємо аудіо трек у локальному стрімі
          const oldTrack = localStream.getAudioTracks()[0];
          if (oldTrack) {
            oldTrack.stop();
            localStream.removeTrack(oldTrack);
          }
          localStream.addTrack(audioTrack);
        }
      })
      .catch((error) => {
        console.error("Помилка при оновленні аудіо входу:", error);
      });
  }
}

// Оновлення відео входу
function updateVideoInput() {
  // Якщо дзвінок активний, оновлюємо відео трек
  if (callActive && localStream) {
    const videoSource = document.getElementById("video-input").value;

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: videoSource ? { deviceId: { exact: videoSource } } : true,
      })
      .then((stream) => {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track.kind === "video");

        if (sender) {
          sender.replaceTrack(videoTrack);

          // Замінюємо відео трек у локальному стрімі
          const oldTrack = localStream.getVideoTracks()[0];
          if (oldTrack) {
            oldTrack.stop();
            localStream.removeTrack(oldTrack);
          }
          localStream.addTrack(videoTrack);

          // Оновлюємо локальне відео
          document.getElementById("local-video").srcObject = localStream;
        }
      })
      .catch((error) => {
        console.error("Помилка при оновленні відео входу:", error);
      });
  }
}

// Оновлення аудіо виходу
function updateAudioOutput() {
  const audioOutput = document.getElementById("audio-output").value;
  const remoteVideo = document.getElementById("remote-video");

  // Перевіряємо підтримку setSinkId
  if (typeof remoteVideo.setSinkId === "function") {
    remoteVideo
      .setSinkId(audioOutput)
      .then(() => {
        console.log("Аудіо вихід успішно оновлено");
      })
      .catch((error) => {
        console.error("Помилка при оновленні аудіо виходу:", error);
      });
  } else {
    console.warn("Ваш браузер не підтримує вибір аудіо виходу");
  }
}

// Оновлення статусу доступності
function updateAvailabilityStatus() {
  const status = document.getElementById("availability-status").value;
  const statusIndicator = document.querySelector(".user-info .status");

  // Оновлюємо відображення статусу
  statusIndicator.className = "status";
  statusIndicator.classList.add(status === "available" ? "online" : status);

  // Оновлюємо текст статусу
  let statusText = "";
  switch (status) {
    case "available":
      statusText = "Доступний";
      break;
    case "busy":
      statusText = "Зайнятий";
      break;
    case "away":
      statusText = "Відійшов";
      break;
    default:
      statusText = "Онлайн";
  }

  document.getElementById("user-status").textContent = statusText;

  // Відправляємо статус на сервер
  socket.emit("status-update", {
    id: userId,
    status: status,
  });
}

// Ініціювання дзвінка
async function initiateCall(clientId, clientName) {
  try {
    selectedClientId = clientId;
    selectedClientName = clientName;

    // Отримуємо доступ до медіа-пристроїв
    const audioSource = document.getElementById("audio-input").value;
    const videoSource = document.getElementById("video-input").value;

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: audioSource ? { deviceId: { exact: audioSource } } : true,
      video: videoSource ? { deviceId: { exact: videoSource } } : true,
    });

    // Відображаємо локальне відео
    document.getElementById("local-video").srcObject = localStream;

    // Створюємо RTCPeerConnection
    peerConnection = new RTCPeerConnection(configuration);

    // Додаємо локальні треки до з'єднання
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Обробка ICE кандидатів
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          sender: userId,
          receiver: selectedClientId,
          candidate: event.candidate,
        });
      }
    };

    // Обробка віддаленого стріму
    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      document.getElementById("remote-video").srcObject = remoteStream;
    };

    // Створюємо пропозицію
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Відправляємо пропозицію клієнту
    socket.emit("call-offer", {
      sender: userId,
      receiver: selectedClientId,
      offer: offer,
      caller: {
        id: userId,
        username: username,
      },
    });

    // Відображаємо модальне вікно дзвінка
    document.getElementById("call-status").textContent = "Виклик клієнта...";
    document.getElementById("remote-name").textContent = selectedClientName;
    document.getElementById("call-modal").style.display = "flex";

    // Відтворюємо звук дзвінка
    document.getElementById("ringtone").play();
  } catch (error) {
    console.error("Помилка при ініціюванні дзвінка:", error);
    alert(
      "Помилка при доступі до медіа-пристроїв. Перевірте налаштування дозволів браузера."
    );

    // Очищаємо ресурси
    cleanupCall();
  }
}

// Обробка пропозиції дзвінка
async function handleCallOffer(data) {
  // Перевіряємо, чи дзвінок для нас
  if (data.receiver !== userId) return;

  // Зберігаємо інформацію про дзвінок
  selectedClientId = data.sender;
  selectedClientName = data.caller.username;

  // Перевіряємо, чи увімкнена автовідповідь
  const autoAnswer = document.getElementById("auto-answer").checked;
  const availabilityStatus = document.getElementById(
    "availability-status"
  ).value;

  if (autoAnswer && availabilityStatus === "available") {
    // Автоматично приймаємо дзвінок
    acceptCall();
  } else {
    // Відображаємо інформацію про дзвінок
    document.getElementById("caller-name").textContent = selectedClientName;
    document.getElementById("incoming-call-modal").style.display = "flex";

    // Відтворюємо звук дзвінка
    document.getElementById("ringtone").play();
  }
}

// Прийняття дзвінка
async function acceptCall() {
  try {
    // Приховуємо модальне вікно вхідного дзвінка
    document.getElementById("incoming-call-modal").style.display = "none";

    // Зупиняємо звук дзвінка
    document.getElementById("ringtone").pause();
    document.getElementById("ringtone").currentTime = 0;

    // Отримуємо доступ до медіа-пристроїв
    const audioSource = document.getElementById("audio-input").value;
    const videoSource = document.getElementById("video-input").value;

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: audioSource ? { deviceId: { exact: audioSource } } : true,
      video: videoSource ? { deviceId: { exact: videoSource } } : true,
    });

    // Відображаємо локальне відео
    document.getElementById("local-video").srcObject = localStream;

    // Створюємо RTCPeerConnection
    peerConnection = new RTCPeerConnection(configuration);

    // Додаємо локальні треки до з'єднання
    localStream.getTracks().forEach((track) => {
      peerConnection.addTrack(track, localStream);
    });

    // Обробка ICE кандидатів
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          sender: userId,
          receiver: selectedClientId,
          candidate: event.candidate,
        });
      }
    };

    // Обробка віддаленого стріму
    peerConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      document.getElementById("remote-video").srcObject = remoteStream;
    };

    // Відправляємо відповідь на дзвінок
    socket.emit("call-answer", {
      sender: userId,
      receiver: selectedClientId,
      answer: true,
    });

    // Відображаємо модальне вікно дзвінка
    document.getElementById("call-status").textContent = "З'єднання...";
    document.getElementById("remote-name").textContent = selectedClientName;
    document.getElementById("call-modal").style.display = "flex";

    // Зберігаємо дзвінок в історію
    saveCallToHistory("pending");
  } catch (error) {
    console.error("Помилка при прийнятті дзвінка:", error);
    alert(
      "Помилка при доступі до медіа-пристроїв. Перевірте налаштування дозволів браузера."
    );

    // Очищаємо ресурси
    cleanupCall();
  }
}

// Відхилення дзвінка
function declineCall() {
  // Приховуємо модальне вікно вхідного дзвінка
  document.getElementById("incoming-call-modal").style.display = "none";

  // Зупиняємо звук дзвінка
  document.getElementById("ringtone").pause();
  document.getElementById("ringtone").currentTime = 0;

  // Відправляємо відповідь на дзвінок
  socket.emit("call-declined", {
    sender: userId,
    receiver: selectedClientId,
  });

  // Зберігаємо дзвінок в історію
  saveCallToHistory("rejected");

  // Очищаємо ресурси
  cleanupCall();
}

// Обробка відповіді на дзвінок
async function handleCallAnswer(data) {
  // Перевіряємо, чи відповідь для нас
  if (data.receiver !== userId) return;

  // Зупиняємо звук дзвінка
  document.getElementById("ringtone").pause();
  document.getElementById("ringtone").currentTime = 0;

  if (data.answer) {
    // Якщо відповідь позитивна, встановлюємо віддалений опис сесії
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.offer)
    );

    // Створюємо відповідь
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Відправляємо відповідь
    socket.emit("call-answer", {
      sender: userId,
      receiver: selectedClientId,
      answer: answer,
    });

    // Оновлюємо статус дзвінка
    document.getElementById("call-status").textContent = "З'єднано";

    // Запускаємо таймер дзвінка
    startCallTimer();

    // Встановлюємо прапорець активного дзвінка
    callActive = true;

    // Зберігаємо дзвінок в історію
    saveCallToHistory("completed");
  } else {
    // Якщо відповідь негативна, завершуємо дзвінок
    alert("Клієнт відхилив дзвінок");

    // Приховуємо модальне вікно дзвінка
    document.getElementById("call-modal").style.display = "none";

    // Очищаємо ресурси
    cleanupCall();
  }
}

// Обробка ICE кандидатів
function handleIceCandidate(data) {
  // Перевіряємо, чи кандидат для нас
  if (data.receiver !== userId) return;

  // Додаємо ICE кандидата
  if (peerConnection) {
    peerConnection
      .addIceCandidate(new RTCIceCandidate(data.candidate))
      .catch((error) => {
        console.error("Помилка при додаванні ICE кандидата:", error);
      });
  }
}

// Обробка завершення дзвінка
function handleEndCall(data) {
  // Перевіряємо, чи завершення для нас
  if (data.receiver !== userId) return;

  // Відтворюємо звук завершення дзвінка
  document.getElementById("call-end-sound").play();

  // Приховуємо модальне вікно дзвінка
  document.getElementById("call-modal").style.display = "none";

  // Оновлюємо статус дзвінка в історії
  updateCallStatus("completed");

  // Очищаємо ресурси
  cleanupCall();
}

// Обробка відхилення дзвінка
function handleCallDeclined(data) {
  // Перевіряємо, чи відхилення для нас
  if (data.receiver !== userId) return;

  // Зупиняємо звук дзвінка
  document.getElementById("ringtone").pause();
  document.getElementById("ringtone").currentTime = 0;

  // Приховуємо модальне вікно дзвінка
  document.getElementById("call-modal").style.display = "none";

  // Повідомляємо про відхилення
  alert("Клієнт відхилив дзвінок");

  // Оновлюємо статус дзвінка в історії
  updateCallStatus("rejected");

  // Очищаємо ресурси
  cleanupCall();
}

// Обробка недоступності користувача
function handleCallUnavailable(data) {
  // Перевіряємо, чи повідомлення для нас
  if (data.receiver !== selectedClientId) return;

  // Зупиняємо звук дзвінка
  document.getElementById("ringtone").pause();
  document.getElementById("ringtone").currentTime = 0;

  // Приховуємо модальне вікно дзвінка
  document.getElementById("call-modal").style.display = "none";

  // Повідомляємо про недоступність
  alert("Клієнт зараз не в мережі");

  // Оновлюємо статус дзвінка в історії
  updateCallStatus("missed");

  // Очищаємо ресурси
  cleanupCall();
}

// Завершення дзвінка
function endCall() {
  // Відправляємо повідомлення про завершення дзвінка
  socket.emit("end-call", {
    sender: userId,
    receiver: selectedClientId,
  });

  // Відтворюємо звук завершення дзвінка
  document.getElementById("call-end-sound").play();

  // Приховуємо модальне вікно дзвінка
  document.getElementById("call-modal").style.display = "none";

  // Оновлюємо статус дзвінка в історії
  updateCallStatus("completed");

  // Очищаємо ресурси
  cleanupCall();
}

// Очищення ресурсів дзвінка
function cleanupCall() {
  // Зупиняємо таймер дзвінка
  if (callTimer) {
    clearInterval(callTimer);
    callTimer = null;
  }

  // Зупиняємо локальний стрім
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  // Закриваємо з'єднання
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }

  // Скидаємо змінні
  remoteStream = null;
  callActive = false;
  callDuration = 0;

  // Скидаємо відображення
  document.getElementById("call-timer").textContent = "00:00";
  document.getElementById("local-video").srcObject = null;
  document.getElementById("remote-video").srcObject = null;
}

// Запуск таймера дзвінка
function startCallTimer() {
  callDuration = 0;
  // Продовження файлу callm.js
  callTimer = setInterval(() => {
    callDuration++;
    document.getElementById("call-timer").textContent =
      formatDuration(callDuration);
  }, 1000);
}

// Форматування тривалості
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}

// Перемикання мікрофона
function toggleMicrophone() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;

      const micButton = document.getElementById("toggle-mic");
      if (audioTrack.enabled) {
        micButton.innerHTML = '<i class="fas fa-microphone"></i>';
        micButton.classList.remove("muted");
      } else {
        micButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        micButton.classList.add("muted");
      }
    }
  }
}

// Перемикання відео
function toggleVideo() {
  if (localStream) {
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;

      const videoButton = document.getElementById("toggle-video");
      if (videoTrack.enabled) {
        videoButton.innerHTML = '<i class="fas fa-video"></i>';
        videoButton.classList.remove("muted");
      } else {
        videoButton.innerHTML = '<i class="fas fa-video-slash"></i>';
        videoButton.classList.add("muted");
      }
    }
  }
}

// Перемикання повноекранного режиму
function toggleFullscreen() {
  const callContainer = document.querySelector(".call-container");

  if (!document.fullscreenElement) {
    if (callContainer.requestFullscreen) {
      callContainer.requestFullscreen();
    } else if (callContainer.mozRequestFullScreen) {
      callContainer.mozRequestFullScreen();
    } else if (callContainer.webkitRequestFullscreen) {
      callContainer.webkitRequestFullscreen();
    } else if (callContainer.msRequestFullscreen) {
      callContainer.msRequestFullscreen();
    }

    document.getElementById("toggle-fullscreen").innerHTML =
      '<i class="fas fa-compress"></i>';
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }

    document.getElementById("toggle-fullscreen").innerHTML =
      '<i class="fas fa-expand"></i>';
  }
}

// Збереження дзвінка в історію
function saveCallToHistory(status) {
  const token = localStorage.getItem("token");

  fetch("/api/call-history", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      user_id: selectedClientId,
      master_id: userId,
      user_name: selectedClientName,
      master_name: username,
      status: status,
      duration: callDuration,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Дзвінок збережено в історію:", data);
    })
    .catch((error) => {
      console.error("Помилка при збереженні дзвінка в історію:", error);
    });
}

// Оновлення статусу дзвінка в історії
function updateCallStatus(status) {
  const token = localStorage.getItem("token");

  fetch(`/api/call-history/master/${userId}`, {
    headers: {
      Authorization: "Bearer " + token,
    },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.history && data.history.length > 0) {
        // Знаходимо останній дзвінок з вибраним клієнтом
        const call = data.history.find(
          (call) =>
            call.user_id === selectedClientId && call.status === "pending"
        );

        if (call) {
          // Оновлюємо статус дзвінка
          fetch(`/api/call-history/${call.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer " + token,
            },
            body: JSON.stringify({
              status: status,
              duration: callDuration,
            }),
          })
            .then((response) => response.json())
            .then((data) => {
              console.log("Статус дзвінка оновлено:", data);

              // Оновлюємо історію дзвінків
              loadCallHistory();

              // Оновлюємо статистику
              loadCallStats();
            })
            .catch((error) => {
              console.error("Помилка при оновленні статусу дзвінка:", error);
            });
        }
      }
    })
    .catch((error) => {
      console.error("Помилка при отриманні історії дзвінків:", error);
    });
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
