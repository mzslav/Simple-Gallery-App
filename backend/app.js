require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan"); // Додали для CloudWatch логів

const imageRoutes = require("./routes/imageRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);

app.use(express.json());

// Логування всіх запитів (дуже корисно для AWS CloudWatch)
app.use(morgan("combined"));

// РОУТИ
app.use("/images", imageRoutes);

// Healthcheck для AWS Elastic Beanstalk (щоб знати, що сервак живий)
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Gallery Lite API running on port ${PORT}`);
});

module.exports = app;