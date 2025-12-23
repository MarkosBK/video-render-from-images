import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { VideoRendererService } from '../services/renderer';
import { RenderSession, VideoSettings } from '../types';
import {
  deleteFileIfExists,
  deleteFiles,
  ensureDirectoryExists,
  fileExists,
  getVideoPath,
} from '../utils/file-utils';
import { validateImageCount, validateSettings } from '../utils/validation';

const router = express.Router();
const renderer = new VideoRendererService();

// Хранилище активных сессий
const sessions = new Map<string, RenderSession>();

// Настройка Multer для загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    ensureDirectoryExists(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB на файл
  },
  fileFilter: (req, file, cb) => {
    // Принимаем только поддерживаемые форматы изображений
    // HEIC/HEIF не поддерживаются
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/octet-stream', // React Native иногда отправляет так
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Неподдерживаемый формат изображения: ${file.mimetype}. HEIC/HEIF не поддерживаются.`
        )
      );
    }
  },
});

// POST /api/render - Начать рендеринг видео
router.post('/render', upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'Необходимо загрузить изображения',
      });
    }

    // Валидация количества изображений
    const countValidation = validateImageCount(files.length);
    if (!countValidation.valid) {
      return res.status(400).json({ error: countValidation.error });
    }

    // Парсим и валидируем настройки
    const settingsJson = req.body.settings;
    let settings: VideoSettings;

    try {
      const parsed = JSON.parse(settingsJson);
      if (!validateSettings(parsed)) {
        return res.status(400).json({
          error: 'Неверный формат настроек',
        });
      }
      settings = parsed;
    } catch {
      return res.status(400).json({
        error: 'Неверный формат настроек',
      });
    }

    // Создаем сессию
    const sessionId = uuidv4();

    const outputDir = process.env.OUTPUT_DIR || './output';
    ensureDirectoryExists(outputDir);

    const outputPath = getVideoPath(sessionId);

    // Запускаем рендеринг асинхронно с использованием оригинальных изображений
    const imagePaths = files.map((f) => f.path);

    const session: RenderSession = {
      id: sessionId,
      status: 'processing',
      progress: 0,
      imagePaths, // Сохраняем пути для очистки
      createdAt: new Date(),
    };

    sessions.set(sessionId, session);

    renderer
      .renderVideo(
        {
          sessionId,
          imagePaths,
          settings,
          outputPath,
        },
        (progress) => {
          const session = sessions.get(sessionId);
          if (session) {
            session.progress = progress;
          }
        }
      )
      .then(() => {
        const session = sessions.get(sessionId);
        if (session) {
          session.status = 'completed';
          session.progress = 100;
          session.videoPath = outputPath;
        }

        // Очистка загруженных изображений
        deleteFiles(imagePaths);
      })
      .catch((error) => {
        const session = sessions.get(sessionId);
        if (session) {
          session.status = 'error';
          session.error = error.message;
        }

        // Удаляем видео файл если он был создан
        const videoPath = getVideoPath(sessionId);
        deleteFileIfExists(videoPath);

        // Очистка загруженных изображений
        deleteFiles(imagePaths);
      });

    res.json({
      sessionId,
      message: 'Рендеринг запущен',
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message || 'Внутренняя ошибка сервера',
    });
  }
});

// GET /api/status/:sessionId - Получить статус рендеринга
router.get('/status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      error: 'Сессия не найдена',
    });
  }

  res.json({
    status: session.status,
    progress: session.progress,
    error: session.error,
  });
});

// GET /api/download/:sessionId - Скачать готовое видео
router.get('/download/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      error: 'Сессия не найдена',
    });
  }

  if (session.status !== 'completed') {
    return res.status(400).json({
      error: 'Видео еще не готово',
      status: session.status,
    });
  }

  if (!session.videoPath || !fileExists(session.videoPath)) {
    return res.status(404).json({
      error: 'Файл видео не найден',
    });
  }

  res.download(session.videoPath, 'video.mp4', (err) => {
    if (!err) {
      // Очистка после успешной загрузки
      setTimeout(() => {
        if (session.videoPath) {
          deleteFileIfExists(session.videoPath);
        }
        sessions.delete(sessionId);
      }, 5000);
    }
  });
});

// DELETE /api/video/:sessionId - Удалить видео и сессию
router.delete('/video/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      error: 'Сессия не найдена',
    });
  }

  // Удаляем видео файл если он существует
  const videoPath = session.videoPath || getVideoPath(sessionId);
  deleteFileIfExists(videoPath);

  // Удаляем изображения если они есть
  if (session.imagePaths) {
    deleteFiles(session.imagePaths);
  }

  // Удаляем сессию
  sessions.delete(sessionId);

  res.json({
    message: 'Видео и сессия удалены',
  });
});

// POST /api/cancel/:sessionId - Отменить рендеринг
router.post('/cancel/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      error: 'Сессия не найдена',
    });
  }

  if (session.status !== 'processing') {
    return res.status(400).json({
      error: 'Сессия уже завершена или отменена',
    });
  }

  const cancelled = renderer.cancelRendering(sessionId);

  if (cancelled) {
    session.status = 'cancelled';

    // Удаляем видео файл если он существует (может быть частично создан)
    const videoPath = session.videoPath || getVideoPath(sessionId);
    deleteFileIfExists(videoPath);

    // Очищаем загруженные изображения
    if (session.imagePaths) {
      deleteFiles(session.imagePaths);
    }

    res.json({
      message: 'Рендеринг отменен',
    });
  } else {
    res.status(500).json({
      error: 'Не удалось отменить рендеринг',
    });
  }
});

export default router;
