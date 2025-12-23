import fs from "fs";
import path from "path";

/**
 * Проверяет существование файла
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Удаляет файл, если он существует
 */
export function deleteFileIfExists(filePath: string): boolean {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  return false;
}

/**
 * Удаляет массив файлов
 */
export function deleteFiles(filePaths: string[]): void {
  filePaths.forEach((filePath) => {
    deleteFileIfExists(filePath);
  });
}

/**
 * Создает директорию, если она не существует
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Получает путь к видео файлу для сессии
 */
export function getVideoPath(sessionId: string): string {
  const outputDir = process.env.OUTPUT_DIR || "./output";
  return path.join(outputDir, `${sessionId}.mp4`);
}
