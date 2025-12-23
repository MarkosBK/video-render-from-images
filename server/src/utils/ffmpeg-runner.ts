import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { ChildProcess, spawn } from "child_process";
import { processFFmpegStderr } from "./ffmpeg-progress";

interface RunFFmpegOptions {
  args: string[];
  sessionId: string;
  totalDuration: number;
  outputPath: string;
  fps?: number;
  onProgress: (progress: number) => void;
  activeSessions: Map<string, ChildProcess>;
}

/**
 * Запускает FFmpeg процесс и обрабатывает его вывод
 */
export function runFFmpegProcess(options: RunFFmpegOptions): Promise<string> {
  const {
    args,
    sessionId,
    totalDuration,
    outputPath,
    fps = 30,
    onProgress,
    activeSessions,
  } = options;

  return new Promise((resolve, reject) => {
    const ffmpegProcess = spawn(ffmpegPath.path, args);
    let stderr = "";
    const lastProgress = { value: 0 };

    ffmpegProcess.stderr.on("data", (data) => {
      const chunk = data.toString();
      stderr += chunk;
      processFFmpegStderr(
        chunk,
        totalDuration,
        fps,
        lastProgress,
        onProgress,
        `[Renderer]`,
      );
    });

    ffmpegProcess.on("close", (code) => {
      activeSessions.delete(sessionId);

      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(
          new Error(
            `FFmpeg exited with code ${code}: ${stderr.substring(stderr.length - 500)}`,
          ),
        );
      }
    });

    ffmpegProcess.on("error", (err) => {
      activeSessions.delete(sessionId);
      reject(new Error(`FFmpeg error: ${err.message}`));
    });

    activeSessions.set(sessionId, ffmpegProcess);
  });
}
