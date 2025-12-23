import { API_URL } from '@/constants/api';
import { ImageInfo, VideoSettings, useVideoStore } from '@/stores/video-store';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export class VideoRenderer {
  private currentSessionId: string | null = null;
  private pollInterval: number | null = null;

  async createVideo(
    images: ImageInfo[],
    settings: VideoSettings,
    onProgress: (progress: number) => void
  ): Promise<string> {
    try {
      // 1. Конвертируем все изображения в JPEG параллельно с таймаутами и retry
      const CONVERSION_TIMEOUT = 30000;
      const MAX_RETRIES = 3;
      const RETRY_DELAY = 1000;
      const maxWidth = settings.resolution === '1080p' ? 1920 : 1280;
      const maxHeight = settings.resolution === '1080p' ? 1080 : 720;

      const convertImage = async (
        image: ImageInfo,
        index: number
      ): Promise<ImageManipulator.ImageResult> => {
        let localUri = image.uri;
        let tempFile: FileSystem.File | null = null;

        // Копируем файл в локальное хранилище для ускорения доступа
        try {
          const localFileName = `temp_image_${index}_${Date.now()}.jpg`;
          tempFile = new FileSystem.File(FileSystem.Paths.cache, localFileName);
          const sourceFile = new FileSystem.File(image.uri);
          sourceFile.copy(tempFile);
          localUri = tempFile.uri;
        } catch {
          // Продолжаем с оригинальным URI
        }

        let lastError: any = null;

        // Retry механизм
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            if (attempt > 1) {
              await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt));
            }

            const conversionPromise = ImageManipulator.manipulateAsync(
              localUri,
              [{ resize: { width: maxWidth, height: maxHeight } }],
              {
                compress: 0.7,
                format: ImageManipulator.SaveFormat.JPEG,
              }
            );

            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => {
                reject(new Error(`Таймаут конвертации изображения ${index + 1}`));
              }, CONVERSION_TIMEOUT);
            });

            const result = await Promise.race([conversionPromise, timeoutPromise]);

            // Удаляем временную копию
            if (tempFile) {
              try {
                tempFile.delete();
              } catch {}
            }

            return result;
          } catch (error: any) {
            lastError = error;
          }
        }

        // Очистка при ошибке
        if (tempFile) {
          try {
            tempFile.delete();
          } catch {}
        }

        throw new Error(
          `Не удалось сконвертировать изображение ${index + 1}: ${lastError?.message || 'Неизвестная ошибка'}`
        );
      };

      const convertedImages = await Promise.all(
        images.map((image, index) => convertImage(image, index))
      );

      // 2. Подготавливаем FormData с изображениями
      const formData = new FormData();
      convertedImages.forEach((result, i) => {
        formData.append('images', {
          uri: result.uri,
          name: `image${i}.jpg`,
          type: 'image/jpeg',
        } as any);
      });

      formData.append('settings', JSON.stringify(settings));

      // 3. Отправляем запрос на рендеринг
      const renderResponse = await fetch(`${API_URL}/render`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

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

      const { sessionId } = responseData;
      this.currentSessionId = sessionId;

      // Сохраняем sessionId в store для cleanup
      useVideoStore.getState().setSessionId(sessionId);

      // 4. Polling для отслеживания прогресса
      await this.pollRenderStatus(sessionId, onProgress);

      // 5. Скачиваем готовое видео
      const outputFile = new FileSystem.File(FileSystem.Paths.document, `video_${Date.now()}.mp4`);

      const downloadedFile = await FileSystem.File.downloadFileAsync(
        `${API_URL}/download/${sessionId}`,
        outputFile,
        { idempotent: true }
      );

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
          const statusResponse = await fetch(`${API_URL}/status/${sessionId}`);

          if (!statusResponse.ok) {
            stopPolling();
            reject(new Error('Ошибка при получении статуса'));
            return;
          }

          const statusData = await statusResponse.json();

          if (statusData.progress !== undefined) {
            onProgress(Math.min(100, Math.max(0, statusData.progress)));
          }

          if (statusData.status === 'completed') {
            stopPolling();
            resolve();
          } else if (statusData.status === 'error') {
            stopPolling();
            reject(new Error(statusData.error || 'Ошибка рендеринга'));
          } else if (statusData.status === 'cancelled') {
            stopPolling();
            reject(new Error('Рендеринг отменен'));
          }
        } catch (error) {
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
