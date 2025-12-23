import { useColorScheme } from "@/hooks/use-color-scheme";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressCircleProps {
  progress: number; // 0-100
  size?: number;
}

export function ProgressCircle({ progress, size = 120 }: ProgressCircleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  // Анимированное значение прогресса
  const animatedProgress = useSharedValue(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Плавно обновляем прогресс
  useEffect(() => {
    animatedProgress.value = withSpring(progress, {
      damping: 15,
      stiffness: 100,
    });
  }, [progress]);

  // Обновляем текст прогресса плавно
  useDerivedValue(() => {
    const rounded = Math.round(animatedProgress.value);
    runOnJS(setDisplayProgress)(rounded);
  });

  const progressColor = isDark ? "#0a7ea4" : "#007AFF";
  const trackColor = isDark ? "#333" : "#E0E0E0";

  const animatedCircleProps = useAnimatedProps(() => {
    const progressValue = animatedProgress.value;
    const strokeDashoffset =
      circumference - (progressValue / 100) * circumference;
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Фоновый круг */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Прогресс круг с анимацией */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          animatedProps={animatedCircleProps}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text
          style={[styles.progressText, { color: isDark ? "#fff" : "#000" }]}
        >
          {displayProgress}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  svg: {
    position: "absolute",
  },
  textContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  progressText: {
    fontSize: 24,
    fontWeight: "700",
  },
});
