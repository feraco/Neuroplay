import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Brain, Zap, Target, Trophy, TrendingUp } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScoreCard } from '@/components/ScoreCard';
import { StorageService } from '@/utils/storage';
import { UserStats } from '@/types/performance';

export default function Dashboard() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUserStats = async () => {
    try {
      const stats = await StorageService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    setRefreshing(false);
  };

  // Load data when component mounts
  useEffect(() => {
    loadUserStats();
  }, []);

  // Refresh data whenever the tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserStats();
    }, [])
  );

  const overallScore = userStats ? 
    Math.round(Object.values(userStats.averageScores).reduce((sum, score) => sum + score, 0) / 7) : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667EEA', '#764BA2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.appName}>NeuroPlay</Text>
          <View style={styles.brainScoreContainer}>
            <Brain size={32} color="#FFFFFF" />
            <View style={styles.brainScoreText}>
              <Text style={styles.brainScoreLabel}>Brain & Body Score</Text>
              <Text style={styles.brainScoreValue}>{overallScore}/100</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <ScoreCard
            title="Current Streak"
            value={userStats?.streak || 0}
            subtitle="days"
            gradient={['#FF6B6B', '#FF8E53']}
            icon={<Zap size={20} color="#FFFFFF" />}
          />
          <ScoreCard
            title="Tasks Completed"
            value={userStats?.tasksCompleted || 0}
            gradient={['#4ECDC4', '#44A08D']}
            icon={<Target size={20} color="#FFFFFF" />}
          />
          <ScoreCard
            title="Total Score"
            value={userStats?.totalScore || 0}
            gradient={['#A8EDEA', '#FED6E3']}
            icon={<Trophy size={20} color="#667EEA" />}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Performance</Text>
          <View style={styles.performanceGrid}>
            {userStats && Object.entries(userStats.averageScores).map(([taskType, score]) => {
              // Only show tasks that have been completed at least once
              if (score === 0) return null;
              
              return (
                <View key={taskType} style={styles.performanceItem}>
                  <Text style={styles.performanceTask}>
                    {taskType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                  <View style={styles.performanceBar}>
                    <View 
                      style={[
                        styles.performanceBarFill, 
                        { width: `${score}%`, backgroundColor: getTaskColor(taskType) }
                      ]} 
                    />
                  </View>
                  <Text style={styles.performanceScore}>{Math.round(score)}</Text>
                </View>
              );
            })}
            
            {/* Show message if no tasks completed yet */}
            {userStats && Object.values(userStats.averageScores).every(score => score === 0) && (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  Complete some tasks to see your performance here!
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          <View style={styles.tipCard}>
            <TrendingUp size={24} color="#6366F1" />
            <View style={styles.tipContent}>
              <Text style={styles.tipTitle}>Consistency is Key</Text>
              <Text style={styles.tipText}>
                Regular practice improves cognitive performance. Try to complete at least one task daily!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTaskColor(taskType: string): string {
  const colors: Record<string, string> = {
    'tapping-speed': '#FF6B6B',
    'stroop-test': '#4ECDC4',
    'reaction-time': '#45B7D1',
    'tower-of-hanoi': '#96CEB4',
    'spatial-memory': '#FFEAA7',
    'decision-task': '#8B5CF6',
    'sound-discrimination': '#10B981',
  };
  return colors[taskType] || '#6366F1';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  appName: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  brainScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 20,
  },
  brainScoreText: {
    marginLeft: 12,
  },
  brainScoreLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  brainScoreValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 16,
  },
  performanceGrid: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  performanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceTask: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#374151',
    width: 120,
  },
  performanceBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceScore: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#1F2937',
    width: 30,
    textAlign: 'right',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDataText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipContent: {
    flex: 1,
    marginLeft: 16,
  },
  tipTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 4,
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});