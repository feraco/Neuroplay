import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Star, Zap, Target } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { ConfettiAnimation } from './ConfettiAnimation';

interface CelebrationModalProps {
  visible: boolean;
  onClose: () => void;
  score: number;
  isNewRecord?: boolean;
  taskName: string;
  encouragementMessage?: string;
}

export function CelebrationModal({
  visible,
  onClose,
  score,
  isNewRecord = false,
  taskName,
  encouragementMessage,
}: CelebrationModalProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const starScale1 = useSharedValue(0);
  const starScale2 = useSharedValue(0);
  const starScale3 = useSharedValue(0);
  const trophyRotation = useSharedValue(0);
  const scoreScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Animate modal appearance
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      
      // Animate trophy
      trophyRotation.value = withSequence(
        withTiming(-10, { duration: 200 }),
        withTiming(10, { duration: 200 }),
        withTiming(0, { duration: 200 })
      );
      
      // Animate stars with delays
      starScale1.value = withDelay(300, withSpring(1, { damping: 12 }));
      starScale2.value = withDelay(500, withSpring(1, { damping: 12 }));
      starScale3.value = withDelay(700, withSpring(1, { damping: 12 }));
      
      // Animate score
      scoreScale.value = withDelay(900, withSpring(1, { damping: 10 }));
    } else {
      opacity.value = 0;
      scale.value = 0;
      starScale1.value = 0;
      starScale2.value = 0;
      starScale3.value = 0;
      trophyRotation.value = 0;
      scoreScale.value = 0;
    }
  }, [visible]);

  const modalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const trophyStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${trophyRotation.value}deg` }],
  }));

  const star1Style = useAnimatedStyle(() => ({
    transform: [{ scale: starScale1.value }],
  }));

  const star2Style = useAnimatedStyle(() => ({
    transform: [{ scale: starScale2.value }],
  }));

  const star3Style = useAnimatedStyle(() => ({
    transform: [{ scale: starScale3.value }],
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scoreScale.value }],
  }));

  const getScoreMessage = (score: number): string => {
    if (score >= 90) return "Outstanding! 🌟";
    if (score >= 80) return "Excellent work! 🎉";
    if (score >= 70) return "Great job! 👏";
    if (score >= 60) return "Good effort! 💪";
    return "Keep practicing! 🚀";
  };

  const getScoreColor = (score: number): string[] => {
    if (score >= 90) return ['#FFD700', '#FFA500'];
    if (score >= 80) return ['#10B981', '#059669'];
    if (score >= 70) return ['#3B82F6', '#1D4ED8'];
    if (score >= 60) return ['#8B5CF6', '#7C3AED'];
    return ['#6B7280', '#4B5563'];
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <ConfettiAnimation show={visible} />
        
        <Animated.View style={[styles.modal, modalStyle]}>
          <LinearGradient
            colors={getScoreColor(score)}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalGradient}
          >
            <View style={styles.content}>
              {/* Stars decoration */}
              <View style={styles.starsContainer}>
                <Animated.View style={[styles.star, star1Style]}>
                  <Star size={20} color="#FFFFFF" fill="#FFFFFF" />
                </Animated.View>
                <Animated.View style={[styles.star, star2Style]}>
                  <Star size={24} color="#FFFFFF" fill="#FFFFFF" />
                </Animated.View>
                <Animated.View style={[styles.star, star3Style]}>
                  <Star size={20} color="#FFFFFF" fill="#FFFFFF" />
                </Animated.View>
              </View>

              {/* Trophy */}
              <Animated.View style={[styles.trophyContainer, trophyStyle]}>
                <Trophy size={64} color="#FFFFFF" />
              </Animated.View>

              {/* Title */}
              <Text style={styles.title}>Task Complete!</Text>
              <Text style={styles.taskName}>{taskName}</Text>

              {/* Score */}
              <Animated.View style={[styles.scoreContainer, scoreStyle]}>
                <Text style={styles.scoreLabel}>Your Score</Text>
                <Text style={styles.scoreValue}>{score}</Text>
                <Text style={styles.scoreMessage}>{getScoreMessage(score)}</Text>
              </Animated.View>

              {/* New Record Banner */}
              {isNewRecord && (
                <View style={styles.newRecordBanner}>
                  <Zap size={20} color="#FFD700" />
                  <Text style={styles.newRecordText}>New Personal Best!</Text>
                </View>
              )}

              {/* Encouragement Message */}
              {encouragementMessage && (
                <Text style={styles.encouragementText}>{encouragementMessage}</Text>
              )}

              {/* Close Button */}
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  modalGradient: {
    padding: 32,
  },
  content: {
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 120,
    marginBottom: 20,
  },
  star: {
    opacity: 0.8,
  },
  trophyContainer: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  taskName: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  scoreValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 48,
    color: '#FFFFFF',
    lineHeight: 56,
  },
  scoreMessage: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 8,
  },
  newRecordBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  newRecordText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFD700',
    marginLeft: 8,
  },
  encouragementText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});