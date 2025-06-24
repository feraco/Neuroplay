import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Grid3x3 as Grid3X3, Play, RotateCcw } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { ScoringService } from '@/utils/scoring';
import { UserPerformance, TaskMetrics } from '@/types/performance';

type GameState = 'ready' | 'showing' | 'waiting' | 'input' | 'finished';

interface GridCell {
  id: number;
  isActive: boolean;
  wasShown: boolean;
  userSelected: boolean;
}

export default function SpatialMemory() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [grid, setGrid] = useState<GridCell[]>([]);
  const [showingIndex, setShowingIndex] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  
  const cellAnims = useRef<Animated.Value[]>([]);
  const maxLevels = 8;
  const gridSize = 16; // 4x4 grid

  useEffect(() => {
    loadBestScore();
    initializeGrid();
  }, []);

  const loadBestScore = async () => {
    const performances = await StorageService.getPerformancesByTask('spatial-memory');
    if (performances.length > 0) {
      const best = Math.max(...performances.map(p => p.score));
      setBestScore(best);
    }
  };

  const initializeGrid = () => {
    const newGrid: GridCell[] = [];
    const newAnims: Animated.Value[] = [];
    
    for (let i = 0; i < gridSize; i++) {
      newGrid.push({
        id: i,
        isActive: false,
        wasShown: false,
        userSelected: false,
      });
      newAnims.push(new Animated.Value(0));
    }
    
    setGrid(newGrid);
    cellAnims.current = newAnims;
  };

  const generateSequence = (length: number): number[] => {
    const sequence: number[] = [];
    while (sequence.length < length) {
      const randomIndex = Math.floor(Math.random() * gridSize);
      if (!sequence.includes(randomIndex)) {
        sequence.push(randomIndex);
      }
    }
    return sequence;
  };

  const startGame = () => {
    setCurrentLevel(1);
    setCorrectMatches(0);
    setTotalAttempts(0);
    startLevel(1);
  };

  const startLevel = (level: number) => {
    const sequenceLength = Math.min(level + 2, 8); // Start with 3, max 9
    const newSequence = generateSequence(sequenceLength);
    
    setSequence(newSequence);
    setUserSequence([]);
    setShowingIndex(0);
    
    // Reset grid
    const resetGrid = grid.map(cell => ({
      ...cell,
      isActive: false,
      wasShown: false,
      userSelected: false,
    }));
    setGrid(resetGrid);
    
    // Reset animations
    cellAnims.current.forEach(anim => anim.setValue(0));
    
    setGameState('showing');
    showSequence(newSequence);
  };

  const showSequence = (sequence: number[]) => {
    let index = 0;
    
    const showNext = () => {
      if (index >= sequence.length) {
        setGameState('waiting');
        setTimeout(() => {
          setGameState('input');
        }, 1000);
        return;
      }
      
      const cellIndex = sequence[index];
      setShowingIndex(index);
      
      // Update grid to show current cell
      setGrid(prev => prev.map((cell, i) => ({
        ...cell,
        isActive: i === cellIndex,
        wasShown: i === cellIndex ? true : cell.wasShown,
      })));
      
      // Animate cell
      Animated.sequence([
        Animated.timing(cellAnims.current[cellIndex], {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(cellAnims.current[cellIndex], {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
      
      setTimeout(() => {
        setGrid(prev => prev.map(cell => ({
          ...cell,
          isActive: false,
        })));
        
        index++;
        setTimeout(showNext, 300);
      }, 800);
    };
    
    showNext();
  };

  const handleCellPress = (cellIndex: number) => {
    if (gameState !== 'input') return;
    
    const newUserSequence = [...userSequence, cellIndex];
    setUserSequence(newUserSequence);
    
    // Update grid to show user selection
    setGrid(prev => prev.map((cell, i) => ({
      ...cell,
      userSelected: i === cellIndex ? true : cell.userSelected,
    })));
    
    // Animate cell press
    Animated.sequence([
      Animated.timing(cellAnims.current[cellIndex], {
        toValue: 0.5,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(cellAnims.current[cellIndex], {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
    
    // Check if sequence is complete
    if (newUserSequence.length === sequence.length) {
      checkSequence(newUserSequence);
    }
  };

  const checkSequence = (userSeq: number[]) => {
    const isCorrect = userSeq.every((cell, index) => cell === sequence[index]);
    
    setTotalAttempts(prev => prev + 1);
    
    if (isCorrect) {
      setCorrectMatches(prev => prev + 1);
      
      if (currentLevel < maxLevels) {
        // Next level
        setTimeout(() => {
          setCurrentLevel(prev => prev + 1);
          startLevel(currentLevel + 1);
        }, 1500);
      } else {
        // Game complete
        setTimeout(finishGame, 1500);
      }
    } else {
      // Game over
      setTimeout(finishGame, 1500);
    }
  };

  const finishGame = async () => {
    const metrics: TaskMetrics = {
      correctMatches,
      totalAttempts,
      sequenceLength: currentLevel + 2,
    };
    
    const calculatedScore = ScoringService.calculateScore('spatial-memory', metrics);
    setScore(calculatedScore);
    
    // Save performance
    const performance: UserPerformance = {
      id: `spatial-${Date.now()}`,
      taskType: 'spatial-memory',
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
    setCurrentLevel(1);
    setSequence([]);
    setUserSequence([]);
    setShowingIndex(0);
    setCorrectMatches(0);
    setTotalAttempts(0);
    setScore(0);
    initializeGrid();
  };

  const getCellStyle = (cell: GridCell, index: number) => {
    const baseStyle = [styles.gridCell];
    
    if (cell.isActive) {
      baseStyle.push(styles.gridCellActive);
    } else if (cell.userSelected) {
      baseStyle.push(styles.gridCellSelected);
    } else if (cell.wasShown && gameState === 'input') {
      baseStyle.push(styles.gridCellShown);
    }
    
    return baseStyle;
  };

  const getCellBackgroundColor = (cell: GridCell, index: number) => {
    const anim = cellAnims.current[index];
    
    if (cell.isActive) {
      return anim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#A8EDEA', '#FED6E3'],
      });
    } else if (cell.userSelected) {
      return '#3B82F6';
    } else if (cell.wasShown && gameState === 'input') {
      return '#E5E7EB';
    }
    
    return '#F3F4F6';
  };

  const renderReadyState = () => (
    <View style={styles.centerContent}>
      <View style={styles.iconContainer}>
        <Grid3X3 size={64} color="#A8EDEA" />
      </View>
      <Text style={styles.title}>Spatial Memory</Text>
      <Text style={styles.description}>
        Watch the sequence of highlighted squares, then tap them back in the same order. 
        The sequences get longer as you progress!
      </Text>
      
      {bestScore > 0 && (
        <View style={styles.bestScoreContainer}>
          <Text style={styles.bestScoreLabel}>Best Score</Text>
          <Text style={styles.bestScoreValue}>{bestScore}</Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <LinearGradient
          colors={['#A8EDEA', '#FED6E3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.startButtonGradient}
        >
          <Play size={24} color="#667EEA" />
          <Text style={styles.startButtonText}>Start Game</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderGameState = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <Text style={styles.levelText}>Level {currentLevel}</Text>
        <Text style={styles.sequenceText}>
          Sequence: {sequence.length} squares
        </Text>
      </View>
      
      <View style={styles.statusContainer}>
        {gameState === 'showing' && (
          <Text style={styles.statusText}>
            Watch carefully... ({showingIndex + 1}/{sequence.length})
          </Text>
        )}
        {gameState === 'waiting' && (
          <Text style={styles.statusText}>Get ready to repeat...</Text>
        )}
        {gameState === 'input' && (
          <Text style={styles.statusText}>
            Tap the squares in order ({userSequence.length}/{sequence.length})
          </Text>
        )}
      </View>
      
      <View style={styles.gridContainer}>
        <View style={styles.grid}>
          {grid.map((cell, index) => (
            <TouchableOpacity
              key={cell.id}
              style={getCellStyle(cell, index)}
              onPress={() => handleCellPress(index)}
              disabled={gameState !== 'input'}
            >
              <Animated.View
                style={[
                  styles.gridCellInner,
                  { backgroundColor: getCellBackgroundColor(cell, index) }
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Correct: {correctMatches} / {totalAttempts}
        </Text>
      </View>
    </View>
  );

  const renderFinishedState = () => (
    <View style={styles.centerContent}>
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsTitle}>
          {correctMatches === maxLevels ? 'Perfect Game!' : 'Game Over!'}
        </Text>
        
        <View style={styles.scoreCircle}>
          <LinearGradient
            colors={['#A8EDEA', '#FED6E3']}
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
            <Text style={styles.statCardValue}>{currentLevel}</Text>
            <Text style={styles.statCardLabel}>Level Reached</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardValue}>{correctMatches}</Text>
            <Text style={styles.statCardLabel}>Correct</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statCardValue}>{sequence.length}</Text>
            <Text style={styles.statCardLabel}>Max Sequence</Text>
          </View>
        </View>
        
        {score > bestScore && (
          <View style={styles.newRecordBanner}>
            <Text style={styles.newRecordText}>🧩 New Personal Best!</Text>
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
        <Text style={styles.headerTitle}>Spatial Memory</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        {gameState === 'ready' && renderReadyState()}
        {(gameState === 'showing' || gameState === 'waiting' || gameState === 'input') && renderGameState()}
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
    color: '#A8EDEA',
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
    color: '#667EEA',
    marginLeft: 12,
  },
  gameContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  gameHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  levelText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#1F2937',
  },
  sequenceText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6B7280',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: '#374151',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 280,
    height: 280,
  },
  gridCell: {
    width: '25%',
    height: '25%',
    padding: 4,
  },
  gridCellInner: {
    flex: 1,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gridCellActive: {
    // Styling handled by animation
  },
  gridCellSelected: {
    // Styling handled by background color
  },
  gridCellShown: {
    // Styling handled by background color
  },
  progressContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
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
    color: '#667EEA',
  },
  scoreLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#667EEA',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
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