import { ChildProcess } from "child_process";
import { RenderJob } from "../types";
import { runFFmpegProcess } from "../utils/ffmpeg-runner";

export class VideoRendererService {
  private activeSessions = new Map<string, ChildProcess>();

  async renderVideo(
    job: RenderJob,
    onProgress: (progress: number) => void,
  ): Promise<string> {
    const { sessionId, imagePaths, settings, outputPath } = job;
    const { resolution, imageDuration, transitionType } = settings;

    const dimensions = resolution === "720p" ? "1280x720" : "1920x1080";
    const [width, height] = dimensions.split("x").map(Number);
    const transitionDuration = 0.5;
    const fps = 30;

    // Строим базовый filter_complex для масштабирования всех входов
    let scaleFilters = "";
    for (let i = 0; i < imagePaths.length; i++) {
      scaleFilters += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[v${i}];`;
    }

    let filterComplex = scaleFilters;
    let args: string[] = [];
    let totalDuration: number;

    // Строим inputs и filter_complex в зависимости от типа перехода
    if (transitionType === "crossfade" || transitionType === "slide") {
      const transition = transitionType === "crossfade" ? "fade" : "slideleft";

      // Добавляем переходы xfade
      for (let i = 0; i < imagePaths.length - 1; i++) {
        const offset = imageDuration * (i + 1) - transitionDuration;
        if (i === 0) {
          filterComplex += `[v${i}][v${i + 1}]xfade=transition=${transition}:duration=${transitionDuration}:offset=${offset}[vf${i}]`;
        } else {
          filterComplex += `;[vf${i - 1}][v${i + 1}]xfade=transition=${transition}:duration=${transitionDuration}:offset=${offset}[vf${i}]`;
        }
      }

      // Добавляем inputs с увеличенной длительностью
      imagePaths.forEach((imagePath) => {
        args.push(
          "-loop",
          "1",
          "-t",
          (imageDuration + transitionDuration).toString(),
          "-i",
          imagePath,
        );
      });

      totalDuration =
        imageDuration * imagePaths.length -
        transitionDuration * (imagePaths.length - 1);

      args.push(
        "-y",
        "-stats_period",
        "0.5",
        "-filter_complex",
        filterComplex,
        "-map",
        `[vf${imagePaths.length - 2}]`,
        "-pix_fmt",
        "yuv420p",
        "-c:v",
        "libx264",
        outputPath,
      );
    } else if (transitionType === "zoom") {
      const frames = imageDuration * fps;

      // Zoom filter для каждого изображения
      let zoomFilterComplex = "";
      for (let i = 0; i < imagePaths.length; i++) {
        zoomFilterComplex += `[${i}:v]select=eq(n\\,0),scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0015,1.5)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${fps},setsar=1[v${i}];`;
      }

      // Concat объединяет все обработанные входы
      zoomFilterComplex +=
        imagePaths.map((_, i) => `[v${i}]`).join("") +
        `concat=n=${imagePaths.length}:v=1:a=0[outv]`;

      filterComplex = zoomFilterComplex;
      totalDuration = imageDuration * imagePaths.length;

      imagePaths.forEach((imagePath) => {
        args.push(
          "-loop",
          "1",
          "-t",
          imageDuration.toString(),
          "-i",
          imagePath,
        );
      });

      args.push(
        "-y",
        "-stats_period",
        "0.5",
        "-filter_complex",
        filterComplex,
        "-map",
        "[outv]",
        "-t",
        totalDuration.toString(),
        "-pix_fmt",
        "yuv420p",
        "-c:v",
        "libx264",
        outputPath,
      );
    } else if (transitionType === "kenburns") {
      const frames = (imageDuration + transitionDuration) * fps;

      // Ken Burns filter для каждого изображения
      let kbFilterComplex = "";
      for (let i = 0; i < imagePaths.length; i++) {
        const zoomIn = i % 2 === 0;
        const zoomExpr = zoomIn
          ? `'if(lte(zoom,1.0),1.0,max(1.0,zoom-0.002))'`
          : `'min(zoom+0.002,1.3)'`;

        kbFilterComplex += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,zoompan=z=${zoomExpr}:d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${fps},setsar=1[v${i}];`;
      }

      // Добавляем переходы xfade
      for (let i = 0; i < imagePaths.length - 1; i++) {
        const offset = imageDuration * (i + 1) - transitionDuration;
        if (i === 0) {
          kbFilterComplex += `[v${i}][v${i + 1}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[vf${i}]`;
        } else {
          kbFilterComplex += `;[vf${i - 1}][v${i + 1}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[vf${i}]`;
        }
      }

      filterComplex = kbFilterComplex;
      totalDuration =
        imageDuration * imagePaths.length -
        transitionDuration * (imagePaths.length - 1);

      imagePaths.forEach((imagePath) => {
        args.push(
          "-loop",
          "1",
          "-t",
          imageDuration.toString(),
          "-i",
          imagePath,
        );
      });

      args.push(
        "-y",
        "-stats_period",
        "0.5",
        "-filter_complex",
        filterComplex,
        "-map",
        `[vf${imagePaths.length - 2}]`,
        "-t",
        totalDuration.toString(),
        "-pix_fmt",
        "yuv420p",
        "-c:v",
        "libx264",
        outputPath,
      );
    } else {
      throw new Error(`Неизвестный тип перехода: ${transitionType}`);
    }

    return runFFmpegProcess({
      args,
      sessionId,
      totalDuration,
      outputPath,
      fps,
      onProgress,
      activeSessions: this.activeSessions,
    });
  }

  cancelRendering(sessionId: string): boolean {
    const process = this.activeSessions.get(sessionId);
    if (process) {
      process.kill("SIGKILL");
      this.activeSessions.delete(sessionId);
      return true;
    }
    return false;
  }
}
