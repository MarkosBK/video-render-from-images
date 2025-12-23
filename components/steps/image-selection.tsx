import { SectionHeader } from "@/components/steps/shared/section-header";
import { Button } from "@/components/ui/button";
import { ImageThumbnail } from "@/components/ui/image-thumbnail";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useVideoStore } from "@/stores/video-store";
import { requestMediaLibraryPermissions } from "@/utils/permissions";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";

export function ImageSelectionStep() {
  const colors = useThemeColors();
  const { images, addImages, removeImage, nextStep } = useVideoStore();
  const [loading, setLoading] = useState(false);

  const canProceed = images.length >= 3 && images.length <= 5;
  const canAddMore = images.length < 5;

  const pickImages = async () => {
    try {
      setLoading(true);
      await requestMediaLibraryPermissions();

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 5 - images.length,
      });

      if (!result.canceled && result.assets.length > 0) {
        addImages(result.assets);
      }
    } catch (error) {
      Alert.alert(
        "Ошибка",
        error instanceof Error
          ? error.message
          : "Не удалось выбрать изображения",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <SectionHeader
        title="Выберите изображения"
        subtitle="От 3 до 5 фотографий для создания видео"
      />

      {images.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Пока нет выбранных изображений
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {images.map((image, index) => (
            <ImageThumbnail
              key={`${image.uri}-${index}`}
              uri={image.uri}
              onRemove={() => removeImage(index)}
            />
          ))}
        </View>
      )}

      <View style={styles.info}>
        <Text style={[styles.infoText, { color: colors.textSecondary }]}>
          Выбрано: {images.length} / 5 изображений
        </Text>
        {images.length < 3 && (
          <Text style={[styles.warningText, { color: "#FF9500" }]}>
            Минимум 3 изображения для продолжения
          </Text>
        )}
      </View>

      <View style={styles.actions}>
        <Button
          title={images.length === 0 ? "Выбрать изображения" : "Добавить еще"}
          onPress={pickImages}
          variant="secondary"
          disabled={!canAddMore}
          loading={loading}
          style={styles.button}
        />
        <Button
          title="Далее"
          onPress={nextStep}
          disabled={!canProceed}
          style={styles.button}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  info: {
    marginTop: 24,
    marginBottom: 16,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    marginBottom: 4,
  },
  warningText: {
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    gap: 12,
    marginTop: 16,
  },
  button: {
    marginHorizontal: 0,
  },
});
