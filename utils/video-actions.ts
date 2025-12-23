import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { requestMediaLibrarySavePermissions } from "./permissions";

/**
 * Сохраняет видео в галерею
 */
export async function saveVideoToGallery(videoUri: string): Promise<void> {
  await requestMediaLibrarySavePermissions();
  const asset = await MediaLibrary.createAssetAsync(videoUri);

  try {
    const album = await MediaLibrary.getAlbumAsync("Video Creator");
    if (album) {
      await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
    } else {
      await MediaLibrary.createAlbumAsync("Video Creator", asset, false);
    }
  } catch {
    // Игнорируем ошибки создания альбома
  }
}

/**
 * Поделиться видео
 */
export async function shareVideo(videoUri: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();

  if (!canShare) {
    throw new Error("Функция шаринга недоступна на этом устройстве");
  }

  await Sharing.shareAsync(videoUri, {
    mimeType: "video/mp4",
    dialogTitle: "Поделиться видео",
  });
}
