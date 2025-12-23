import { VideoSettings } from "../types";

/**
 * Валидирует настройки видео
 */
export function validateSettings(settings: any): settings is VideoSettings {
  if (!settings || typeof settings !== "object") {
    return false;
  }

  if (!["720p", "1080p"].includes(settings.resolution)) {
    return false;
  }

  if (![2, 3, 4, 5].includes(settings.imageDuration)) {
    return false;
  }

  if (
    !["crossfade", "kenburns", "slide", "zoom"].includes(
      settings.transitionType,
    )
  ) {
    return false;
  }

  return true;
}

/**
 * Валидирует количество изображений
 */
export function validateImageCount(count: number): {
  valid: boolean;
  error?: string;
} {
  if (count < 3) {
    return {
      valid: false,
      error: "Необходимо загрузить минимум 3 изображения",
    };
  }

  if (count > 5) {
    return {
      valid: false,
      error: "Максимум 5 изображений",
    };
  }

  return { valid: true };
}
