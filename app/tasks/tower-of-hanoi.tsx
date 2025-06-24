import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowLeft, Layers, Play, RotateCcw } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { ScoringService } from '@/utils/scoring';
import { UserPerformance, TaskMetrics } from '@/types/performance';

type GameState = 'ready' | 'playing' | 'finished';

interface Disk {
  id: number;
  size: number;
  color: string;
}

interface Tower {
  id: number;
  disks: Disk[];
}

const diskColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

export default function TowerOfHanoi() {
  const [gameState, setGameState] = useState<GameState>('ready');
  const [towers, setTowers] = useState<Tower[]>([]);
  const [selectedDisk, setSelectedDisk] = useState<{ towerId: number; diskId: number } | null>(null);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [difficulty, setDifficulty] = useState(3); // Number of disks
  const [gameTime, setGameTime] = useState(0);
  
  const diskAnims = useRef<{ [key: number]: Animated.Value }>({});
  const gameTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadBestScore();
    initializeGame();
  }, [difficulty]);

  useEffect(() => {
    if (gameState === 'playing') {
      gameTimer.current = setInterval(() => {
        setGameTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else {
      if (gameTimer.current) {
        clearInterval(gameTimer.current);
      }
    }

    return () => {
      if (gameTimer.current) {
        clearInterval(gameTimer.current);
      }
    };
  }, [gameState, startTime]);

  const loadBestScore = async () => {
    const performances = await StorageService.getPerformancesByTask('tower-of-hanoi');
    if (performances.length > 0) {
      const best = Math.max(...performances.map(p => p.score));
      setBestScore(best);
    }
  };

  const initializeGame = () => {
    const initialDisks: Disk[] = [];
    for (let i = 0; i < difficulty; i++) {
      const disk: Disk = {
        id: i,
        size: difficulty - i, // Largest disk has highest size number
        color: diskColors[i % diskColors.length],
      };
      initialDisks.push(disk);
      diskAnims.current[i] = new Animated.Value(0);
    }

    // Sort disks so largest is at bottom (highest size first)
    initialDisks.sort((a, b) => b.size - a.size);

    const initialTowers: Tower[] = [
      { id: 0, disks: initialDisks },
      { id: 1, disks: [] },
      { id: 2, disks: [] },
    ];

    setTowers(initialTowers);
    setMoves(0);
    setSelectedDisk(null);
    setGameTime(0);
  };

  const startGame = () => {
    setGameState('playing');
    setStartTime(Date.now());
    setMoves(0);
    setGameTime(0);
  };

  const getMinimumMoves = (numDisks: number): number => {
    return Math.pow(2, numDisks) - 1;
  };

  const canMoveDisk = (fromTowerId: number, toTowerId: number): boolean => {
    const fromTower = towers[fromTowerId];
    const toTower = towers[toTowerId];
    
    if (fromTower.disks.length === 0) return false;
    
    const diskToMove = fromTower.disks[fromTower.disks.length - 1];
    
    if (toTower.disks.length === 0) return true;
    
    const topDiskOnDestination = toTower.disks[toTower.disks.length - 1];
    return diskToMove.size < topDiskOnDestination.size;
  };

  const moveDisk = (fromTowerId: number, toTowerId: number) => {
    if (!canMoveDisk(fromTowerId, toTowerId)) return;

    const newTowers = towers.map(tower => ({
      ...tower,
      disks: [...tower.disks]
    }));
    
    const diskToMove = newTowers[fromTowerId].disks.pop()!;
    newTowers[toTowerId].disks.push(diskToMove);
    
    setTowers(newTowers);
    setMoves(prev => prev + 1);
    setSelectedDisk(null);
    
    // Animate disk movement
    Animated.sequence([
      Animated.timing(diskAnims.current[diskToMove.id], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(diskAnims.current[diskToMove.id], {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Check if puzzle is solved (all disks on the rightmost tower)
    if (newTowers[2].disks.length === difficulty) {
      setTimeout(finishGame, 500);
    }
  };

  const handleTowerPress = (towerId: number) => {
    if (gameState !== 'playing') return;

    if (selectedDisk === null) {
      // Select a disk
      const tower = towers[towerId];
      if (tower.disks.length > 0) {
        const topDisk = tower.disks[tower.disks.length - 1];
        setSelectedDisk({ towerId, diskId: topDisk.id });
      }
    } else {
      // Move selected disk
      if (selectedDisk.towerId === towerId) {
        // Deselect if tapping the same tower
        setSelectedDisk(null);
      } else {
        // Try to move
        moveDisk(selectedDisk.towerId, towerId);
      }
    }
  };

  const finishGame = async () => {
    const solveTime = Date.now() - startTime;
    const minMoves = getMinimumMoves(difficulty);
    
    const metrics: TaskMetrics = {
      moves,
      solveTime,
      minMoves,
    };
    
    const calculatedScore = ScoringService.calculateScore('tower-of-hanoi', metrics);
    setScore(calculatedScore);
    
    // Save performance
    const performance: UserPerformance = {
      id: `hanoi-${Date.now()}`,
      taskType: 'tower-of-hanoi',
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
    initializeGame();
    setScore(0);
    if (gameTimer.current) {
      clearInterval(gameTimer.current);
    }
  };

  const renderDisk = (disk: Disk, isSelected: boolean, isTopDisk: boolean) => {
    const width = 40 + (disk.size * 25); // Better scaling for disk sizes
    const animatedStyle = {
      transform: [
        {
          scale: diskAnims.current[disk.id]?.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1],
          }) || 1,
        },
      ],
    };

    return (
      <Animated.View
        key={disk.id}
        style={[
          styles.disk,
          {
            width,
            backgroundColor: disk.color,
            borderWidth: isSelected ? 3 : 1,
            borderColor: isSelected ? '#FFFFFF' : 'rgba(0,0,0,0.1)',
            opacity: isTopDisk ? 1 : 0.9,
            elevation: isSelected ? 8 : 2,
          },
          animatedStyle,
        ]}
      >
        <Text style={styles.diskText}>{disk.size}</Text>
      </Animated.View>
    );
  };

  const renderTower = (tower: Tower) => {
    const isSelected = selectedDisk?.towerId === tower.id;
    const canDrop = selectedDisk && selectedDisk.towerId !== tower.id && 
                   canMoveDisk(selectedDisk.towerId, tower.id);
    
    return (
      <TouchableOpacity
        key={tower.id}
        style={[
          styles.tower, 
          isSelected && styles.towerSelected,
          canDrop && styles.towerCanDrop
        ]}
        onPress={() => handleTowerPress(tower.id)}
        activeOpacity={0.7}
      >
        <View style={styles.towerPole} />
        <View style={styles.towerBase} />
        <View style={styles.disksContainer}>
          {tower.disks.map((disk, index) => {
            const isDiskSelected = selectedDisk?.diskId === disk.id;
            const isTopDisk = index === tower.disks.length - 1;
            return renderDisk(disk, isDiskSelected, isTopDisk);
          })}
        </View>
        <Text style={styles.towerLabel}>Tower {tower.id + 1}</Text>
      </TouchableOpacity>
    );
  };

  const renderReadyState = () => (
    <View style={styles.centerContent}>
      <View style={styles.iconContainer}>
        <Layers size={64} color="#96CEB4" />
      </View>
      <Text style={styles.title}>Tower of Hanoi</Text>
      <Text style={styles.description}>
        Move all disks from the left tower to the right tower. You can only move one disk at a time, 
        and you cannot place a larger disk on top of a smaller one.
      </Text>
      
      <View style={styles.difficultyContainer}>
        <Text style={styles.difficultyLabel}>Difficulty:</Text>
        <View style={styles.difficultyButtons}>
          {[3, 4, 5].map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.difficultyButton,
                difficulty === num && styles.difficultyButtonActive
              ]}
              onPress={() => setDifficulty(num)}
            >
              <Text style={[
                styles.difficultyButtonText,
                difficulty === num && styles.difficultyButtonTextActive
              ]}>
                {num} Disks
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.minMovesText}>
          Minimum moves: {getMinimumMoves(difficulty)}
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
          colors={['#96CEB4', '#FFEAA7']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.startButtonGradient}
        >
          <Play size={24} color="#FFFFFF" />
          <Text style={styles.startButtonText}>Start Puzzle</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderPlayingState = () => (
    <View style={styles.gameContainer}>
      <View style={styles.gameHeader}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Moves</Text>
          <Text style={styles.statValue}>{moves}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Target</Text>
          <Text style={styles.statValue}>{getMinimumMoves(difficulty)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Time</Text>
          <Text style={styles.statValue}>{gameTime}s</Text>
        </View>
      </View>
      
      <View style={styles.towersContainer}>
        {towers.map(renderTower)}
      </View>
      
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionText}>
          {selectedDisk 
            ? `Selected disk ${towers.find(t => t.id === selectedDisk.towerId)?.disks.find(d => d.id === selectedDisk.diskId)?.size}. Tap a tower to move it.`
            : 'Tap a tower to select the top disk'
          }
        </Text>
        {selectedDisk && (
          <TouchableOpacity 
            style={styles.deselectButton} 
            onPress={() => setSelectedDisk(null)}
          >
            <Text style={styles.deselectButtonText}>Deselect</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderFinishedState = () => {
    const solveTime = gameTime;
    const minMoves = getMinimumMoves(difficulty);
    const efficiency = Math.round((minMoves / moves) * 100);
    
    return (
      <View style={styles.centerContent}>
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Puzzle Solved!</Text>
          
          <View style={styles.scoreCircle}>
            <LinearGradient
              colors={['#96CEB4', '#FFEAA7']}
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
              <Text style={styles.statCardValue}>{moves}</Text>
              <Text style={styles.statCardLabel}>Moves Used</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{solveTime}s</Text>
              <Text style={styles.statCardLabel}>Time</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardValue}>{efficiency}%</Text>
              <Text style={styles.statCardLabel}>Efficiency</Text>
            </View>
          </View>
          
          {moves === minMoves && (
            <View style={styles.perfectBanner}>
              <Text style={styles.perfectText}>🏆 Perfect Solution!</Text>
            </View>
          )}
          
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
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tower of Hanoi</Text>
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
    backgroundColor: '#F0FDF4',
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
  difficultyContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  difficultyLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  difficultyButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  difficultyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  difficultyButtonActive: {
    backgroundColor: '#96CEB4',
    borderColor: '#96CEB4',
  },
  difficultyButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  difficultyButtonTextActive: {
    color: '#FFFFFF',
  },
  minMovesText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
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
    color: '#96CEB4',
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
    justifyContent: 'space-around',
    marginBottom: 30,
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
    fontSize: 20,
    color: '#1F2937',
  },
  towersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    flex: 1,
    paddingBottom: 20,
    paddingTop: 20,
  },
  tower: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 110,
    height: 280,
    position: 'relative',
    padding: 8,
    borderRadius: 8,
  },
  towerSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  towerCanDrop: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 2,
    borderColor: '#10B981',
  },
  towerPole: {
    position: 'absolute',
    width: 6,
    height: 180,
    backgroundColor: '#8B5CF6',
    bottom: 40,
    borderRadius: 3,
  },
  towerBase: {
    width: 90,
    height: 16,
    backgroundColor: '#8B5CF6',
    borderRadius: 8,
    marginBottom: 4,
  },
  towerLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  disksContainer: {
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
  },
  disk: {
    height: 24,
    borderRadius: 12,
    marginBottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  diskText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  instructionsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  instructionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  deselectButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deselectButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
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
    fontSize: 18,
    color: '#1F2937',
  },
  statCardLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#6B7280',
  },
  perfectBanner: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  perfectText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
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