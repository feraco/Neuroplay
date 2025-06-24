import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Hand, Play, RotateCcw } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { ScoringService } from '@/utils/scoring';
import { UserPerformance, TaskMetrics } from '@/types/performance';
import { CelebrationModal } from '@/components/CelebrationModal';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type GameState = 'ready' | 'countdown' | 'playing' | 'finished';

export default function TappingSpeed() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [tapCount, setTapCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  
  const pulseScale = useSharedValue(1);
  const countdownScale = useSharedValue(1);
  const tapScale = useSharedValue(1);
  
  const gameTimer = useRef<NodeJS.Timeout>();
  const countdownTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadBestScore();
    return () => {
      if (gameTimer.current) clearInterval(gameTimer.current);
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, []);

  const loadBestScore = async () => {
    const performances = await StorageService.getPerformancesByTask('tapping-speed');
    if (performances.length > 0) {
      const best = Math.max(...performances.map(p => p.score));
      setBestScore(best);
    }
  };

  const startCountdown = () => {
    setGameState('countdown');
    setCountdown(3);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          startGame();
          return 0;
        }
        
        // Animate countdown
        countdownScale.value = withSequence(
          withTiming(1.5, { duration: 200 }),
          withTiming(1, { duration: 300 })
        );
        
        return prev - 1;
      });
    }, 1000);
    
    countdownTimer.current = timer;
  };

  const startGame = () => {
    setGameState('playing');
    setTapCount(0);
    setTimeLeft(10);
    
    // Start pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
    
    // Game timer
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    gameTimer.current = timer;
  };

  const handleTap = () => {
    if (gameState !== 'playing') return;
    
    setTapCount(prev => prev + 1);
    
    // Tap animation
    tapScale.value = withSequence(
      withTiming(0.95, { duration: 50 }),
      withTiming(1, { duration: 100 })
    );

    // Web-specific feedback
    if (Platform.OS === 'web') {
      // Visual feedback for web
      const tapArea = document.getElementById('tap-area');
      if (tapArea) {
        tapArea.style.transform = 'scale(0.95)';
        setTimeout(() => {
          tapArea.style.transform = 'scale(1)';
        }, 100);
      }
    }
  };

  const endGame = async () => {
    setGameState('finished');
    pulseScale.value = 1; // Stop pulse animation
    
    const metrics: TaskMetrics = {
      numberOfTaps: tapCount,
      duration: 10000, // 10 seconds in milliseconds
    };
    
    const calculatedScore = ScoringService.calculateScore('tapping-speed', metrics);
    setScore(calculatedScore);
    
    // Check if it's a new record
    const newRecord = calculatedScore > bestScore;
    setIsNewRecord(newRecord);
    
    // Save performance
    const performance: UserPerformance = {
      id: `tapping-${Date.now()}`,
      taskType: 'tapping-speed',
      score: calculatedScore,
      date: new Date(),
      metrics,
    };
    
    await StorageService.savePerformance(performance);
    
    if (newRecord) {
      setBestScore(calculatedScore);
    }
    
    // Show celebration modal
    setShowCelebration(true);
  };

  const resetGame = () => {
    setGameState('ready');
    setTapCount(0);
    setTimeLeft(10);
    setCountdown(3);
    setScore(0);
    setShowCelebration(false);
    setIsNewRecord(false);
    pulseScale.value = 1;
    countdownScale.value = 1;
    tapScale.value = 1;
  };

  const getEncouragementMessage = (score: number): string => {
    if (score >= 90) return "Incredible speed! Your motor coordination is exceptional.";
    if (score >= 80) return "Excellent tapping speed! You have great motor control.";
    if (score >= 70) return "Good work! Your hand-eye coordination is developing well.";
    if (score >= 60) return "Nice effort! Keep practicing to improve your motor speed.";
    return "Great start! Regular practice will help improve your coordination.";
  };

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const countdownAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: countdownScale.value }],
  }));

  const tapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tapScale.value }],
  }));

  const renderReadyState = () => (
    <View style={styles.centerContent}>
      <View style={styles.iconContainer}>
        <Hand size={64} color="#FF6B6B" />
      </View>
      <Text style={styles.title}>Tapping Speed</Text>
      <Text style={styles.description}>
        Tap the circle as fast as you can for 10 seconds to test your motor speed and coordination.
      </Text>
      
      {bestScore > 0 && (
        <View style={styles.bestScoreContainer}>
          <Text style={styles.bestScoreLabel}>Best Score</Text>
          <Text style={styles.bestScoreValue}>{bestScore}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.startButton} onPress={startCountdown}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.startButtonGradient}
        >
          <Play size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Game</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderCountdownState = () => (
    <View style={styles.centerContent}>
      <Text style={styles.getReadyText}>Get Ready!</Text>
      <Animated.Text style={[styles.countdownText, countdownAnimatedStyle]}>
        {countdown}
      </Animated.Text>
    </View>
  );

  const renderPlayingState = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Taps</Text>
          <Text style={styles.statValue}>{tapCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>{timeLeft}s</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Rate</Text>
          <Text style={styles.statValue}>{(tapCount / (10 - timeLeft) || 0).toFixed(1)}/s</Text>
        </View>
      </View>
      
      <View style={styles.tapAreaContainer}>
        <TouchableOpacity 
          style={styles.tapArea} 
          onPress={handleTap}
          activeOpacity={0.8}
        >
          <Animated.View 
            style={[styles.tapCircle, pulseAnimatedStyle, tapAnimatedStyle]}
            nativeID="tap-area"
          >
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.tapCircleGradient}
            >
              <Hand size={48} color="#FFFFFF" />
              <Text style={styles.tapText}>TAP!</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFinishedState = () => (
    <View style={styles.centerContent}>
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Great Job!</Text>
        
        <View style={styles.scoreCircle}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scoreCircleGradient}
          >
            <Text style={styles.finalScore}>{score}</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </LinearGradient>
        </View>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statCardValue}>{tapCount}</Text>
            <Text style={styles.statCardLabel}>Total Taps</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardValue}>{(tapCount / 10).toFixed(1)}</Text>
            <Text style={styles.statCardLabel}>Taps/Second</Text>
          </View>
        </View>
        
        {isNewRecord && (
          <View style={styles.newRecordBanner}>
            <Text style={styles.newRecordText}>🎉 New Personal Best!</Text>
          </View>
        )}
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={resetGame}>
          <RotateCcw size={20} color="#6B7280" />
          <Text style={styles.secondaryButtonText}>Play Again</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tapping Speed</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {gameState === 'ready' && renderReadyState()}
        {gameState === 'countdown' && renderCountdownState()}
        {gameState === 'playing' && renderPlayingState()}
        {gameState === 'finished' && renderFinishedState()}
      </View>

      <CelebrationModal
        visible={showCelebration}
        onClose={() => setShowCelebration(false)}
        score={score}
        isNewRecord={isNewRecord}
        taskName="Tapping Speed"
        encouragementMessage={getEncouragementMessage(score)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#1F2937',
    marginBottom: 16,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  bestScoreContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 32,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bestScoreLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  bestScoreValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FF6B6B',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  startButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    marginLeft: 12,
  },
  getReadyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 32,
  },
  countdownText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 120,
    color: '#FF6B6B',
  },
  gameContainer: {
    flex: 1,
    paddingTop: 40,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 60,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#1F2937',
  },
  tapAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapArea: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapCircle: {
    width: 250,
    height: 250,
    borderRadius: 125,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  tapCircleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginTop: 8,
  },
  resultsContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  resultsTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#1F2937',
    marginBottom: 32,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: 32,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  scoreCircleGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finalScore: {
    fontFamily: 'Poppins-Bold',
    fontSize: 36,
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#1F2937',
  },
  statCardLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  newRecordBanner: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newRecordText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 16,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  secondaryButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});