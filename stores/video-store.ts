import { deleteVideoOnServer } from "@/utils/api-client";
import * as ImagePicker from "expo-image-picker";
import { create } from "zustand";

export interface ImageInfo {
  uri: string;
  width: number;
  height: number;
}

export interface VideoSettings {
  resolution: "720p" | "1080p";
  imageDuration: 2 | 3 | 4;
  transitionType: "crossfade" | "kenburns" | "slide" | "zoom";
}

interface VideoStore {
  // Выбранные изображения
  images: ImageInfo[];

  // Настройки
  resolution: "720p" | "1080p";
  imageDuration: 2 | 3 | 4;
  transitionType: "crossfade" | "kenburns" | "slide" | "zoom";

  // Состояние рендеринга
  isRendering: boolean;
  progress: number; // 0-100
  outputVideoUri: string | null;
  sessionId: string | null; // ID сессии на сервере для cleanup
  error: string | null;

  // Текущий шаг
  currentStep: number; // 0-3

  // Actions
  addImages: (images: ImagePicker.ImagePickerAsset[]) => void;
  removeImage: (index: number) => void;
  setResolution: (resolution: "720p" | "1080p") => void;
  setImageDuration: (duration: 2 | 3 | 4) => void;
  setTransitionType: (
    type: "crossfade" | "kenburns" | "slide" | "zoom",
  ) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setProgress: (progress: number) => void;
  setIsRendering: (isRendering: boolean) => void;
  setOutputVideoUri: (uri: string | null) => void;
  setSessionId: (sessionId: string | null) => void;
  setError: (error: string | null) => void;
  resetAll: () => void;
}

const initialState = {
  images: [],
  resolution: "1080p" as const,
  imageDuration: 3 as const,
  transitionType: "crossfade" as const,
  isRendering: false,
  progress: 0,
  outputVideoUri: null,
  sessionId: null,
  error: null,
  currentStep: 0,
};

export const useVideoStore = create<VideoStore>((set) => ({
  ...initialState,

  addImages: (pickerImages) =>
    set((state) => {
      const newImages: ImageInfo[] = pickerImages.map((img) => ({
        uri: img.uri,
        width: img.width,
        height: img.height,
      }));
      return {
        images: [...state.images, ...newImages].slice(0, 5), // Максимум 5 изображений
        error: null,
      };
    }),

  removeImage: (index) =>
    set((state) => ({
      images: state.images.filter((_, i) => i !== index),
    })),

  setResolution: (resolution) => set({ resolution }),

  setImageDuration: (imageDuration) => set({ imageDuration }),

  setTransitionType: (transitionType) => set({ transitionType }),

  setCurrentStep: (currentStep) => set({ currentStep }),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, 3),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 0),
    })),

  setProgress: (progress) => set({ progress }),

  setIsRendering: (isRendering) => set({ isRendering }),

  setOutputVideoUri: (outputVideoUri) => set({ outputVideoUri }),

  setSessionId: (sessionId) => set({ sessionId }),

  setError: (error) => set({ error }),

  resetAll: () =>
    set((state) => {
      if (state.sessionId) {
        deleteVideoOnServer(state.sessionId);
      }
      return initialState;
    }),
}));
