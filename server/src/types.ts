export interface VideoSettings {
  resolution: "720p" | "1080p";
  imageDuration: 2 | 3 | 4 | 5;
  transitionType: "crossfade" | "kenburns" | "slide" | "zoom";
}

export interface RenderSession {
  id: string;
  status: "processing" | "completed" | "error" | "cancelled";
  progress: number;
  videoPath?: string;
  imagePaths?: string[]; // Пути к загруженным изображениям для очистки
  error?: string;
  createdAt: Date;
}

export interface RenderJob {
  sessionId: string;
  imagePaths: string[];
  settings: VideoSettings;
  outputPath: string;
}
