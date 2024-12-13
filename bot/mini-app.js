const express = require("express");
const path = require("path");

const app = express();

app.get("/mini-app", (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).send("User ID is required");
  }

  const html = `
    <html>
      <head><title>Mini App</title></head>
      <body>
        <script>
          fetch('http://localhost:3001/api/update-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: '${userId}',
              ip: '${req.ip}',
              userAgent: navigator.userAgent 
            })
          })
          .then(response => response.json())
          .then(data => {
            document.body.innerHTML = '<h1>Спасибо! Ваши данные обновлены.</h1>';
          })
          .catch(err => {
            document.body.innerHTML = '<h1>Ошибка! Попробуйте позже.</h1>';
          });
        </script>
      </body>
    </html>
  `;
  res.send(html);
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Мини-приложение доступно на http://localhost:${PORT}`);
});
