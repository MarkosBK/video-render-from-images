/**
 * Парсит прогресс из строки вывода FFmpeg
 */
export function parseFFmpegProgress(
  line: string,
  totalDuration: number,
  fps: number = 30,
): number | null {
  // Формат 1: time=HH:MM:SS.ms
  let timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);

  // Формат 2: time=HH:MM:SS
  if (!timeMatch) {
    timeMatch = line.match(/time=(\d{2}):(\d{2}):(\d{2})/);
  }

  if (timeMatch) {
    const hours = parseFloat(timeMatch[1]);
    const minutes = parseFloat(timeMatch[2]);
    const seconds = parseFloat(timeMatch[3]);
    const ms = timeMatch[4] ? parseFloat(timeMatch[4]) / 100 : 0;
    const currentTime = hours * 3600 + minutes * 60 + seconds + ms;
    return Math.min((currentTime / totalDuration) * 100, 100);
  }

  // Формат 3: frame=XXX (используем для оценки)
  const frameMatch = line.match(/frame=\s*(\d+)/);
  if (frameMatch) {
    const frame = parseInt(frameMatch[1]);
    const totalFrames = totalDuration * fps;
    return Math.min((frame / totalFrames) * 100, 100);
  }

  return null;
}

/**
 * Обрабатывает данные stderr FFmpeg и обновляет прогресс
 */
export function processFFmpegStderr(
  chunk: string,
  totalDuration: number,
  fps: number,
  lastProgress: { value: number },
  onProgress: (progress: number) => void,
  logPrefix: string = "[Renderer]",
): void {
  const lines = chunk.split("\n");

  for (const line of lines) {
    const percent = parseFFmpegProgress(line, totalDuration, fps);

    if (percent !== null && percent > lastProgress.value) {
      lastProgress.value = percent;
      const rounded = Math.round(percent * 100) / 100;
      onProgress(rounded);
    }
  }
}
