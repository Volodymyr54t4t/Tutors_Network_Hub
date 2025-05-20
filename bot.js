const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");

// Використовуємо токен бота з змінних середовища або наданий токен
const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  "7075973337:AAFZIgJmAChOzhQGO0CrJV93U5TI_SuGgSw";

// Використовуємо ID групи, який ви надали
let GROUP_CHAT_ID = process.env.TELEGRAM_GROUP_ID || "-1002601160734";

// Шлях до файлу для збереження ID групи
const chatIdFilePath = path.join(__dirname, "chat_id.txt");

// Спробуємо прочитати ID групи з файлу, якщо він існує
if (fs.existsSync(chatIdFilePath)) {
  try {
    const savedChatId = fs.readFileSync(chatIdFilePath, "utf8").trim();
    if (savedChatId) {
      GROUP_CHAT_ID = savedChatId;
      console.log(`✅ Завантажено ID групи з файлу: ${GROUP_CHAT_ID}`);
    }
  } catch (err) {
    console.error("❌ Помилка читання ID групи з файлу:", err.message);
  }
}

const bot = new Telegraf(BOT_TOKEN);

// Ініціалізація бота
bot.launch().catch((err) => {
  console.error("Помилка запуску бота:", err);
});

// Обробка помилок
bot.catch((err, ctx) => {
  console.error("Помилка бота:", err);
});

// Слухаємо повідомлення в групах для автоматичного встановлення GROUP_CHAT_ID
bot.on("message", (ctx) => {
  if (
    ctx.message.chat.type === "supergroup" ||
    ctx.message.chat.type === "group"
  ) {
    const chatId = ctx.message.chat.id.toString();

    // Зберігаємо ID групи у файл для збереження між перезапусками
    try {
      fs.writeFileSync(chatIdFilePath, chatId);
      console.log("✅ ID групи збережено у файл");

      // Оновлюємо ID групи, якщо він відрізняється
      if (GROUP_CHAT_ID !== chatId) {
        console.log(
          `ℹ️ Виявлено нову групу. Попередній ID: ${GROUP_CHAT_ID}, Новий ID: ${chatId}`
        );
        GROUP_CHAT_ID = chatId;

        // Відповідаємо на повідомлення, щоб підтвердити, що бот працює
        ctx.reply("✅ Бот налаштований для надсилання повідомлень у цю групу.");
      }
    } catch (err) {
      console.error("❌ Помилка збереження ID групи у файл:", err.message);
    }
  }
});

/**
 * Надсилання повідомлення в групу Telegram
 * @param {Object} messageData - Дані повідомлення
 * @param {string} messageData.username - Ім'я користувача
 * @param {string} messageData.email - Email
 * @param {string} messageData.messageType - Тип повідомлення (text, voice, video)
 * @param {string} [messageData.messageContent] - Вміст текстового повідомлення
 * @param {string} [messageData.filePath] - Шлях до файлу голосового або відео повідомлення
 * @returns {Promise<Object>} - Результат операції
 */
async function sendMessage(messageData) {
  try {
    const { username, email, messageType, messageContent, filePath } =
      messageData;

    // Перевіряємо, чи встановлено GROUP_CHAT_ID
    if (!GROUP_CHAT_ID) {
      throw new Error(
        "ID групи не встановлено. Додайте бота до групи та надішліть повідомлення для налаштування."
      );
    }

    // Формуємо заголовок повідомлення
    const messageHeader = `📩 Надіслано з веб-форми\n\nВід: ${username}\nEmail: ${email}\nТип: ${getMessageTypeText(
      messageType
    )}\n\n`;

    // Надсилаємо повідомлення залежно від типу
    try {
      if (messageType === "text") {
        await bot.telegram.sendMessage(
          GROUP_CHAT_ID,
          `${messageHeader}${messageContent}`
        );
      } else if (messageType === "voice") {
        await bot.telegram.sendVoice(
          GROUP_CHAT_ID,
          { source: filePath },
          { caption: messageHeader }
        );
      } else if (messageType === "video") {
        await bot.telegram.sendVideo(
          GROUP_CHAT_ID,
          { source: filePath },
          { caption: messageHeader }
        );
      } else {
        throw new Error("Невірний тип повідомлення");
      }

      return { success: true };
    } catch (error) {
      if (error.description && error.description.includes("bot was kicked")) {
        throw new Error(
          "Бот був видалений з групи. Будь ласка, додайте бота назад до групи."
        );
      } else if (
        error.description &&
        error.description.includes("not enough rights")
      ) {
        throw new Error(
          "Бот не має достатньо прав. Будь ласка, зробіть бота адміністратором групи."
        );
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("Помилка надсилання повідомлення в Telegram:", error);
    throw new Error(
      `Не вдалося надіслати повідомлення в Telegram: ${error.message}`
    );
  }
}

/**
 * Отримання людино-читабельного типу повідомлення
 * @param {string} messageType - Тип повідомлення
 * @returns {string} - Людино-читабельний тип повідомлення
 */
function getMessageTypeText(messageType) {
  switch (messageType) {
    case "text":
      return "Текстове повідомлення";
    case "voice":
      return "Голосове повідомлення";
    case "video":
      return "Відеоповідомлення";
    default:
      return messageType;
  }
}

module.exports = {
  sendMessage,
  bot,
  GROUP_CHAT_ID,
};
