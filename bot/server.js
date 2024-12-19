const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const express = require("express");
const cors = require("cors");

const bot = new Telegraf("7712342926:AAG5uYFW1STJENJqMzz3uh-TN7TPBL6EmJ4");
const users = {};

const initializeUser = (ctx) => {
  const { id, first_name, last_name, username } = ctx.message.from;

  users[id] = {
    firstName: first_name || "Не указано",
    lastName: last_name || "Не указана",
    username: username || "Не указан",
    phoneNumber: null,
    dateOfBirth: null,
    ip: null,
    additionalInfo: null,
    socialAccounts: null,
    isVerified: false,
    awaiting: null,
  };
};

const sendWelcomeMessage = (ctx) => {
  const userId = ctx.message.from.id;

  if (!users[userId]?.isVerified) {
    ctx.reply(
      `Добро пожаловать, ${
        users[userId]?.firstName || "пользователь"
      }! Для продолжения подтвердите номер телефона.`,
      Markup.keyboard([
        Markup.button.contactRequest("📞 Подтвердить номер телефона"),
      ])
        .oneTime()
        .resize()
    );
  } else {
    showMainMenu(ctx);
  }
};

const handleContact = async (ctx) => {
  const userId = ctx.message.from.id;

  if (users[userId]?.isVerified) {
    ctx.reply("Вы уже подтвердили номер телефона.");
    return;
  }

  const phoneNumber = ctx.message.contact.phone_number;

  if (!users[userId]) {
    ctx.reply("Начните с команды /start.");
    return;
  }

  users[userId].phoneNumber = phoneNumber;
  ctx.reply("Ваш номер телефона подтверждён");

  try {
    const response = await axios.post("http://localhost:3001/api/user-ip", {
      userId,
    });
    users[userId].ip = response.data.ip;
    users[userId].isVerified = true;
    showMainMenu(ctx);
  } catch (error) {
    ctx.reply("Ошибка подтверждения IP-адреса.");
    console.error(error);
  }
};

const showMainMenu = (ctx) => {
  ctx.reply(
    "Выберите действие:",
    Markup.keyboard([
      ["📅 Указать дату рождения", "👤 Указать ФИО"],
      ["🔍 Поиск по номеру телефона", "🔍 Поиск по СНИЛС"],
      ["🔍 Поиск по паспорту", "🔍 Поиск по соцсетям"],
      ["🔍 Поиск по транспорту", "📋 Проверить информацию"],
    ]).resize()
  );
};

const handleText = async (ctx) => {
  const userId = ctx.message.from.id;
  const input = ctx.message.text.trim();

  if (!users[userId]) {
    ctx.reply("Пожалуйста, начните с команды /start.");
    return;
  }

  if (!users[userId].isVerified) {
    ctx.reply(
      "Вы не подтвердили номер телефона. Пожалуйста, подтвердите его, чтобы продолжить.",
      Markup.keyboard([
        Markup.button.contactRequest("📞 Подтвердить номер телефона"),
      ])
        .oneTime()
        .resize()
    );
    return;
  }

  switch (input) {
    case "📅 Указать дату рождения":
      ctx.reply("Введите дату рождения в формате YYYY-MM-DD.");
      users[userId].awaiting = "dateOfBirth";
      break;

    case "👤 Указать ФИО":
      ctx.reply("Введите ФИО полностью.");
      users[userId].awaiting = "fullName";
      break;

    case "🔍 Поиск по номеру телефона":
      ctx.reply("Введите номер телефона в международном формате (+7...).");
      users[userId].awaiting = "phoneNumber";
      break;

    case "🔍 Поиск по СНИЛС":
      ctx.reply("Введите СНИЛС (11 цифр).");
      users[userId].awaiting = "snils";
      break;

    case "🔍 Поиск по паспорту":
      ctx.reply("Введите номер паспорта (4 цифры и 6 цифр).");
      users[userId].awaiting = "passport";
      break;

    case "🔍 Поиск по транспорту":
      ctx.reply("Введите номер транспортного средства.");
      users[userId].awaiting = "vehicleNumber";
      break;

    case "🔍 Поиск по соцсетям":
      ctx.reply("Введите username в формате @username.");
      users[userId].awaiting = "socialAccount";
      break;

    case "📋 Проверить информацию":
      ctx.reply(`Ваша информация: ${JSON.stringify(users[userId], null, 2)}`);
      break;

    default:
      ctx.reply("Неверная команда или формат данных. Попробуйте снова.");
  }
};

