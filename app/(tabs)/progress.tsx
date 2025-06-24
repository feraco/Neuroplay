import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TrendingUp, Calendar, Award } from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { UserPerformance, TaskType } from '@/types/performance';

const { width } = Dimensions.get('window');

export default function Progress() {
  const [performances, setPerformances] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformances();
  }, []);

  const loadPerformances = async () => {
    try {
      const data = await StorageService.getPerformances();
      setPerformances(data.sort((a, b) => b.date.getTime() - a.date.getTime()));
    } catch (error) {
      console.error('Error loading performances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTaskStats = (taskType: TaskType) => {
    const taskPerformances = performances.filter(p => p.taskType === taskType);
    if (taskPerformances.length === 0) return null;

    const scores = taskPerformances.map(p => p.score);
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const best = Math.max(...scores);
    const recent = taskPerformances.slice(0, 5);

    return {
      average: Math.round(average),
      best,
      total: taskPerformances.length,
      recent,
    };
  };

  const taskTypes: { type: TaskType; name: string; color: string }[] = [
    { type: 'tapping-speed', name: 'Tapping Speed', color: '#FF6B6B' },
    { type: 'stroop-test', name: 'Stroop Test', color: '#4ECDC4' },
    { type: 'reaction-time', name: 'Reaction Time', color: '#45B7D1' },
    { type: 'tower-of-hanoi', name: 'Tower of Hanoi', color: '#96CEB4' },
    { type: 'spatial-memory', name: 'Spatial Memory', color: '#FFEAA7' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>
          Track your cognitive performance over time
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {performances.length === 0 ? (
          <View style={styles.emptyState}>
            <TrendingUp size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Progress Yet</Text>
            <Text style={styles.emptyText}>
              Complete some tasks to see your progress here!
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.overviewCard}>
              <LinearGradient
                colors={['#667EEA', '#764BA2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.overviewGradient}
              >
                <View style={styles.overviewContent}>
                  <Award size={32} color="#FFFFFF" />
                  <Text style={styles.overviewTitle}>Total Sessions</Text>
                  <Text style={styles.overviewValue}>{performances.length}</Text>
                </View>
              </LinearGradient>
            </View>

            {taskTypes.map(({ type, name, color }) => {
              const stats = getTaskStats(type);
              if (!stats) return null;

              return (
                <View key={type} style={styles.taskCard}>
                  <View style={styles.taskHeader}>
                    <View style={[styles.taskColorIndicator, { backgroundColor: color }]} />
                    <Text style={styles.taskName}>{name}</Text>
                  </View>
                  
                  <View style={styles.taskStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.average}</Text>
                      <Text style={styles.statLabel}>Average</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.best}</Text>
                      <Text style={styles.statLabel}>Best</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{stats.total}</Text>
                      <Text style={styles.statLabel}>Sessions</Text>
                    </View>
                  </View>

                  <View style={styles.recentScores}>
                    <Text style={styles.recentTitle}>Recent Scores</Text>
                    <View style={styles.scoresList}>
                      {stats.recent.map((performance, index) => (
                        <View key={performance.id} style={styles.scoreItem}>
                          <Text style={styles.scoreValue}>{performance.score}</Text>
                          <Text style={styles.scoreDate}>
                            {performance.date.toLocaleDateString()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  overviewCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  overviewGradient: {
    padding: 24,
  },
  overviewContent: {
    alignItems: 'center',
  },
  overviewTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 12,
    marginBottom: 8,
  },
  overviewValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#FFFFFF',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  taskColorIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 12,
  },
  taskName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
  },
  taskStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#1F2937',
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  recentScores: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  recentTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#374151',
    marginBottom: 12,
  },
  scoresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scoreItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  scoreValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1F2937',
  },
  scoreDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
});