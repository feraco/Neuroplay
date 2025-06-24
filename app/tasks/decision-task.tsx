import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Brain, Play, RotateCcw, DoorOpen, Gift, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { ScoringService } from '@/utils/scoring';
import { UserPerformance, TaskMetrics } from '@/types/performance';

type GameState = 'ready' | 'playing' | 'reward-shown' | 'frustration' | 'continue-prompt' | 'finished';
type DoorChoice = 'left' | 'right';
type RewardType = 'high' | 'low' | 'none';

interface Trial {
  trial: number;
  choice: DoorChoice;
  reward: number;
  rewardType: RewardType;
  reactionTime: number;
}

interface GamePhase {
  name: string;
  startTrial: number;
  endTrial: number;
  leftProbability: number; // Probability that left door gives high reward
  rightProbability: number; // Probability that right door gives high reward
}

export default function DecisionTask() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [totalReward, setTotalReward] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [lastReward, setLastReward] = useState<{ amount: number; type: RewardType } | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<GamePhase | null>(null);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  
  const startTime = useRef<number>(0);
  const leftDoorAnim = useRef(new Animated.Value(1)).current;
  const rightDoorAnim = useRef(new Animated.Value(1)).current;
  const rewardAnim = useRef(new Animated.Value(0)).current;

  const totalTrials = 50;
  const highReward = 10;
  const lowReward = 2;

  // Define game phases with changing probabilities
  const gamePhases: GamePhase[] = [
    {
      name: 'Initial Learning',
      startTrial: 1,
      endTrial: 7,
      leftProbability: 0.8, // Left door is better
      rightProbability: 0.2,
    },
    {
      name: 'Probability Reversal',
      startTrial: 8,
      endTrial: 30,
      leftProbability: 0.3, // Right door becomes better
      rightProbability: 0.7,
    },
    {
      name: 'Frustration Period',
      startTrial: 31,
      endTrial: 40,
      leftProbability: 0.1, // Both doors give mostly no reward
      rightProbability: 0.1,
    },
    {
      name: 'Recovery',
      startTrial: 41,
      endTrial: 50,
      leftProbability: 0.6, // Left door becomes good again
      rightProbability: 0.4,
    },
  ];

  useEffect(() => {
    loadBestScore();
  }, []);

  const loadBestScore = async () => {
    const performances = await StorageService.getPerformancesByTask('decision-task');
    if (performances.length > 0) {
      const best = Math.max(...performances.map(p => p.score));
      setBestScore(best);
    }
  };

  const getCurrentPhase = (trial: number): GamePhase => {
    return gamePhases.find(phase => trial >= phase.startTrial && trial <= phase.endTrial) || gamePhases[0];
  };

  const startGame = () => {
    setGameState('playing');
    setCurrentTrial(1);
    setTotalReward(0);
    setTrials([]);
    setLastReward(null);
    setCurrentPhase(getCurrentPhase(1));
    startTime.current = Date.now();
  };

  const handleDoorChoice = (choice: DoorChoice) => {
    if (gameState !== 'playing') return;

    const reactionTime = Date.now() - startTime.current;
    const phase = getCurrentPhase(currentTrial);
    
    // Determine reward based on probabilities
    let reward = 0;
    let rewardType: RewardType = 'none';
    
    if (currentTrial >= 31 && currentTrial <= 40) {
      // Frustration period - mostly no rewards
      const random = Math.random();
      if (random < 0.1) {
        reward = choice === 'left' ? 
          (Math.random() < phase.leftProbability ? highReward : lowReward) :
          (Math.random() < phase.rightProbability ? highReward : lowReward);
        rewardType = reward === highReward ? 'high' : 'low';
      }
    } else {
      // Normal periods
      const random = Math.random();
      const probability = choice === 'left' ? phase.leftProbability : phase.rightProbability;
      
      if (random < probability) {
        reward = highReward;
        rewardType = 'high';
      } else {
        reward = lowReward;
        rewardType = 'low';
      }
    }

    const trial: Trial = {
      trial: currentTrial,
      choice,
      reward,
      rewardType,
      reactionTime,
    };

    setTrials(prev => [...prev, trial]);
    setTotalReward(prev => prev + reward);
    setLastReward({ amount: reward, type: rewardType });

    // Animate door selection
    const doorAnim = choice === 'left' ? leftDoorAnim : rightDoorAnim;
    Animated.sequence([
      Animated.timing(doorAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(doorAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // Show reward animation
    if (reward > 0) {
      Animated.sequence([
        Animated.timing(rewardAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rewardAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }

    setGameState('reward-shown');

    // Handle special cases
    if (currentTrial === 40) {
      setTimeout(() => {
        setShowContinuePrompt(true);
        setGameState('continue-prompt');
      }, 1500);
    } else if (currentTrial >= totalTrials) {
      setTimeout(finishGame, 1500);
    } else {
      setTimeout(() => {
        setCurrentTrial(prev => prev + 1);
        setCurrentPhase(getCurrentPhase(currentTrial + 1));
        setGameState('playing');
        startTime.current = Date.now();
      }, 1500);
    }
  };

  const handleContinueChoice = (continueGame: boolean) => {
    if (continueGame) {
      setCurrentTrial(prev => prev + 1);
      setCurrentPhase(getCurrentPhase(currentTrial + 1));
      setGameState('playing');
      setShowContinuePrompt(false);
      startTime.current = Date.now();
    } else {
      finishGame();
    }
  };

  const calculateMetrics = (): TaskMetrics => {
    const leftChoices = trials.filter(t => t.choice === 'left').length;
    const rightChoices = trials.filter(t => t.choice === 'right').length;
    
    // Calculate adaptation rate (how quickly they adapt to probability changes)
    let adaptationScore = 0;
    const phaseTransitions = [8, 31, 41]; // Trials where probabilities change
    
    phaseTransitions.forEach(transitionTrial => {
      const beforeTrials = trials.filter(t => t.trial >= transitionTrial - 3 && t.trial < transitionTrial);
      const afterTrials = trials.filter(t => t.trial >= transitionTrial && t.trial < transitionTrial + 3);
      
      if (beforeTrials.length > 0 && afterTrials.length > 0) {
        const beforeLeftRate = beforeTrials.filter(t => t.choice === 'left').length / beforeTrials.length;
        const afterLeftRate = afterTrials.filter(t => t.choice === 'left').length / afterTrials.length;
        const adaptationChange = Math.abs(afterLeftRate - beforeLeftRate);
        adaptationScore += adaptationChange;
      }
    });
    
    adaptationScore = adaptationScore / phaseTransitions.length;

    // Calculate risk-taking score (willingness to explore during uncertainty)
    const frustrationTrials = trials.filter(t => t.trial >= 31 && t.trial <= 40);
    const riskTakingScore = frustrationTrials.length > 0 ? 
      (frustrationTrials.filter(t => t.choice === 'left').length / frustrationTrials.length) : 0.5;

    // Calculate learning score (improvement over time)
    const earlyTrials = trials.slice(0, 10);
    const lateTrials = trials.slice(-10);
    const earlyReward = earlyTrials.reduce((sum, t) => sum + t.reward, 0) / earlyTrials.length;
    const lateReward = lateTrials.reduce((sum, t) => sum + t.reward, 0) / lateTrials.length;
    const learningScore = Math.max(0, (lateReward - earlyReward) / highReward);

    return {
      leftDoorChoices: leftChoices,
      rightDoorChoices: rightChoices,
      totalReward,
      adaptationRate: adaptationScore,
      riskTakingScore,
      learningScore,
      choices: trials,
    };
  };

  const finishGame = async () => {
    const metrics = calculateMetrics();
    const calculatedScore = ScoringService.calculateScore('decision-task', metrics);
    setScore(calculatedScore);

    // Save performance
    const performance: UserPerformance = {
      id: `decision-${Date.now()}`,
      taskType: 'decision-task',
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
    setCurrentTrial(0);
    setTotalReward(0);
    setTrials([]);
    setLastReward(null);
    setScore(0);
    setCurrentPhase(null);
    setShowContinuePrompt(false);
    leftDoorAnim.setValue(1);
    rightDoorAnim.setValue(1);
    rewardAnim.setValue(0);
  };

  const getPhaseDescription = (phase: GamePhase | null): string => {
    if (!phase) return '';
    
    switch (phase.name) {
      case 'Initial Learning':
        return 'Learning phase - discover which door is better';
      case 'Probability Reversal':
        return 'Things have changed - adapt your strategy';
      case 'Frustration Period':
        return 'Difficult times - rewards are scarce';
      case 'Recovery':
        return 'Recovery phase - new opportunities await';
      default:
        return '';
    }
  };

  const renderReadyState = () => (
    <View style={styles.centerContent}>
      <View style={styles.iconContainer}>
        <Brain size={64} color="#8B5CF6" />
      </View>
      <Text style={styles.title}>Decision Task</Text>
      <Text style={styles.description}>
        You'll see two doors with treasure chests behind them. Yellow chests contain high rewards, 
        red chests contain low rewards. Choose wisely and adapt as conditions change!
      </Text>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>What to expect:</Text>
        <Text style={styles.instructionItem}>• 50 trials with changing reward patterns</Text>
        <Text style={styles.instructionItem}>• Probability changes after trial 7</Text>
        <Text style={styles.instructionItem}>• Challenging period around trial 30</Text>
        <Text style={styles.instructionItem}>• Choice to continue at trial 40</Text>
      </View>
      
      {bestScore > 0 && (
        <View style={styles.bestScoreContainer}>
          <Text style={styles.bestScoreLabel}>Best Score</Text>
          <Text style={styles.bestScoreValue}>{bestScore}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <LinearGradient
          colors={['#8B5CF6', '#A855F7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.startButtonGradient}
        >
          <Play size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Task</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPlayingState = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <View style={styles.progressContainer}>
          <Text style={styles.trialText}>Trial {currentTrial} / {totalTrials}</Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${(currentTrial / totalTrials) * 100}%` }
              ]} 
            />
          </View>
        </View>
        <View style={styles.rewardContainer}>
          <Gift size={20} color="#F59E0B" />
          <Text style={styles.rewardText}>{totalReward}</Text>
        </View>
      </View>

      {currentPhase && (
        <View style={styles.phaseContainer}>
          <Text style={styles.phaseTitle}>{currentPhase.name}</Text>
          <Text style={styles.phaseDescription}>{getPhaseDescription(currentPhase)}</Text>
        </View>
      )}

      <View style={styles.doorsContainer}>
        <TouchableOpacity 
          style={styles.doorContainer}
          onPress={() => handleDoorChoice('left')}
          disabled={gameState !== 'playing'}
        >
          <Animated.View style={[styles.door, { transform: [{ scale: leftDoorAnim }] }]}>
            <LinearGradient
              colors={['#3B82F6', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.doorGradient}
            >
              <DoorOpen size={48} color="#FFFFFF" />
              <Text style={styles.doorLabel}>Left Door</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.doorContainer}
          onPress={() => handleDoorChoice('right')}
          disabled={gameState !== 'playing'}
        >
          <Animated.View style={[styles.door, { transform: [{ scale: rightDoorAnim }] }]}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.doorGradient}
            >
              <DoorOpen size={48} color="#FFFFFF" />
              <Text style={styles.doorLabel}>Right Door</Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {lastReward && gameState === 'reward-shown' && (
        <Animated.View style={[styles.rewardDisplay, { opacity: rewardAnim }]}>
          <View style={[
            styles.chestContainer,
            { backgroundColor: lastReward.type === 'high' ? '#F59E0B' : lastReward.type === 'low' ? '#EF4444' : '#6B7280' }
          ]}>
            <Gift size={32} color="#FFFFFF" />
            <Text style={styles.rewardAmount}>
              {lastReward.amount > 0 ? `+${lastReward.amount}` : 'No reward'}
            </Text>
          </View>
        </Animated.View>
      )}

      {currentTrial >= 31 && currentTrial <= 40 && (
        <View style={styles.frustrationBanner}>
          <AlertTriangle size={20} color="#F59E0B" />
          <Text style={styles.frustrationText}>Difficult period - rewards are scarce</Text>
        </View>
      )}
    </View>
  );

  const renderContinuePrompt = () => (
    <View style={styles.centerContent}>
      <View style={styles.continueContainer}>
        <Text style={styles.continueTitle}>Continue Playing?</Text>
        <Text style={styles.continueDescription}>
          You've completed 40 trials. The task can continue for 10 more trials with potentially better rewards.
        </Text>
        
        <View style={styles.continueStats}>
          <Text style={styles.continueStatsText}>Current Reward: {totalReward}</Text>
          <Text style={styles.continueStatsText}>Trials Completed: {currentTrial}</Text>
        </View>

        <View style={styles.continueButtons}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => handleContinueChoice(true)}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={() => handleContinueChoice(false)}
          >
            <Text style={styles.stopButtonText}>Stop Here</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderFinishedState = () => {
    const metrics = calculateMetrics();
    
    return (
      <View style={styles.centerContent}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Task Complete!</Text>
          
          <View style={styles.scoreCircle}>
            <LinearGradient
              colors={['#8B5CF6', '#A855F7']}
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
              <Text style={styles.statCardValue}>{totalReward}</Text>
              <Text style={styles.statCardLabel}>Total Reward</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{trials.length}</Text>
              <Text style={styles.statCardLabel}>Trials</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{Math.round((metrics.adaptationRate || 0) * 100)}%</Text>
              <Text style={styles.statCardLabel}>Adaptation</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{Math.round((metrics.learningScore || 0) * 100)}%</Text>
              <Text style={styles.statCardLabel}>Learning</Text>
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
            <Text style={styles.secondaryButtonText}>Play Again</Text>
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
        <Text style={styles.headerTitle}>Decision Task</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {gameState === 'ready' && renderReadyState()}
        {(gameState === 'playing' || gameState === 'reward-shown') && renderPlayingState()}
        {gameState === 'continue-prompt' && renderContinuePrompt()}
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
    backgroundColor: '#F3F4F6',
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
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  instructionItem: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
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
    color: '#8B5CF6',
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
    marginBottom: 20,
  },
  progressContainer: {
    flex: 1,
    marginRight: 20,
  },
  trialText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
    borderRadius: 4,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rewardText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#1F2937',
    marginLeft: 8,
  },
  phaseContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  phaseTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#8B5CF6',
    marginBottom: 4,
  },
  phaseDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  doorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 40,
  },
  doorContainer: {
    alignItems: 'center',
  },
  door: {
    width: 140,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  doorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  doorLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 12,
    textAlign: 'center',
  },
  rewardDisplay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -75 }],
    alignItems: 'center',
  },
  chestContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  rewardAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 8,
  },
  frustrationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  frustrationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#92400E',
    marginLeft: 8,
  },
  continueContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  continueTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 16,
  },
  continueDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  continueStats: {
    alignItems: 'center',
    marginBottom: 24,
  },
  continueStatsText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  continueButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  continueButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  continueButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  stopButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stopButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#6B7280',
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