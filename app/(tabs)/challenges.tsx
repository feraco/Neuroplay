import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Trophy, Calendar, Target, Flame, CircleCheck as CheckCircle } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { DailyChallenge, TaskType, UserStats } from '@/types/performance';
import { router } from 'expo-router';

export default function Challenges() {
  const [todaysChallenge, setTodaysChallenge] = useState<DailyChallenge | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadChallengeData();
  }, []);

  const loadChallengeData = async () => {
    try {
      let challenge = await StorageService.getTodaysChallenge();
      
      if (!challenge) {
        challenge = generateDailyChallenge();
        await StorageService.saveDailyChallenge(challenge);
      }
      
      const stats = await StorageService.getUserStats();
      
      setTodaysChallenge(challenge);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading challenge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChallengeData();
    setRefreshing(false);
  };

  const generateDailyChallenge = (): DailyChallenge => {
    const allTasks: TaskType[] = [
      'tapping-speed',
      'stroop-test', 
      'reaction-time',
      'tower-of-hanoi',
      'spatial-memory',
      'decision-task',
      'sound-discrimination'
    ];
    
    // Shuffle and pick 3 random tasks
    const shuffled = [...allTasks].sort(() => Math.random() - 0.5);
    const selectedTasks = shuffled.slice(0, 3);
    
    return {
      id: `challenge-${Date.now()}`,
      date: new Date(),
      tasks: selectedTasks,
      completed: false,
      completedTasks: [],
    };
  };

  const getTaskRoute = (taskType: TaskType): string => {
    const routes: Record<TaskType, string> = {
      'tapping-speed': '/tasks/tapping-speed',
      'stroop-test': '/tasks/stroop-test',
      'reaction-time': '/tasks/reaction-time',
      'tower-of-hanoi': '/tasks/tower-of-hanoi',
      'spatial-memory': '/tasks/spatial-memory',
      'decision-task': '/tasks/decision-task',
      'sound-discrimination': '/tasks/sound-discrimination',
    };
    return routes[taskType];
  };

  const getTaskName = (taskType: TaskType): string => {
    const names: Record<TaskType, string> = {
      'tapping-speed': 'Tapping Speed',
      'stroop-test': 'Stroop Test',
      'reaction-time': 'Reaction Time',
      'tower-of-hanoi': 'Tower of Hanoi',
      'spatial-memory': 'Spatial Memory',
      'decision-task': 'Decision Task',
      'sound-discrimination': 'Sound Discrimination',
    };
    return names[taskType];
  };

  const getTaskColor = (taskType: TaskType): string => {
    const colors: Record<TaskType, string> = {
      'tapping-speed': '#FF6B6B',
      'stroop-test': '#4ECDC4',
      'reaction-time': '#45B7D1',
      'tower-of-hanoi': '#96CEB4',
      'spatial-memory': '#FFEAA7',
      'decision-task': '#8B5CF6',
      'sound-discrimination': '#10B981',
    };
    return colors[taskType];
  };

  const getTaskDescription = (taskType: TaskType): string => {
    const descriptions: Record<TaskType, string> = {
      'tapping-speed': 'Test your motor speed and coordination',
      'stroop-test': 'Challenge your cognitive flexibility',
      'reaction-time': 'Measure your response speed',
      'tower-of-hanoi': 'Solve the classic puzzle',
      'spatial-memory': 'Test your working memory',
      'decision-task': 'Test risk-taking and learning',
      'sound-discrimination': 'Test auditory perception',
    };
    return descriptions[taskType];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading today's challenge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const completionPercentage = todaysChallenge ? 
    (todaysChallenge.completedTasks.length / todaysChallenge.tasks.length) * 100 : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Challenges</Text>
        <Text style={styles.subtitle}>
          Complete today's tasks to maintain your streak
        </Text>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Streak Card */}
        <View style={styles.streakCard}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakGradient}
          >
            <View style={styles.streakContent}>
              <Flame size={32} color="#FFFFFF" />
              <View style={styles.streakText}>
                <Text style={styles.streakValue}>{userStats?.streak || 0}</Text>
                <Text style={styles.streakLabel}>Day Streak</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Today's Challenge */}
        {todaysChallenge && (
          <View style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <View style={styles.challengeHeaderLeft}>
                <Calendar size={24} color="#6366F1" />
                <Text style={styles.challengeTitle}>Today's Challenge</Text>
              </View>
              <View style={styles.progressIndicator}>
                <Text style={styles.progressText}>
                  {todaysChallenge.completedTasks.length}/{todaysChallenge.tasks.length}
                </Text>
              </View>
            </View>

            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${completionPercentage}%` }
                ]} 
              />
            </View>

            <View style={styles.tasksList}>
              {todaysChallenge.tasks.map((taskType, index) => {
                const isCompleted = todaysChallenge.completedTasks.includes(taskType);
                
                return (
                  <TouchableOpacity
                    key={taskType}
                    style={[
                      styles.taskItem,
                      isCompleted && styles.taskItemCompleted
                    ]}
                    onPress={() => router.push(getTaskRoute(taskType))}
                    disabled={isCompleted}
                  >
                    <View style={styles.taskItemLeft}>
                      <View 
                        style={[
                          styles.taskIndicator,
                          { backgroundColor: getTaskColor(taskType) },
                          isCompleted && styles.taskIndicatorCompleted
                        ]}
                      >
                        {isCompleted ? (
                          <CheckCircle size={16} color="#FFFFFF" />
                        ) : (
                          <Text style={styles.taskNumber}>{index + 1}</Text>
                        )}
                      </View>
                      <View style={styles.taskInfo}>
                        <Text style={[
                          styles.taskItemName,
                          isCompleted && styles.taskItemNameCompleted
                        ]}>
                          {getTaskName(taskType)}
                        </Text>
                        <Text style={[
                          styles.taskItemDescription,
                          isCompleted && styles.taskItemDescriptionCompleted
                        ]}>
                          {getTaskDescription(taskType)}
                        </Text>
                      </View>
                    </View>
                    {!isCompleted && (
                      <Target size={16} color="#6B7280" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {completionPercentage === 100 && (
              <View style={styles.completionBanner}>
                <Trophy size={24} color="#10B981" />
                <Text style={styles.completionText}>
                  Challenge Complete! Great job! 🎉
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Challenge Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Challenge Tips</Text>
          <View style={styles.tipsList}>
            <Text style={styles.tipItem}>
              • Complete all tasks in one session for maximum streak bonus
            </Text>
            <Text style={styles.tipItem}>
              • Take breaks between tasks to maintain focus
            </Text>
            <Text style={styles.tipItem}>
              • Consistency matters more than perfect scores
            </Text>
            <Text style={styles.tipItem}>
              • Challenge yourself but don't stress about perfection
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#6B7280',
  },
  streakCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  streakGradient: {
    padding: 20,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakText: {
    marginLeft: 16,
    alignItems: 'center',
  },
  streakValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#FFFFFF',
  },
  streakLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  challengeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  challengeTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginLeft: 12,
  },
  progressIndicator: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  taskItemCompleted: {
    backgroundColor: '#F0FDF4',
  },
  taskItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskIndicatorCompleted: {
    backgroundColor: '#10B981',
  },
  taskNumber: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
  taskInfo: {
    flex: 1,
  },
  taskItemName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 2,
  },
  taskItemNameCompleted: {
    color: '#059669',
  },
  taskItemDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
  },
  taskItemDescriptionCompleted: {
    color: '#047857',
  },
  completionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
  },
  completionText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#059669',
    marginLeft: 8,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipsTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginBottom: 16,
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});