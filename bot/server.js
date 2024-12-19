const { Telegraf, Markup } = require("telegraf");
const axios = require("axios");
const express = require("express");
const cors = require("cors");

const bot = new Telegraf("7712342926:AAG5uYFW1STJENJqMzz3uh-TN7TPBL6EmJ4");
const users = {};

bot.start((ctx) => {
  const { id, first_name } = ctx.message.from;

  users[id] = {
    firstName: first_name || "Не указано",
    lastName: null,
    phoneNumber: null,
    dateOfBirth: null,
    ip: null,
    additionalInfo: null,
    socialAccounts: null,
    isVerified: false,
  };

  ctx.reply(
    "Добро пожаловать! Подтвердите свой номер телефона",
    Markup.keyboard([
      Markup.button.contactRequest("📞 Подтвердить номер телефона"),
    ])
      .oneTime()
      .resize()
  );
});

bot.on("contact", async (ctx) => {
  const userId = ctx.message.from.id;
  const phoneNumber = ctx.message.contact.phone_number;

  if (!users[userId]) {
    ctx.reply("Начните с команды /start.");
    return;
  }

  users[userId].phoneNumber = phoneNumber;
  ctx.reply("Ваш номер телефона подтверждён. Теперь подтвердите ваш IP-адрес.");

  try {
    const response = await axios.get("https://api64.ipify.org?format=json");
    users[userId].ipAddress = response.data.ip;
    users[userId].isVerified = true;
  } catch (error) {
    ctx.reply("Не удалось получить ваш IP-адрес. Попробуйте снова позже.");
    console.error(error);
  }
});

bot.on("text", async (ctx) => {
  const userId = ctx.message.from.id;
  const input = ctx.message.text.trim();

  if (!users[userId] || !users[userId].isVerified) {
    ctx.reply(
      "Вы не подтвердили номер телефона или IP-адрес. Пожалуйста, подтвердите их, чтобы продолжить.",
      Markup.keyboard([
        Markup.button.contactRequest("📞 Подтвердить номер телефона"),
      ])
        .oneTime()
        .resize()
    );
    return;
  }

  if (/^\+?\d{10,15}$/.test(input)) {
    try {
      const response = await axios.post(
        "https://nonexistent-api.com/phone-info",
        { phoneNumber: input }
      );
      users[userId].phoneNumber = input;
      users[userId].additionalInfo =
        response.data.info || "Информация отсутствует";
      ctx.reply(`Номер телефона записан. Ответ API: ${response.data.info}`);
    } catch (error) {
      ctx.reply(
        "Ошибка при запросе к API для номера телефона. Пожалуйста, попробуйте снова."
      );
      console.error(error);
    }
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const date = new Date(input);
    if (!isNaN(date)) {
      users[userId].dateOfBirth = input;
      ctx.reply(`Дата рождения записана: ${input}`);
    } else {
      ctx.reply("Неверный формат даты. Введите в формате YYYY-MM-DD.");
    }
  } else if (/^[А-Яа-я\s]+$/.test(input)) {
    try {
      const response = await axios.post(
        "https://nonexistent-api.com/fio-info",
        { fio: input }
      );
      users[userId].lastName = input;
      users[userId].additionalInfo =
        response.data.info || "Информация отсутствует";
      ctx.reply(`ФИО записано. Ответ API: ${response.data.info}`);
    } catch (error) {
      ctx.reply(
        "Ошибка при запросе к API для ФИО. Пожалуйста, попробуйте снова."
      );
      console.error(error);
    }
  } else if (/^\d{11}$/.test(input)) {
    try {
      const response = await axios.post(
        "https://nonexistent-api.com/snils-info",
        { snils: input }
      );
      users[userId].additionalInfo = input;
      ctx.reply(`СНИЛС записан. Ответ API: ${response.data.info}`);
    } catch (error) {
      ctx.reply(
        "Ошибка при запросе к API для СНИЛС. Пожалуйста, попробуйте снова."
      );
      console.error(error);
    }
  } else if (/^\d{4}\s\d{6}$/.test(input)) {
    try {
      const response = await axios.post(
        "https://nonexistent-api.com/passport-info",
        { passport: input }
      );
      users[userId].additionalInfo = input;
      ctx.reply(`Паспорт записан. Ответ API: ${response.data.info}`);
    } catch (error) {
      ctx.reply(
        "Ошибка при запросе к API для паспорта. Пожалуйста, попробуйте снова."
      );
      console.error(error);
    }
  } else if (/^[А-Яа-яA-Za-z0-9\-]+$/.test(input)) {
    try {
      const response = await axios.post(
        "https://nonexistent-api.com/vehicle-info",
        { vehicleNumber: input }
      );
      users[userId].additionalInfo = input;
      ctx.reply(
        `Номер транспортного средства записан. Ответ API: ${response.data.info}`
      );
    } catch (error) {
      ctx.reply(
        "Ошибка при запросе к API для номера транспортного средства. Пожалуйста, попробуйте снова."
      );
      console.error(error);
    }
  } else if (/^@[A-Za-z0-9_]+$/.test(input)) {
    try {
      const response = await axios.get(
        `https://nonexistent-api.com/socials?username=${encodeURIComponent(
          input
        )}`
      );
      users[userId].socialAccounts =
        response.data.socials || "Социальные сети не найдены";
      ctx.reply(
        `Социальные сети для username ${input}: ${JSON.stringify(
          response.data.socials,
          null,
          2
        )}`
      );
    } catch (error) {
      ctx.reply(
        "Ошибка при запросе к API для username. Пожалуйста, попробуйте снова."
      );
      console.error(error);
    }
  } else {
    ctx.reply("Неверный формат данных. Попробуйте снова.");
  }
});

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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
