import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Volume2, Play, RotateCcw, Headphones, VolumeX, Equal } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { ScoringService } from '@/utils/scoring';
import { UserPerformance, TaskMetrics } from '@/types/performance';
import { AudioGenerator } from '@/utils/audioGenerator';

type GameState = 'ready' | 'playing' | 'listening' | 'responding' | 'feedback' | 'finished';
type ToneRelation = 'higher' | 'lower' | 'same';
type UserResponse = 'higher' | 'lower' | 'same';

interface Trial {
  trial: number;
  frequencies: number[];
  lastToneRelation: ToneRelation;
  userResponse: UserResponse | null;
  correct: boolean;
  responseTime: number;
}

export default function SoundDiscrimination() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentTrial, setCurrentTrial] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [currentSequence, setCurrentSequence] = useState<number[]>([]);
  const [currentRelation, setCurrentRelation] = useState<ToneRelation>('same');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  
  const startTime = useRef<number>(0);
  const audioGenerator = useRef(new AudioGenerator());
  const responseTimer = useRef<NodeJS.Timeout>();
  
  const totalTrials = 30;
  const responseTimeLimit = 5000; // 5 seconds to respond
  const availableFrequencies = [
    AudioGenerator.FREQUENCIES.C4,
    AudioGenerator.FREQUENCIES.D4,
    AudioGenerator.FREQUENCIES.E4,
    AudioGenerator.FREQUENCIES.F4,
    AudioGenerator.FREQUENCIES.G4,
    AudioGenerator.FREQUENCIES.A4,
  ];

  useEffect(() => {
    loadBestScore();
    checkAudioSupport();
    
    return () => {
      if (responseTimer.current) {
        clearTimeout(responseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (gameState === 'responding' && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (gameState === 'responding' && timeLeft === 0) {
      // Auto-submit as "same" if time runs out
      handleResponse('same');
    }
  }, [gameState, timeLeft]);

  const checkAudioSupport = () => {
    if (Platform.OS === 'web') {
      setAudioSupported('AudioContext' in window || 'webkitAudioContext' in window);
    } else {
      setAudioSupported(true);
    }
  };

  const loadBestScore = async () => {
    const performances = await StorageService.getPerformancesByTask('sound-discrimination');
    if (performances.length > 0) {
      const best = Math.max(...performances.map(p => p.score));
      setBestScore(best);
    }
  };

  const generateTrial = (): { frequencies: number[], relation: ToneRelation } => {
    const baseFrequency = availableFrequencies[Math.floor(Math.random() * availableFrequencies.length)];
    const frequencies = [baseFrequency, baseFrequency, baseFrequency];
    
    // 40% chance of being different, 60% chance of being same
    const shouldBeDifferent = Math.random() > 0.6;
    let relation: ToneRelation = 'same';
    
    if (shouldBeDifferent) {
      const isHigher = Math.random() > 0.5;
      relation = isHigher ? 'higher' : 'lower';
      
      const baseIndex = availableFrequencies.indexOf(baseFrequency);
      let lastFrequency = baseFrequency;
      
      if (isHigher && baseIndex < availableFrequencies.length - 1) {
        lastFrequency = availableFrequencies[baseIndex + 1];
      } else if (!isHigher && baseIndex > 0) {
        lastFrequency = availableFrequencies[baseIndex - 1];
      } else {
        relation = 'same';
      }
      
      frequencies.push(lastFrequency);
    } else {
      frequencies.push(baseFrequency);
    }
    
    return { frequencies, relation };
  };

  const startGame = async () => {
    setGameState('playing');
    setCurrentTrial(1);
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setTrials([]);
    await startNextTrial();
  };

  const startNextTrial = async () => {
    const { frequencies, relation } = generateTrial();
    setCurrentSequence(frequencies);
    setCurrentRelation(relation);
    setGameState('listening');
    
    if (audioSupported) {
      setIsPlaying(true);
      try {
        await audioGenerator.current.playSequence(frequencies, 0.4, 0.2);
      } catch (error) {
        console.error('Error playing audio:', error);
      }
      setIsPlaying(false);
    }
    
    // Start response phase with timer
    startTime.current = Date.now();
    setTimeLeft(Math.ceil(responseTimeLimit / 1000));
    setGameState('responding');
    
    // Set timeout for auto-response
    responseTimer.current = setTimeout(() => {
      if (gameState === 'responding') {
        handleResponse('same'); // Default to "same" if no response
      }
    }, responseTimeLimit);
  };

  const handleResponse = (response: UserResponse) => {
    if (gameState !== 'responding') return;
    
    // Clear the response timer
    if (responseTimer.current) {
      clearTimeout(responseTimer.current);
    }
    
    const responseTime = Date.now() - startTime.current;
    const correct = response === currentRelation;
    
    const trial: Trial = {
      trial: currentTrial,
      frequencies: currentSequence,
      lastToneRelation: currentRelation,
      userResponse: response,
      correct,
      responseTime,
    };
    
    setTrials(prev => [...prev, trial]);
    
    if (correct) {
      setCorrectAnswers(prev => prev + 1);
    } else {
      setIncorrectAnswers(prev => prev + 1);
    }
    
    setGameState('feedback');
    
    setTimeout(() => {
      if (currentTrial >= totalTrials) {
        finishGame();
      } else {
        setCurrentTrial(prev => prev + 1);
        startNextTrial();
      }
    }, 1500);
  };

  const replaySequence = async () => {
    if (!audioSupported || isPlaying || gameState !== 'responding') return;
    
    setIsPlaying(true);
    try {
      await audioGenerator.current.playSequence(currentSequence, 0.4, 0.2);
    } catch (error) {
      console.error('Error replaying audio:', error);
    }
    setIsPlaying(false);
  };

  const finishGame = async () => {
    const responseTimes = trials.map(t => t.responseTime);
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    
    // Calculate accuracy by frequency
    const accuracyByFrequency: Record<string, number> = {};
    availableFrequencies.forEach(freq => {
      const freqTrials = trials.filter(t => t.frequencies[0] === freq);
      if (freqTrials.length > 0) {
        const correct = freqTrials.filter(t => t.correct).length;
        accuracyByFrequency[AudioGenerator.getFrequencyName(freq)] = (correct / freqTrials.length) * 100;
      }
    });
    
    const metrics: TaskMetrics = {
      correctIdentifications: correctAnswers,
      incorrectIdentifications: incorrectAnswers,
      averageResponseTime,
      accuracyByFrequency,
      responses: trials,
    };
    
    const calculatedScore = ScoringService.calculateScore('sound-discrimination', metrics);
    setScore(calculatedScore);
    
    // Save performance
    const performance: UserPerformance = {
      id: `sound-${Date.now()}`,
      taskType: 'sound-discrimination',
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
    setCorrectAnswers(0);
    setIncorrectAnswers(0);
    setTrials([]);
    setCurrentSequence([]);
    setCurrentRelation('same');
    setScore(0);
    setIsPlaying(false);
    setTimeLeft(0);
    
    if (responseTimer.current) {
      clearTimeout(responseTimer.current);
    }
  };

  const renderReadyState = () => (
    <View style={styles.centerContent}>
      <View style={styles.iconContainer}>
        <Volume2 size={64} color="#10B981" />
      </View>
      <Text style={styles.title}>Sound Discrimination</Text>
      <Text style={styles.description}>
        Listen to sequences of four tones. Identify if the last tone is higher, lower, or the same as the others.
      </Text>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Instructions:</Text>
        <View style={styles.instructionItem}>
          <Text style={styles.instructionBullet}>•</Text>
          <Text style={styles.instructionText}>Listen to 4 tones in sequence</Text>
        </View>
        <View style={styles.instructionItem}>
          <Text style={styles.instructionBullet}>•</Text>
          <Text style={styles.instructionText}>Tap "Higher" if the last tone is higher</Text>
        </View>
        <View style={styles.instructionItem}>
          <Text style={styles.instructionBullet}>•</Text>
          <Text style={styles.instructionText}>Tap "Lower" if the last tone is lower</Text>
        </View>
        <View style={styles.instructionItem}>
          <Text style={styles.instructionBullet}>•</Text>
          <Text style={styles.instructionText}>Tap "All Same" if all tones are identical</Text>
        </View>
        <View style={styles.instructionItem}>
          <Text style={styles.instructionBullet}>•</Text>
          <Text style={styles.instructionText}>You have 5 seconds to respond</Text>
        </View>
      </View>
      
      <View style={styles.tipsContainer}>
        <View style={styles.tipItem}>
          <Headphones size={20} color="#6B7280" />
          <Text style={styles.tipText}>Use headphones for best experience</Text>
        </View>
        <View style={styles.tipItem}>
          <Play size={20} color="#6B7280" />
          <Text style={styles.tipText}>You can replay each sequence once</Text>
        </View>
      </View>
      
      {!audioSupported && (
        <View style={styles.warningContainer}>
          <VolumeX size={24} color="#EF4444" />
          <Text style={styles.warningText}>
            Audio not supported. Visual feedback will be provided instead.
          </Text>
        </View>
      )}
      
      {bestScore > 0 && (
        <View style={styles.bestScoreContainer}>
          <Text style={styles.bestScoreLabel}>Best Score</Text>
          <Text style={styles.bestScoreValue}>{bestScore}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <LinearGradient
          colors={['#10B981', '#059669']}
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
        <Text style={styles.trialText}>Trial {currentTrial} / {totalTrials}</Text>
        <View style={styles.scoreRow}>
          <Text style={styles.correctText}>✓ {correctAnswers}</Text>
          <Text style={styles.incorrectText}>✗ {incorrectAnswers}</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${(currentTrial / totalTrials) * 100}%` }
            ]} 
          />
        </View>
      </View>
      
      {gameState === 'listening' && (
        <View style={styles.listeningContainer}>
          <View style={styles.soundWaves}>
            <View style={[styles.soundWave, styles.wave1]} />
            <View style={[styles.soundWave, styles.wave2]} />
            <View style={[styles.soundWave, styles.wave3]} />
          </View>
          <Text style={styles.listeningText}>Listen carefully...</Text>
          {!audioSupported && (
            <View style={styles.visualSequence}>
              <Text style={styles.visualLabel}>Tone Sequence:</Text>
              <View style={styles.visualTones}>
                {currentSequence.map((freq, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.visualTone,
                      { 
                        height: 20 + ((freq - Math.min(...availableFrequencies)) / 50),
                        backgroundColor: index === 3 && currentRelation !== 'same' ? '#EF4444' : '#10B981'
                      }
                    ]}
                  >
                    <Text style={styles.visualToneNumber}>{index + 1}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
      
      {gameState === 'responding' && (
        <View style={styles.respondingContainer}>
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>Time: {timeLeft}s</Text>
            <View style={styles.timerBar}>
              <View 
                style={[
                  styles.timerBarFill,
                  { width: `${(timeLeft / (responseTimeLimit / 1000)) * 100}%` }
                ]}
              />
            </View>
          </View>
          
          <Text style={styles.questionText}>
            How was the last tone compared to the others?
          </Text>
          
          <View style={styles.responseButtons}>
            <TouchableOpacity 
              style={[styles.responseButton, styles.higherButton]}
              onPress={() => handleResponse('higher')}
            >
              <Text style={styles.responseButtonText}>Higher</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.responseButton, styles.sameButton]}
              onPress={() => handleResponse('same')}
            >
              <Equal size={20} color="#FFFFFF" />
              <Text style={styles.responseButtonText}>All Same</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.responseButton, styles.lowerButton]}
              onPress={() => handleResponse('lower')}
            >
              <Text style={styles.responseButtonText}>Lower</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.replayButton}
            onPress={replaySequence}
            disabled={isPlaying}
          >
            <Play size={20} color="#6B7280" />
            <Text style={styles.replayButtonText}>
              {isPlaying ? 'Playing...' : 'Replay Sequence'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {gameState === 'feedback' && (
        <View style={styles.feedbackContainer}>
          <Text style={[
            styles.feedbackText,
            trials[trials.length - 1]?.correct ? styles.correctFeedback : styles.incorrectFeedback
          ]}>
            {trials[trials.length - 1]?.correct ? 'Correct!' : 'Incorrect'}
          </Text>
          <Text style={styles.feedbackDetail}>
            The last tone was {currentRelation === 'same' ? 'the same' : currentRelation}
          </Text>
          {trials[trials.length - 1]?.userResponse && (
            <Text style={styles.feedbackResponse}>
              You answered: {trials[trials.length - 1].userResponse === 'same' ? 'All Same' : trials[trials.length - 1].userResponse}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  const renderFinishedState = () => {
    const accuracy = (correctAnswers / (correctAnswers + incorrectAnswers)) * 100;
    const averageTime = trials.reduce((sum, trial) => sum + trial.responseTime, 0) / trials.length;
    const sameTrials = trials.filter(t => t.lastToneRelation === 'same');
    const differentTrials = trials.filter(t => t.lastToneRelation !== 'same');
    
    return (
      <View style={styles.centerContent}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Complete!</Text>
          
          <View style={styles.scoreCircle}>
            <LinearGradient
              colors={['#10B981', '#059669']}
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
              <Text style={styles.statCardValue}>{sameTrials.length}</Text>
              <Text style={styles.statCardLabel}>Same Trials</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{differentTrials.length}</Text>
              <Text style={styles.statCardLabel}>Different Trials</Text>
            </View>
          </View>
          
          <View style={styles.detailedStats}>
            <Text style={styles.detailedStatsTitle}>Performance Breakdown:</Text>
            <Text style={styles.detailedStatsText}>
              Same tones: {sameTrials.filter(t => t.correct).length}/{sameTrials.length} correct
            </Text>
            <Text style={styles.detailedStatsText}>
              Different tones: {differentTrials.filter(t => t.correct).length}/{differentTrials.length} correct
            </Text>
          </View>
          
          {score > bestScore && (
            <View style={styles.newRecordBanner}>
              <Text style={styles.newRecordText}>🎵 New Personal Best!</Text>
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
        <Text style={styles.headerTitle}>Sound Discrimination</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {gameState === 'ready' && renderReadyState()}
        {(gameState === 'playing' || gameState === 'listening' || gameState === 'responding' || gameState === 'feedback') && renderPlayingState()}
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
    backgroundColor: '#ECFDF5',
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
    marginBottom: 16,
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  instructionBullet: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
    width: 12,
  },
  instructionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
  },
  warningText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#DC2626',
    marginLeft: 12,
    flex: 1,
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
    color: '#10B981',
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
  trialText: {
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
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  listeningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundWaves: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  soundWave: {
    width: 4,
    backgroundColor: '#10B981',
    borderRadius: 2,
    marginHorizontal: 4,
  },
  wave1: {
    height: 40,
  },
  wave2: {
    height: 60,
  },
  wave3: {
    height: 50,
  },
  listeningText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#374151',
    marginBottom: 20,
  },
  visualSequence: {
    alignItems: 'center',
    marginTop: 20,
  },
  visualLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  visualTones: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  visualTone: {
    width: 40,
    borderRadius: 6,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
    minHeight: 30,
  },
  visualToneNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  respondingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#374151',
    marginBottom: 8,
  },
  timerBar: {
    width: 200,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  questionText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 40,
  },
  responseButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  responseButton: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    justifyContent: 'center',
  },
  higherButton: {
    backgroundColor: '#3B82F6',
  },
  sameButton: {
    backgroundColor: '#6B7280',
  },
  lowerButton: {
    backgroundColor: '#EF4444',
  },
  responseButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  replayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  replayButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  feedbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 8,
  },
  correctFeedback: {
    color: '#10B981',
  },
  incorrectFeedback: {
    color: '#EF4444',
  },
  feedbackDetail: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  feedbackResponse: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
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
  detailedStats: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  detailedStatsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  detailedStatsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
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