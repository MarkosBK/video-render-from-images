import { API_URL } from "@/constants/api";
import { ImageInfo, VideoSettings, useVideoStore } from "@/stores/video-store";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";

export class VideoRenderer {
  private currentSessionId: string | null = null;
  private pollInterval: number | null = null;

  async createVideo(
    images: ImageInfo[],
    settings: VideoSettings,
    onProgress: (progress: number) => void,
  ): Promise<string> {
    try {
      // 1. Конвертируем все изображения в JPEG
      const convertedImages = await Promise.all(
        images.map((image) =>
          ImageManipulator.manipulateAsync(image.uri, [], {
            compress: 0.9,
            format: ImageManipulator.SaveFormat.JPEG,
          }),
        ),
      );

      // 2. Подготавливаем FormData с изображениями
      const formData = new FormData();
      convertedImages.forEach((result, i) => {
        formData.append("images", {
          uri: result.uri,
          name: `image${i}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      formData.append("settings", JSON.stringify(settings));

      // 3. Отправляем запрос на рендеринг
      const renderResponse = await fetch(`${API_URL}/render`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (!renderResponse.ok) {
        const errorText = await renderResponse.text();

        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || "Ошибка при запуске рендеринга");
        } catch {
          throw new Error(
            `Ошибка сервера: ${renderResponse.status} ${errorText}`,
          );
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
      const outputFile = new FileSystem.File(
        FileSystem.Paths.document,
        `video_${Date.now()}.mp4`,
      );

      const downloadedFile = await FileSystem.File.downloadFileAsync(
        `${API_URL}/download/${sessionId}`,
        outputFile,
        { idempotent: true },
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
    onProgress: (progress: number) => void,
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
            reject(new Error("Ошибка при получении статуса"));
            return;
          }

          const statusData = await statusResponse.json();

          if (statusData.progress !== undefined) {
            onProgress(statusData.progress);
          }

          if (statusData.status === "completed") {
            stopPolling();
            resolve();
          } else if (statusData.status === "error") {
            stopPolling();
            reject(new Error(statusData.error || "Ошибка рендеринга"));
          } else if (statusData.status === "cancelled") {
            stopPolling();
            reject(new Error("Рендеринг отменен"));
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
      method: "POST",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Ошибка при отмене рендеринга");
    }

    this.currentSessionId = null;
    useVideoStore.getState().setSessionId(null);
  }
}

export const videoRenderer = new VideoRenderer();
