import { API_URL } from "@/constants/api";

/**
 * Удаляет видео на сервере по sessionId
 */
export async function deleteVideoOnServer(sessionId: string): Promise<void> {
  try {
    await fetch(`${API_URL}/video/${sessionId}`, {
      method: "DELETE",
    });
  } catch {
    // Игнорируем ошибки при удалении
  }
}
