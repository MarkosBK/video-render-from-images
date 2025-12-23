import { useColorScheme } from "@/hooks/use-color-scheme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const steps = Array.from({ length: totalSteps }, (_, i) => i);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isActive = step === currentStep;
        const isCompleted = step < currentStep;

        return (
          <View key={step} style={styles.stepWrapper}>
            <View
              style={[
                styles.step,
                isActive && styles.activeStep,
                isCompleted && styles.completedStep,
                {
                  backgroundColor:
                    isActive || isCompleted
                      ? isDark
                        ? "#0a7ea4"
                        : "#007AFF"
                      : isDark
                        ? "#333"
                        : "#E0E0E0",
                },
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  {
                    color:
                      isActive || isCompleted
                        ? "#fff"
                        : isDark
                          ? "#666"
                          : "#999",
                  },
                ]}
              >
                {step + 1}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.connector,
                  {
                    backgroundColor: isCompleted
                      ? isDark
                        ? "#0a7ea4"
                        : "#007AFF"
                      : isDark
                        ? "#333"
                        : "#E0E0E0",
                  },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  stepWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  activeStep: {
    transform: [{ scale: 1.1 }],
  },
  completedStep: {},
  stepText: {
    fontSize: 16,
    fontWeight: "600",
  },
  connector: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
});
