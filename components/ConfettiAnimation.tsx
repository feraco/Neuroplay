import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

interface ConfettiAnimationProps {
  show: boolean;
  onComplete?: () => void;
  duration?: number;
  colors?: string[];
}

export function ConfettiAnimation({ 
  show, 
  onComplete, 
  duration = 3000,
  colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#8B5CF6', '#10B981']
}: ConfettiAnimationProps) {
  const confettiPieces = useRef<ConfettiPiece[]>([]);
  const animationProgress = useSharedValue(0);

  useEffect(() => {
    if (show) {
      // Generate confetti pieces
      confettiPieces.current = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * width,
        y: -20 - Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        rotation: Math.random() * 360,
        delay: Math.random() * 1000,
      }));

      animationProgress.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.quad),
      }, (finished) => {
        if (finished && onComplete) {
          runOnJS(onComplete)();
        }
      });
    } else {
      animationProgress.value = 0;
    }
  }, [show, duration, onComplete]);

  if (!show) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {confettiPieces.current.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          piece={piece}
          progress={animationProgress}
        />
      ))}
    </View>
  );
}

interface ConfettiPieceProps {
  piece: ConfettiPiece;
  progress: Animated.SharedValue<number>;
}

function ConfettiPiece({ piece, progress }: ConfettiPieceProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const fallDistance = height + 100;
    const translateY = progress.value * fallDistance;
    const translateX = Math.sin(progress.value * Math.PI * 4) * 30;
    const opacity = 1 - progress.value * 0.8;
    const scale = 1 - progress.value * 0.3;

    return {
      transform: [
        { translateX: piece.x + translateX },
        { translateY: piece.y + translateY },
        { rotate: `${rotation.value}deg` },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          backgroundColor: piece.color,
          width: piece.size,
          height: piece.size,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 2,
  },
});