import { Button } from "@/components/ui/button";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useVideoStore } from "@/stores/video-store";
import { deleteVideoOnServer } from "@/utils/api-client";
import { saveVideoToGallery, shareVideo } from "@/utils/video-actions";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export function ResultStep() {
  const colors = useThemeColors();
  const { outputVideoUri, sessionId, resetAll } = useVideoStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    return () => {
      if (sessionId) {
        deleteVideoOnServer(sessionId);
      }
    };
  }, [sessionId]);

  const player = useVideoPlayer(outputVideoUri || "", (player) => {
    player.loop = true;
    player.play();
  });

  const handleSaveToGallery = async () => {
    if (!outputVideoUri) return;

    try {
      setIsSaving(true);
      await saveVideoToGallery(outputVideoUri);
      setIsSaved(true);
      Alert.alert("Успешно сохранено", "Видео сохранено в галерею", [
        { text: "OK" },
      ]);
    } catch (error) {
      Alert.alert(
        "Ошибка",
        error instanceof Error ? error.message : "Не удалось сохранить видео",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    if (!outputVideoUri) return;

    try {
      setIsSharing(true);
      await shareVideo(outputVideoUri);
    } catch (error) {
      Alert.alert(
        "Ошибка",
        error instanceof Error ? error.message : "Не удалось поделиться видео",
      );
    } finally {
      setIsSharing(false);
    }
  };

  const handleCreateNew = () => {
    Alert.alert(
      "Создать новое видео?",
      "Текущее видео будет потеряно, если вы его не сохранили.",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Создать новое",
          onPress: resetAll,
        },
      ],
    );
  };

  if (!outputVideoUri) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Видео не найдено
        </Text>
        <Button title="Вернуться в начало" onPress={resetAll} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          Видео готово!
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Посмотрите результат и сохраните или поделитесь им
        </Text>

        <View
          style={[
            styles.videoContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <VideoView
            player={player}
            style={styles.video}
            nativeControls
            contentFit="contain"
            allowsFullscreen
            allowsPictureInPicture
          />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={isSaved ? "Сохранено в галерею ✓" : "Сохранить в галерею"}
          onPress={handleSaveToGallery}
          variant={isSaved ? "secondary" : "primary"}
          disabled={isSaving}
          loading={isSaving}
          style={styles.button}
        />
        <Button
          title="Поделиться"
          onPress={handleShare}
          variant="secondary"
          disabled={isSharing}
          loading={isSharing}
          style={styles.button}
        />
        <Button
          title="Создать новое видео"
          onPress={handleCreateNew}
          variant="secondary"
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  videoContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 16,
  },
  video: {
    flex: 1,
    width: "100%",
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  actions: {
    gap: 12,
  },
  button: {
    marginHorizontal: 0,
  },
});
