import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";

export async function requestMediaLibraryPermissions() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Необходим доступ к галерее для выбора изображений");
  }
}

export async function requestMediaLibrarySavePermissions() {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== "granted") {
    throw new Error("Необходим доступ для сохранения видео в галерею");
  }
}
