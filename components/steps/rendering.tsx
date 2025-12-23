import { InfoRow } from "@/components/steps/shared/info-row";
import { SectionHeader } from "@/components/steps/shared/section-header";
import { Button } from "@/components/ui/button";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useVideoRendering } from "@/hooks/use-video-rendering";
import { useVideoStore } from "@/stores/video-store";
import {
  calculateEstimatedDuration,
  getResolutionText,
  getTransitionLabel,
} from "@/utils/video-helpers";
import { useEffect } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

export function RenderingStep() {
  const colors = useThemeColors();
  const {
    images,
    resolution,
    imageDuration,
    transitionType,
    progress,
    setCurrentStep,
  } = useVideoStore();

  const { statusText, isCancelling, startRendering, cancelRendering } =
    useVideoRendering();

  useEffect(() => {
    startRendering().then((result) => {
      if (result?.showError) {
        Alert.alert("Ошибка рендеринга", result.errorMessage, [
          { text: "Попробовать снова", onPress: startRendering },
          { text: "Назад", onPress: () => setCurrentStep(1), style: "cancel" },
        ]);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCancel = () => {
    Alert.alert(
      "Отменить рендеринг?",
      "Вы действительно хотите остановить создание видео?",
      [
        { text: "Продолжить рендеринг", style: "cancel" },
        {
          text: "Отменить",
          style: "destructive",
          onPress: cancelRendering,
        },
      ],
    );
  };

  const estimatedTime = calculateEstimatedDuration(
    images.length,
    imageDuration,
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <SectionHeader title="Создание видео" />

        <View style={styles.progressContainer}>
          <ProgressCircle progress={progress} size={160} />
        </View>

        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
          {statusText}
        </Text>

        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <InfoRow label="Изображений:" value={images.length} />
          <InfoRow label="Разрешение:" value={getResolutionText(resolution)} />
          <InfoRow
            label="Тип перехода:"
            value={getTransitionLabel(transitionType)}
          />
          <InfoRow label="Примерная длина:" value={`~${estimatedTime}с`} />
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title={isCancelling ? "Отмена..." : "Отменить рендеринг"}
          onPress={handleCancel}
          variant="danger"
          disabled={isCancelling || progress >= 100}
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
    justifyContent: "center",
    alignItems: "center",
  },
  progressContainer: {
    marginVertical: 40,
  },
  statusText: {
    fontSize: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  infoBox: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actions: {
    paddingTop: 16,
  },
});