const handleAwaitedInput = async (ctx) => {
  const userId = ctx.message.from.id;
  const input = ctx.message.text.trim();

  if (!users[userId] || !users[userId].awaiting) {
    ctx.reply("Пожалуйста, начните с команды /start или выберите действие.");
    return;
  }

  const awaiting = users[userId].awaiting;
  users[userId].awaiting = null;

  switch (awaiting) {
    case "dateOfBirth":
      fetchDateOfBirthInfo(ctx, userId, input);
      break;

    case "fullName":
      fetchFullNameInfo(ctx, userId, input);
      break;

    case "phoneNumber":
      fetchPhoneNumberInfo(ctx, userId, input);
      break;

    case "snils":
      fetchSNILSInfo(ctx, userId, input);
      break;

    case "passport":
      fetchPassportInfo(ctx, userId, input);
      break;

    case "vehicleNumber":
      fetchVehicleInfo(ctx, userId, input);
      break;

    case "socialAccount":
      fetchSocialInfo(ctx, userId, input);
      break;

    default:
      ctx.reply("Ошибка обработки данных. Попробуйте снова.");
  }
};

const fetchPhoneNumberInfo = async (ctx, userId, phoneNumber) => {
  try {
    const response = await axios.post(
      "https://nonexistent-api.com/phone-info",
      { phoneNumber }
    );
    users[userId].additionalInfo =
      response.data.info || "Информация отсутствует";
    ctx.reply(`Номер телефона записан. Ответ API: ${response.data.info}`);
  } catch (error) {
    ctx.reply("Ошибка при запросе к API для номера телефона.");
    console.error(error);
  }
};

const fetchDateOfBirthInfo = (ctx, userId, date) => {
  users[userId].dateOfBirth = date;
  ctx.reply(`Дата рождения записана: ${date}`);
};

const fetchFullNameInfo = async (ctx, userId, fullName) => {
  try {
    const response = await axios.post("https://nonexistent-api.com/fio-info", {
      fio: fullName,
    });
    users[userId].lastName = fullName;
    users[userId].additionalInfo =
      response.data.info || "Информация отсутствует";
    ctx.reply(`ФИО записано. Ответ API: ${response.data.info}`);
  } catch (error) {
    ctx.reply("Ошибка при запросе к API для ФИО.");
    console.error(error);
  }
};

const fetchSNILSInfo = async (ctx, userId, snils) => {
  try {
    const response = await axios.post(
      "https://nonexistent-api.com/snils-info",
      { snils }
    );
    users[userId].additionalInfo = snils;
    ctx.reply(`СНИЛС записан. Ответ API: ${response.data.info}`);
  } catch (error) {
    ctx.reply("Ошибка при запросе к API для СНИЛС.");
    console.error(error);
  }
};

const fetchPassportInfo = async (ctx, userId, passport) => {
  try {
    const response = await axios.post(
      "https://nonexistent-api.com/passport-info",
      { passport }
    );
    users[userId].additionalInfo = passport;
    ctx.reply(`Паспорт записан. Ответ API: ${response.data.info}`);
  } catch (error) {
    ctx.reply("Ошибка при запросе к API для паспорта.");
    console.error(error);
  }
};

const fetchVehicleInfo = async (ctx, userId, vehicleNumber) => {
  try {
    const response = await axios.post(
      "https://nonexistent-api.com/vehicle-info",
      { vehicleNumber }
    );
    users[userId].additionalInfo = vehicleNumber;
    ctx.reply(
      `Номер транспортного средства записан. Ответ API: ${response.data.info}`
    );
  } catch (error) {
    ctx.reply("Ошибка при запросе к API для номера транспортного средства.");
    console.error(error);
  }
};

const fetchSocialInfo = async (ctx, userId, username) => {
  try {
    const response = await axios.get(
      `https://nonexistent-api.com/socials?username=${encodeURIComponent(
        username
      )}`
    );
    users[userId].socialAccounts =
      response.data.socials || "Социальные сети не найдены";
    ctx.reply(
      `Социальные сети для username ${username}: ${JSON.stringify(
        response.data.socials,
        null,
        2
      )}`
    );
  } catch (error) {
    ctx.reply("Ошибка при запросе к API для username.");
    console.error(error);
  }
};

bot.start((ctx) => {
  const userId = ctx.message.from.id;

  if (!users[userId]) {
    initializeUser(ctx);
  }

  sendWelcomeMessage(ctx);
});

bot.on("contact", handleContact);
bot.on("text", (ctx) => {
  const userId = ctx.message.from.id;

  if (users[userId]?.awaiting) {
    handleAwaitedInput(ctx);
  } else {
    handleText(ctx);
  }
});

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/user-ip", (req, res) => {
  const { userId } = req.body;

  if (!userId || !users[userId]) {
    return res
      .status(400)
      .json({ error: "Неверный запрос или пользователь не найден." });
  }

  const userIp =
    req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  users[userId].ip = userIp;

  res.json({ success: true, ip: userIp });
});

app.get("/api/users", (req, res) => {
  const usersData = Object.keys(users).map((userId) => ({
    id: userId,
    ...users[userId],
  }));
  res.json(usersData);
});

app.listen(PORT, () => {
  console.log(`API сервер запущен на http://localhost:${PORT}`);
});

bot.launch().then(() => {
  console.log("Бот запущен.");
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
