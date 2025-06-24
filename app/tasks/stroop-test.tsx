import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Eye, Play, RotateCcw } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { ScoringService } from '@/utils/scoring';
import { UserPerformance, TaskMetrics } from '@/types/performance';

type GameState = 'ready' | 'playing' | 'finished';
type Color = 'red' | 'blue' | 'green' | 'yellow';

interface StroopItem {
  word: string;
  color: Color;
  isCongruent: boolean;
}

const colors: Color[] = ['red', 'blue', 'green', 'yellow'];
const colorMap = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
};

const colorNames = {
  red: 'RED',
  blue: 'BLUE', 
  green: 'GREEN',
  yellow: 'YELLOW',
};

export default function StroopTest() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentItem, setCurrentItem] = useState<StroopItem | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  
  const startTime = useRef<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const totalRounds = 20;

  useEffect(() => {
    loadBestScore();
  }, []);

  const loadBestScore = async () => {
    const performances = await StorageService.getPerformancesByTask('stroop-test');
    if (performances.length > 0) {
      const best = Math.max(...performances.map(p => p.score));
      setBestScore(best);
    }
  };

  const generateStroopItem = (): StroopItem => {
    const word = colors[Math.floor(Math.random() * colors.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    return {
      word,
      color,
      isCongruent: word === color,
    };
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentRound(1);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setReactionTimes([]);
    nextRound();
  };

  const nextRound = () => {
    const item = generateStroopItem();
    setCurrentItem(item);
    startTime.current = Date.now();
    
    // Fade in animation
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleColorChoice = (chosenColor: Color) => {
    if (!currentItem) return;
    
    const reactionTime = Date.now() - startTime.current;
    const isCorrect = chosenColor === currentItem.color;
    
    setReactionTimes(prev => [...prev, reactionTime]);
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    } else {
      setIncorrectAnswers(prev => prev + 1);
    }
    
    // Fade out animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      if (currentRound < totalRounds) {
        setCurrentRound(prev => prev + 1);
        setTimeout(nextRound, 300);
      } else {
        finishGame();
      }
    });
  };

  const finishGame = async () => {
    const averageReactionTime = reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length;
    
    const metrics: TaskMetrics = {
      correctAnswers,
      incorrectAnswers,
      averageReactionTime,
    };
    
    const calculatedScore = ScoringService.calculateScore('stroop-test', metrics);
    setScore(calculatedScore);
    
    // Save performance
    const performance: UserPerformance = {
      id: `stroop-${Date.now()}`,
      taskType: 'stroop-test',
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
    setCurrentItem(null);
    setCurrentRound(0);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setReactionTimes([]);
    setScore(0);
    fadeAnim.setValue(1);
  };

  const renderReadyState = () => (
    <View style={styles.centerContent}>
      <View style={styles.iconContainer}>
        <Eye size={64} color="#4ECDC4" />
      </View>
      <Text style={styles.title}>Stroop Test</Text>
      <Text style={styles.description}>
        Test your cognitive flexibility! You'll see color words displayed in different colors. 
        Tap the button that matches the COLOR of the text, not the word itself.
      </Text>
      
      <View style={styles.exampleContainer}>
        <Text style={styles.exampleLabel}>Example:</Text>
        <Text style={[styles.exampleWord, { color: colorMap.blue }]}>RED</Text>
        <Text style={styles.exampleInstruction}>
          The word says "RED" but it's colored BLUE, so you would tap the BLUE button.
        </Text>
      </View>
      
      {bestScore > 0 && (
        <View style={styles.bestScoreContainer}>
          <Text style={styles.bestScoreLabel}>Best Score</Text>
          <Text style={styles.bestScoreValue}>{bestScore}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <LinearGradient
          colors={['#4ECDC4', '#44A08D']}
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

  const renderPlayingState = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <Text style={styles.roundText}>
          {currentRound} / {totalRounds}
        </Text>
        <View style={styles.scoreRow}>
          <Text style={styles.correctText}>✓ {correctAnswers}</Text>
          <Text style={styles.incorrectText}>✗ {incorrectAnswers}</Text>
        </View>
      </View>
      
      <View style={styles.wordContainer}>
        <Text style={styles.instruction}>What COLOR is this word?</Text>
        {currentItem && (
          <Animated.Text 
            style={[
              styles.stroopWord,
              { 
                color: colorMap[currentItem.color],
                opacity: fadeAnim,
                transform: [{ scale: fadeAnim }]
              }
            ]}
          >
            {colorNames[currentItem.word]}
          </Animated.Text>
        )}
      </View>
      
      <View style={styles.choicesContainer}>
        <View style={styles.choicesGrid}>
          {colors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[styles.colorChoice, { backgroundColor: colorMap[color] }]}
              onPress={() => handleColorChoice(color)}
            >
              <Text style={styles.colorChoiceText}>{colorNames[color]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderFinishedState = () => {
    const accuracy = (correctAnswers / (correctAnswers + incorrectAnswers)) * 100;
    const averageTime = reactionTimes.reduce((sum, time) => sum + time, 0) / reactionTimes.length;
    
    return (
      <View style={styles.centerContent}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Complete!</Text>
          
          <View style={styles.scoreCircle}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
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
              <Text style={styles.statCardValue}>{Math.round(accuracy)}%</Text>
              <Text style={styles.statCardLabel}>Accuracy</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{Math.round(averageTime)}</Text>
              <Text style={styles.statCardLabel}>Avg Time (ms)</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{correctAnswers}</Text>
              <Text style={styles.statCardLabel}>Correct</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{incorrectAnswers}</Text>
              <Text style={styles.statCardLabel}>Incorrect</Text>
            </View>
          </View>
          
          {score > bestScore && (
            <View style={styles.newRecordBanner}>
              <Text style={styles.newRecordText}>🧠 New Personal Best!</Text>
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stroop Test</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {gameState === 'ready' && renderReadyState()}
        {gameState === 'playing' && renderPlayingState()}
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
    backgroundColor: '#F0FDFA',
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
    marginBottom: 24,
  },
  exampleContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exampleLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  exampleWord: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    marginBottom: 8,
  },
  exampleInstruction: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
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
    color: '#4ECDC4',
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
  gameContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  roundText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 16,
  },
  correctText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#10B981',
  },
  incorrectText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#EF4444',
  },
  wordContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  instruction: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 40,
  },
  stroopWord: {
    fontFamily: 'Poppins-Bold',
    fontSize: 64,
    textAlign: 'center',
  },
  choicesContainer: {
    paddingBottom: 40,
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  colorChoice: {
    width: 120,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  colorChoiceText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
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
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statCardValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#1F2937',
  },
  statCardLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
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