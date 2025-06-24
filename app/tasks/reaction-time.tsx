import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Zap, Play, RotateCcw } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { ScoringService } from '@/utils/scoring';
import { UserPerformance, TaskMetrics } from '@/types/performance';

type GameState = 'ready' | 'waiting' | 'react' | 'too-early' | 'finished';

export default function ReactionTime() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentRound, setCurrentRound] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [currentReactionTime, setCurrentReactionTime] = useState<number | null>(null);
  const [averageTime, setAverageTime] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  
  const startTime = useRef<number>(0);
  const waitTimeout = useRef<NodeJS.Timeout>();
  const colorAnim = useRef(new Animated.Value(0)).current;
  
  const totalRounds = 5;

  useEffect(() => {
    loadBestScore();
    return () => {
      if (waitTimeout.current) clearTimeout(waitTimeout.current);
    };
  }, []);

  const loadBestScore = async () => {
    const performances = await StorageService.getPerformancesByTask('reaction-time');
    if (performances.length > 0) {
      const best = Math.max(...performances.map(p => p.score));
      setBestScore(best);
    }
  };

  const startGame = () => {
    setGameState('waiting');
    setCurrentRound(1);
    setReactionTimes([]);
    setCurrentReactionTime(null);
    startWaitingPhase();
  };

  const startWaitingPhase = () => {
    setGameState('waiting');
    
    // Animate to red
    Animated.timing(colorAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    
    // Random delay between 2-6 seconds
    const delay = Math.random() * 4000 + 2000;
    
    waitTimeout.current = setTimeout(() => {
      setGameState('react');
      startTime.current = Date.now();
      
      // Animate to green
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, delay);
  };

  const handleScreenPress = () => {
    if (gameState === 'waiting') {
      // Too early!
      if (waitTimeout.current) clearTimeout(waitTimeout.current);
      setGameState('too-early');
      
      setTimeout(() => {
        if (currentRound < totalRounds) {
          startWaitingPhase();
        } else {
          finishGame();
        }
      }, 1500);
      
    } else if (gameState === 'react') {
      // Good reaction!
      const reactionTime = Date.now() - startTime.current;
      setCurrentReactionTime(reactionTime);
      
      const newReactionTimes = [...reactionTimes, reactionTime];
      setReactionTimes(newReactionTimes);
      
      if (currentRound < totalRounds) {
        setCurrentRound(prev => prev + 1);
        setTimeout(() => {
          startWaitingPhase();
        }, 1000);
      } else {
        setTimeout(() => {
          finishGame(newReactionTimes);
        }, 1000);
      }
    }
  };

  const finishGame = async (finalTimes?: number[]) => {
    const times = finalTimes || reactionTimes;
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    setAverageTime(average);
    
    const metrics: TaskMetrics = {
      reactionTimes: times,
      averageReactionTime: average,
    };
    
    const calculatedScore = ScoringService.calculateScore('reaction-time', metrics);
    setScore(calculatedScore);
    
    // Save performance
    const performance: UserPerformance = {
      id: `reaction-${Date.now()}`,
      taskType: 'reaction-time',
      score: calculatedScore,
      date: new Date(),
      metrics,
    };
    
    await StorageService.savePerformance(performance);
    
    if (calculatedScore > bestScore) {
      setBestScore(calculatedScore);
    }
    
    setGameState('finished');
  };

  const resetGame = () => {
    setGameState('ready');
    setCurrentRound(0);
    setReactionTimes([]);
    setCurrentReactionTime(null);
    setAverageTime(0);
    setScore(0);
    colorAnim.setValue(0);
  };

  const getBackgroundColor = () => {
    return colorAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#EF4444', '#10B981'], // Red to Green
    });
  };

  const getInstructions = () => {
    switch (gameState) {
      case 'waiting':
        return 'Wait for GREEN...';
      case 'react':
        return 'TAP NOW!';
      case 'too-early':
        return 'Too early! Wait for green.';
      default:
        return '';
    }
  };

  const renderReadyState = () => (
    <View style={styles.centerContent}>
      <View style={styles.iconContainer}>
        <Zap size={64} color="#45B7D1" />
      </View>
      <Text style={styles.title}>Reaction Time</Text>
      <Text style={styles.description}>
        Test your reflexes! Tap the screen as quickly as possible when it turns green. 
        You'll complete 5 rounds.
      </Text>
      
      {bestScore > 0 && (
        <View style={styles.bestScoreContainer}>
          <Text style={styles.bestScoreLabel}>Best Score</Text>
          <Text style={styles.bestScoreValue}>{bestScore}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <LinearGradient
          colors={['#45B7D1', '#2196F3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.startButtonGradient}
        >
          <Play size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Test</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderGameState = () => (
    <TouchableOpacity 
      style={styles.gameArea} 
      onPress={handleScreenPress}
      activeOpacity={1}
    >
      <Animated.View 
        style={[
          styles.gameBackground,
          { backgroundColor: getBackgroundColor() }
        ]}
      >
        <View style={styles.gameContent}>
          <Text style={styles.roundText}>
            Round {currentRound} of {totalRounds}
          </Text>
          
          <Text style={styles.instructionText}>
            {getInstructions()}
          </Text>
          
          {currentReactionTime && gameState === 'react' && (
            <Text style={styles.reactionTimeText}>
              {currentReactionTime}ms
            </Text>
          )}
          
          {reactionTimes.length > 0 && (
            <View style={styles.timesContainer}>
              <Text style={styles.timesLabel}>Previous Times:</Text>
              <Text style={styles.timesList}>
                {reactionTimes.map(time => `${time}ms`).join(' • ')}
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );

  const renderFinishedState = () => (
    <View style={styles.centerContent}>
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>Test Complete!</Text>
        
        <View style={styles.scoreCircle}>
          <LinearGradient
            colors={['#45B7D1', '#2196F3']}
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
            <Text style={styles.statCardValue}>{Math.round(averageTime)}</Text>
            <Text style={styles.statCardLabel}>Avg Time (ms)</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardValue}>{Math.min(...reactionTimes)}</Text>
            <Text style={styles.statCardLabel}>Best Time (ms)</Text>
          </View>
        </View>
        
        <View style={styles.allTimesContainer}>
          <Text style={styles.allTimesLabel}>All Reaction Times:</Text>
          <View style={styles.allTimesList}>
            {reactionTimes.map((time, index) => (
              <View key={index} style={styles.timeChip}>
                <Text style={styles.timeChipText}>{time}ms</Text>
              </View>
            ))}
          </View>
        </View>
        
        {score > bestScore && (
          <View style={styles.newRecordBanner}>
            <Text style={styles.newRecordText}>⚡ New Personal Best!</Text>
          </View>
        )}
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.secondaryButton} onPress={resetGame}>
          <RotateCcw size={20} color="#6B7280" />
          <Text style={styles.secondaryButtonText}>Test Again</Text>
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
        <Text style={styles.headerTitle}>Reaction Time</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {gameState === 'ready' && renderReadyState()}
        {(gameState === 'waiting' || gameState === 'react' || gameState === 'too-early') && renderGameState()}
        {gameState === 'finished' && renderFinishedState()}
      </View>
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
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
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
    color: '#45B7D1',
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
  gameArea: {
    flex: 1,
  },
  gameBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameContent: {
    alignItems: 'center',
  },
  roundText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 40,
  },
  instructionText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  reactionTimeText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 48,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  timesContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  timesLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  timesList: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
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
  allTimesContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  allTimesLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  allTimesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  timeChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#2563EB',
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
    paddingHorizontal: 20,
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