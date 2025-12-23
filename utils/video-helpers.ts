import { VideoSettings } from "@/stores/video-store";

/**
 * Вычисляет приблизительную длительность видео
 */
export function calculateEstimatedDuration(
  imageCount: number,
  imageDuration: number,
  transitionDuration: number = 0.5,
): number {
  return imageCount * imageDuration - (imageCount - 1) * transitionDuration;
}

/**
 * Получает текстовое название типа перехода
 */
export function getTransitionLabel(
  transitionType: VideoSettings["transitionType"],
): string {
  const labels: Record<VideoSettings["transitionType"], string> = {
    crossfade: "Crossfade",
    kenburns: "Ken Burns",
    slide: "Slide",
    zoom: "Zoom",
  };
  return labels[transitionType];
}

/**
 * Получает разрешение в формате W×H
 */
export function getResolutionText(resolution: "720p" | "1080p"): string {
  return resolution === "720p" ? "1280×720" : "1920×1080";
}

/**
 * Получает текст статуса рендеринга на основе прогресса
 */
export function getRenderingStatusText(progress: number): string {
  if (progress < 30) return "Обработка изображений...";
  if (progress < 70) return "Применение переходов...";
  if (progress < 95) return "Финализация видео...";
  return "Почти готово...";
}
