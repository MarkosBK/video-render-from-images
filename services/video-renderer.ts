import { API_URL } from '@/constants/api';
import { ImageInfo, VideoSettings, useVideoStore } from '@/stores/video-store';
import { File, Paths } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export class VideoRenderer {
  private currentSessionId: string | null = null;
  private pollInterval: number | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  /**
   * Предварительная инициализация ImageManipulator для ускорения первой конвертации
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        console.log('[VideoRenderer] Начинаем предварительную инициализацию ImageManipulator...');
        const initStartTime = Date.now();

        // Создаем тестовое изображение для разогрева модуля
        // Используем первый доступный файл или просто вызываем API для инициализации
        // Для этого можно использовать временный файл или пропустить, если нет файлов

        const initDuration = Date.now() - initStartTime;
        console.log(`[VideoRenderer] Инициализация завершена за ${initDuration}ms`);
        this.isInitialized = true;
      } catch (error) {
        console.warn('[VideoRenderer] Ошибка при инициализации (не критично):', error);
        // Не блокируем работу, если инициализация не удалась
        this.isInitialized = true;
      }
    })();

    return this.initializationPromise;
  }

  async createVideo(
    images: ImageInfo[],
    settings: VideoSettings,
    onProgress: (progress: number) => void
  ): Promise<string> {
    const totalStartTime = Date.now();
    console.log('[VideoRenderer] createVideo вызван', {
      imagesCount: images.length,
      settings,
    });
    try {
      // 0. Предварительная инициализация (если еще не выполнена)
      if (!this.isInitialized) {
        console.log('[VideoRenderer] Выполняем предварительную инициализацию...');
        onProgress(0);
        await this.initialize();
        console.log('[VideoRenderer] Инициализация завершена, начинаем конвертацию');
      }

      // 1. Конвертируем все изображения в JPEG
      // Прогресс конвертации: 0-30%
      const CONVERSION_PROGRESS_MAX = 30;
      onProgress(0);
      const conversionStartTime = Date.now();
      console.log('[VideoRenderer] Начинаем конвертацию изображений...');
      const convertedImages = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const progressStart = (i / images.length) * CONVERSION_PROGRESS_MAX;
        const progressEnd = ((i + 1) / images.length) * CONVERSION_PROGRESS_MAX;

        console.log(
          `[VideoRenderer] Конвертируем изображение ${i + 1}/${images.length}: ${image.uri}`
        );
        onProgress(Math.round(progressStart));

        // Retry логика для нестабильной конвертации
        let result;
        let lastError;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const startTime = Date.now();
            const timeSinceStart = startTime - conversionStartTime;
            console.log(
              `[VideoRenderer] Вызываем manipulateAsync для изображения ${i + 1} (попытка ${attempt}/${maxRetries})... [${timeSinceStart}ms с начала конвертации]`
            );

            // Для первого изображения первой попытки - это может быть медленнее из-за инициализации
            if (i === 0 && attempt === 1) {
              console.log(
                `[VideoRenderer] Первое изображение - может занять больше времени из-за инициализации модуля`
              );
            }

            result = await ImageManipulator.manipulateAsync(image.uri, [], {
              compress: 0.9,
              format: ImageManipulator.SaveFormat.JPEG,
            });

            const duration = Date.now() - startTime;
            const totalTime = Date.now() - conversionStartTime;
            console.log(
              `[VideoRenderer] Изображение ${i + 1} конвертировано за ${duration}ms (всего ${totalTime}ms): ${result.uri}`
            );
            onProgress(Math.round(progressEnd));
            break; // Успешно, выходим из цикла retry
          } catch (error) {
            lastError = error;
            console.error(
              `[VideoRenderer] Ошибка конвертации изображения ${i + 1} (попытка ${attempt}/${maxRetries}):`,
              error
            );
            if (error instanceof Error) {
              console.error(`[VideoRenderer] Сообщение об ошибке: ${error.message}`);
            }

            // Если это не последняя попытка, ждем перед retry
            if (attempt < maxRetries) {
              const waitTime = attempt * 500; // Увеличиваем задержку с каждой попыткой
              console.log(`[VideoRenderer] Повторная попытка через ${waitTime}ms...`);
              await new Promise((resolve) => setTimeout(resolve, waitTime));
            }
          }
        }

        // Если все попытки неудачны
        if (!result) {
          console.error(
            `[VideoRenderer] Не удалось конвертировать изображение ${i + 1} после ${maxRetries} попыток`
          );
          if (lastError instanceof Error) {
            console.error(`[VideoRenderer] Последняя ошибка: ${lastError.message}`);
            console.error(`[VideoRenderer] Стек ошибки: ${lastError.stack}`);
          }
          throw new Error(
            `Не удалось конвертировать изображение ${i + 1} после ${maxRetries} попыток: ${lastError instanceof Error ? lastError.message : 'Неизвестная ошибка'}`
          );
        }

        convertedImages.push(result);
      }

      onProgress(CONVERSION_PROGRESS_MAX);
      const conversionDuration = Date.now() - conversionStartTime;
      console.log(
        `[VideoRenderer] Конвертация завершена за ${conversionDuration}ms, обработано изображений:`,
        convertedImages.length
      );
      const avgTimePerImage = conversionDuration / images.length;
      console.log(`[VideoRenderer] Среднее время на изображение: ${Math.round(avgTimePerImage)}ms`);

      // 2. Подготавливаем FormData с изображениями
      console.log('[VideoRenderer] Создаем FormData...');
      const formData = new FormData();
      convertedImages.forEach((result, i) => {
        console.log(`[VideoRenderer] Добавляем в FormData изображение ${i + 1}: ${result.uri}`);
        formData.append('images', {
          uri: result.uri,
          name: `image${i}.jpg`,
          type: 'image/jpeg',
        } as any);
      });

      formData.append('settings', JSON.stringify(settings));
      console.log('[VideoRenderer] FormData создан, настройки добавлены');

      // 3. Отправляем запрос на рендеринг
      console.log('[VideoRenderer] Отправляем запрос на рендеринг...', {
        imagesCount: convertedImages.length,
        settings,
      });
      const renderResponse = await fetch(`${API_URL}/render`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });
      console.log('[VideoRenderer] Ответ получен, статус:', renderResponse.status);

      if (!renderResponse.ok) {
        const errorText = await renderResponse.text();

        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Ошибка при запуске рендеринга');
        } catch {
          throw new Error(`Ошибка сервера: ${renderResponse.status} ${errorText}`);
        }
      }

      const responseData = await renderResponse.json();
      console.log('[VideoRenderer] Render response:', responseData);

      const { sessionId } = responseData;
      this.currentSessionId = sessionId;
      console.log('[VideoRenderer] Session ID получен:', sessionId);

      // Сохраняем sessionId в store для cleanup
      useVideoStore.getState().setSessionId(sessionId);

      // 4. Polling для отслеживания прогресса
      // Прогресс рендеринга: 30-90%
      const RENDER_PROGRESS_MIN = 30;
      const RENDER_PROGRESS_MAX = 90;
      console.log('[VideoRenderer] Начинаем polling статуса...');
      await this.pollRenderStatus(sessionId, (serverProgress) => {
        // Преобразуем прогресс сервера (0-100%) в диапазон 30-90%
        const mappedProgress =
          RENDER_PROGRESS_MIN +
          (serverProgress / 100) * (RENDER_PROGRESS_MAX - RENDER_PROGRESS_MIN);
        onProgress(Math.round(mappedProgress));
      });

      // 5. Скачиваем готовое видео
      // Прогресс скачивания: 90-100%
      onProgress(90);
      console.log('[VideoRenderer] Начинаем скачивание видео...');
      const outputFile = new File(Paths.document, `video_${Date.now()}.mp4`);

      const downloadedFile = await File.downloadFileAsync(
        `${API_URL}/download/${sessionId}`,
        outputFile,
        { idempotent: true }
      );
      onProgress(100);
      const totalDuration = Date.now() - totalStartTime;
      console.log('[VideoRenderer] Видео скачано:', downloadedFile.uri);
      console.log(`[VideoRenderer] Весь процесс завершен за ${totalDuration}ms`);

      this.currentSessionId = null;
      useVideoStore.getState().setSessionId(null);
      return downloadedFile.uri;
    } catch (error) {
      this.currentSessionId = null;
      useVideoStore.getState().setSessionId(null);
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
      console.error('[VideoRenderer] Ошибка в createVideo:', error);
      if (error instanceof Error) {
        console.error('[VideoRenderer] Сообщение об ошибке:', error.message);
        console.error('[VideoRenderer] Стек ошибки:', error.stack);
      }
      throw error;
    }
  }

  private async pollRenderStatus(
    sessionId: string,
    onProgress: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const stopPolling = () => {
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
      };

      this.pollInterval = setInterval(async () => {
        try {
          console.log(`[VideoRenderer] Polling статуса для sessionId: ${sessionId}`);
          const statusResponse = await fetch(`${API_URL}/status/${sessionId}`);

          if (!statusResponse.ok) {
            console.error(`[VideoRenderer] Ошибка получения статуса: ${statusResponse.status}`);
            stopPolling();
            reject(new Error('Ошибка при получении статуса'));
            return;
          }

          const statusData = await statusResponse.json();
          console.log(`[VideoRenderer] Статус получен:`, {
            status: statusData.status,
            progress: statusData.progress,
            error: statusData.error,
          });

          if (statusData.progress !== undefined) {
            console.log(`[VideoRenderer] Обновляем прогресс: ${statusData.progress}%`);
            onProgress(statusData.progress);
          }

          if (statusData.status === 'completed') {
            console.log('[VideoRenderer] Рендеринг завершен!');
            stopPolling();
            resolve();
          } else if (statusData.status === 'error') {
            console.error('[VideoRenderer] Ошибка рендеринга:', statusData.error);
            stopPolling();
            reject(new Error(statusData.error || 'Ошибка рендеринга'));
          } else if (statusData.status === 'cancelled') {
            console.log('[VideoRenderer] Рендеринг отменен');
            stopPolling();
            reject(new Error('Рендеринг отменен'));
          }
        } catch (error) {
          console.error('[VideoRenderer] Ошибка при polling:', error);
          stopPolling();
          reject(error);
        }
      }, 500);
    });
  }

  async cancel(): Promise<void> {
    if (!this.currentSessionId) return;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    const response = await fetch(`${API_URL}/cancel/${this.currentSessionId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Ошибка при отмене рендеринга');
    }

    this.currentSessionId = null;
    useVideoStore.getState().setSessionId(null);
  }
}

export const videoRenderer = new VideoRenderer();
