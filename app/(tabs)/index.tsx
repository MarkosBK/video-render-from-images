import { ImageSelectionStep } from "@/components/steps/image-selection";
import { RenderingStep } from "@/components/steps/rendering";
import { ResultStep } from "@/components/steps/result";
import { SettingsStep } from "@/components/steps/settings";
import { StepIndicator } from "@/components/ui/step-indicator";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { useVideoStore } from "@/stores/video-store";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = [
  ImageSelectionStep,
  SettingsStep,
  RenderingStep,
  ResultStep,
] as const;

export default function VideoCreatorScreen() {
  const { currentStep } = useVideoStore();
  const colors = useThemeColors();
  const CurrentStepComponent = STEPS[currentStep];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={colors.isDark ? "light-content" : "dark-content"} />
      <StepIndicator currentStep={currentStep} totalSteps={4} />
      <CurrentStepComponent />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
