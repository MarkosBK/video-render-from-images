import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import videoRouter from "./routes/video";

// Загрузка переменных окружения
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов
app.use((req, res, next) => {
  next();
});

// Routes
app.use("/api", videoRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint не найден",
  });
});

// Error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    res.status(500).json({
      error: err.message || "Внутренняя ошибка сервера",
    });
  },
);

// Запуск сервера
app.listen(PORT, () => {});
