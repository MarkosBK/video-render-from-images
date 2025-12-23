import { videoRenderer } from "@/services/video-renderer";
import { useVideoStore } from "@/stores/video-store";
import { getRenderingStatusText } from "@/utils/video-helpers";
import { useState } from "react";

/**
 * Хук для управления процессом рендеринга видео
 */
export function useVideoRendering() {
  const {
    images,
    resolution,
    imageDuration,
    transitionType,
    setProgress,
    setIsRendering,
    setOutputVideoUri,
    setError,
    setCurrentStep,
  } = useVideoStore();

  const [statusText, setStatusText] = useState("Подготовка к рендерингу...");
  const [isCancelling, setIsCancelling] = useState(false);

  const startRendering = async () => {
    try {
      setIsRendering(true);
      setError(null);
      setProgress(0);
      setStatusText("Рендеринг видео...");

      const outputUri = await videoRenderer.createVideo(
        images,
        { resolution, imageDuration, transitionType },
        (progress) => {
          setProgress(progress);
          setStatusText(getRenderingStatusText(progress));
        },
      );

      setOutputVideoUri(outputUri);
      setStatusText("Готово!");
      setProgress(100);
      setIsRendering(false);

      setTimeout(() => setCurrentStep(3), 500);
      return { showError: false };
    } catch (error) {
      setIsRendering(false);
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";
      setError(errorMessage);
      setStatusText("Ошибка рендеринга");

      if (!errorMessage.includes("отменен")) {
        return { showError: true, errorMessage };
      }
      return { showError: false };
    }
  };

  const cancelRendering = async () => {
    setIsCancelling(true);
    try {
      await videoRenderer.cancel();
      setIsRendering(false);
      setCurrentStep(1);
    } finally {
      setIsCancelling(false);
    }
  };

  return {
    statusText,
    isCancelling,
    startRendering,
    cancelRendering,
  };
}
