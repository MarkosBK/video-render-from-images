import { InfoRow } from "@/components/steps/shared/info-row";
import { SectionHeader } from "@/components/steps/shared/section-header";
import { Button } from "@/components/ui/button";
import { Picker } from "@/components/ui/picker";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useVideoStore } from "@/stores/video-store";
import {
  calculateEstimatedDuration,
  getResolutionText,
} from "@/utils/video-helpers";
import { ScrollView, StyleSheet, View } from "react-native";

const RESOLUTION_OPTIONS = [
  { label: "720p (1280×720)", value: "720p" },
  { label: "1080p (1920×1080)", value: "1080p" },
];

const DURATION_OPTIONS = [
  { label: "2 секунды", value: "2" },
  { label: "3 секунды", value: "3" },
  { label: "4 секунды", value: "4" },
];

const TRANSITION_OPTIONS = [
  { label: "Crossfade (плавное затухание)", value: "crossfade" },
  { label: "Ken Burns (панорамирование + zoom)", value: "kenburns" },
  { label: "Slide (горизонтальное скольжение)", value: "slide" },
  { label: "Zoom (масштабирование)", value: "zoom" },
];

export function SettingsStep() {
  const colors = useThemeColors();
  const {
    resolution,
    imageDuration,
    transitionType,
    images,
    setResolution,
    setImageDuration,
    setTransitionType,
    prevStep,
    setCurrentStep,
  } = useVideoStore();

  const estimatedDuration = calculateEstimatedDuration(
    images.length,
    imageDuration,
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <SectionHeader
        title="Настройки видео"
        subtitle="Настройте параметры экспорта"
      />

      <View style={styles.settings}>
        <Picker
          label="Разрешение"
          value={resolution}
          options={RESOLUTION_OPTIONS}
          onValueChange={(value) => setResolution(value as "720p" | "1080p")}
        />

        <Picker
          label="Длительность показа"
          value={String(imageDuration)}
          options={DURATION_OPTIONS}
          onValueChange={(value) =>
            setImageDuration(Number(value) as 2 | 3 | 4)
          }
        />

        <Picker
          label="Тип перехода"
          value={transitionType}
          options={TRANSITION_OPTIONS}
          onValueChange={(value) =>
            setTransitionType(
              value as "crossfade" | "kenburns" | "slide" | "zoom",
            )
          }
        />
      </View>

      <View
        style={[
          styles.preview,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <InfoRow label="Количество изображений:" value={images.length} />
        <InfoRow
          label="Приблизительная длина:"
          value={`~${estimatedDuration} секунд`}
        />
        <InfoRow label="Разрешение:" value={getResolutionText(resolution)} />
      </View>

      <View style={styles.actions}>
        <Button
          title="Назад"
          onPress={prevStep}
          variant="secondary"
          style={styles.button}
        />
        <Button
          title="Создать видео"
          onPress={() => setCurrentStep(2)}
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
  settings: {
    marginBottom: 24,
  },
  preview: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
    gap: 8,
  },
  actions: {
    gap: 12,
  },
  button: {
    marginHorizontal: 0,
  },
});
