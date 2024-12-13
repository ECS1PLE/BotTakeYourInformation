const { Telegraf, Markup } = require("telegraf");
const schedule = require("node-schedule");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const bot = new Telegraf("YOUR_KEY");

const users = {};

bot.start((ctx) => {
  const { id, first_name, last_name, username } = ctx.message.from;
  users[id] = {
    firstName: first_name || "Не указано",
    lastName: last_name || "Не указано",
    username: username || "Не указано",
    date: null,
    ip: "Не определён",
    location: "Не определена",
    userAgent: "Не определён",
    phoneNumber: null,
  };

  ctx.reply(
    "Привет! Подтвердите свой номер телефона, чтобы продолжить.",
    Markup.keyboard([
      Markup.button.contactRequest("📞 Подтвердить номер телефона"),
    ])
      .oneTime()
      .resize()
  );
});

bot.on("contact", (ctx) => {
  const userId = ctx.message.from.id;
  const phoneNumber = ctx.message.contact.phone_number;

  if (users[userId]) {
    users[userId].phoneNumber = phoneNumber;
    ctx.reply(
      "Ваш номер успешно подтверждён. Теперь вы можете пользоваться ботом."
    );
  }
});

bot.on("text", (ctx) => {
  const userId = ctx.message.from.id;

  if (!users[userId] || !users[userId].phoneNumber) {
    return ctx.reply(
      "Вы не подтвердили номер телефона. Пожалуйста, подтвердите его, чтобы продолжить.",
      Markup.keyboard([
        Markup.button.contactRequest("📞 Подтвердить номер телефона"),
      ])
        .oneTime()
        .resize()
    );
  }

  const dateInput = ctx.message.text;
  const date = new Date(dateInput);

  if (isNaN(date)) {
    return ctx.reply(
      "Неверный формат даты. Введите дату в формате YYYY-MM-DD."
    );
  }

  users[userId].date = date;
  ctx.reply(
    `Дата ${dateInput} сохранена. Напоминания начнут приходить ежедневно в 12:00.`
  );
});

const fetchUserIpAndLocation = async (userId) => {
  try {
    const response = await axios.get("http://ip-api.com/json/");
    const { query: ip, city, regionName, country } = response.data;

    if (users[userId]) {
      users[userId].ip = ip;
      users[userId].location = `${city}, ${regionName}, ${country}`;
    }
  } catch (error) {
    console.error("Ошибка получения IP-адреса:", error.message);
  }
};

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post("/api/update-ip", async (req, res) => {
  const { userId } = req.body;

  if (!users[userId]) {
    return res
      .status(404)
      .json({ success: false, message: "Пользователь не найден" });
  }

  await fetchUserIpAndLocation(userId);
  res.json({ success: true, user: users[userId] });
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
