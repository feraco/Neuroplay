import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Brain, 
  TrendingUp, 
  Trophy, 
  Target, 
  Calendar,
  Star,
  Award,
  Zap,
  Eye,
  Hand,
  Layers,
  Grid3x3 as Grid3X3,
  Volume2,
  Lock,
  Crown
} from 'lucide-react-native';
import { StorageService } from '@/utils/storage';
import { UserPerformance, TaskType, UserStats } from '@/types/performance';
import { SkillRadarChart } from '@/components/SkillRadarChart';
import { ProgressChart } from '@/components/ProgressChart';
import { PersonalRecords } from '@/components/PersonalRecords';
import { ChallengeHistory } from '@/components/ChallengeHistory';

const { width } = Dimensions.get('window');

interface SkillData {
  memory: number;
  reactionTime: number;
  attention: number;
  problemSolving: number;
  motorControl: number;
}

interface BrainBodyScore {
  current: number;
  tier: number;
  tierName: string;
  progress: number; // Progress to next tier (0-100)
}

export default function Analytics() {
  const [performances, setPerformances] = useState<UserPerformance[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [skillData, setSkillData] = useState<SkillData | null>(null);
  const [brainBodyScore, setBrainBodyScore] = useState<BrainBodyScore | null>(null);
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(true); // Changed to true for testing

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      const allPerformances = await StorageService.getPerformances();
      const stats = await StorageService.getUserStats();
      
      // Filter performances by time range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - timeRange);
      const filteredPerformances = allPerformances.filter(p => p.date >= cutoffDate);
      
      setPerformances(filteredPerformances);
      setUserStats(stats);
      
      // Calculate skill breakdown
      const skills = calculateSkillBreakdown(stats);
      setSkillData(skills);
      
      // Calculate Brain & Body Score
      const score = calculateBrainBodyScore(stats);
      setBrainBodyScore(score);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateSkillBreakdown = (stats: UserStats): SkillData => {
    return {
      memory: stats.averageScores['spatial-memory'] || 0,
      reactionTime: stats.averageScores['reaction-time'] || 0,
      attention: (stats.averageScores['stroop-test'] + stats.averageScores['sound-discrimination']) / 2 || 0,
      problemSolving: (stats.averageScores['tower-of-hanoi'] + stats.averageScores['decision-task']) / 2 || 0,
      motorControl: stats.averageScores['tapping-speed'] || 0,
    };
  };

  const calculateBrainBodyScore = (stats: UserStats): BrainBodyScore => {
    const scores = Object.values(stats.averageScores).filter(score => score > 0);
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    
    // Determine tier based on score
    let tier = 1;
    let tierName = 'Beginner';
    let progress = 0;
    
    if (averageScore >= 90) {
      tier = 5;
      tierName = 'Cognitive Elite';
      progress = 100;
    } else if (averageScore >= 80) {
      tier = 4;
      tierName = 'Brain Master';
      progress = ((averageScore - 80) / 10) * 100;
    } else if (averageScore >= 65) {
      tier = 3;
      tierName = 'Mind Athlete';
      progress = ((averageScore - 65) / 15) * 100;
    } else if (averageScore >= 45) {
      tier = 2;
      tierName = 'Brain Builder';
      progress = ((averageScore - 45) / 20) * 100;
    } else {
      tier = 1;
      tierName = 'Beginner';
      progress = (averageScore / 45) * 100;
    }
    
    return {
      current: Math.round(averageScore),
      tier,
      tierName,
      progress: Math.round(progress),
    };
  };

  const getTierColor = (tier: number): string[] => {
    const colors = {
      1: ['#6B7280', '#4B5563'], // Gray
      2: ['#3B82F6', '#1D4ED8'], // Blue
      3: ['#10B981', '#059669'], // Green
      4: ['#F59E0B', '#D97706'], // Orange
      5: ['#8B5CF6', '#7C3AED'], // Purple
    };
    return colors[tier as keyof typeof colors] || colors[1];
  };

  const renderPremiumOverlay = () => (
    <View style={styles.premiumOverlay}>
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.9)', 'rgba(124, 58, 237, 0.9)']}
        style={styles.premiumGradient}
      >
        <Crown size={48} color="#FFFFFF" />
        <Text style={styles.premiumTitle}>Premium Analytics</Text>
        <Text style={styles.premiumDescription}>
          Unlock detailed performance insights, progress tracking, and personalized recommendations
        </Text>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {[7, 14, 30].map((days) => (
        <TouchableOpacity
          key={days}
          style={[
            styles.timeRangeButton,
            timeRange === days && styles.timeRangeButtonActive
          ]}
          onPress={() => setTimeRange(days as 7 | 14 | 30)}
        >
          <Text style={[
            styles.timeRangeButtonText,
            timeRange === days && styles.timeRangeButtonTextActive
          ]}>
            {days}d
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBrainBodyScore = () => {
    if (!brainBodyScore) return null;

    return (
      <View style={styles.brainScoreCard}>
        <LinearGradient
          colors={getTierColor(brainBodyScore.tier)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brainScoreGradient}
        >
          <View style={styles.brainScoreContent}>
            <View style={styles.brainScoreHeader}>
              <Brain size={32} color="#FFFFFF" />
              <View style={styles.brainScoreText}>
                <Text style={styles.brainScoreTitle}>Brain & Body Score</Text>
                <Text style={styles.brainScoreTier}>Tier {brainBodyScore.tier}: {brainBodyScore.tierName}</Text>
              </View>
            </View>
            
            <View style={styles.brainScoreMain}>
              <Text style={styles.brainScoreValue}>{brainBodyScore.current}</Text>
              <Text style={styles.brainScoreMax}>/100</Text>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { width: `${brainBodyScore.progress}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {brainBodyScore.progress}% to next tier
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderSkillBreakdown = () => {
    if (!skillData || !isPremium) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Skill Breakdown</Text>
          <View style={styles.lockedCard}>
            {renderPremiumOverlay()}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧠 Skill Breakdown</Text>
        <View style={styles.skillCard}>
          <SkillRadarChart data={skillData} />
          <View style={styles.skillLegend}>
            <View style={styles.skillLegendItem}>
              <View style={[styles.skillDot, { backgroundColor: '#FF6B6B' }]} />
              <Text style={styles.skillLegendText}>Memory</Text>
            </View>
            <View style={styles.skillLegendItem}>
              <View style={[styles.skillDot, { backgroundColor: '#4ECDC4' }]} />
              <Text style={styles.skillLegendText}>Reaction Time</Text>
            </View>
            <View style={styles.skillLegendItem}>
              <View style={[styles.skillDot, { backgroundColor: '#45B7D1' }]} />
              <Text style={styles.skillLegendText}>Attention</Text>
            </View>
            <View style={styles.skillLegendItem}>
              <View style={[styles.skillDot, { backgroundColor: '#96CEB4' }]} />
              <Text style={styles.skillLegendText}>Problem Solving</Text>
            </View>
            <View style={styles.skillLegendItem}>
              <View style={[styles.skillDot, { backgroundColor: '#FFEAA7' }]} />
              <Text style={styles.skillLegendText}>Motor Control</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderProgressOverTime = () => {
    if (!isPremium) {
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📈 Progress Over Time</Text>
            {renderTimeRangeSelector()}
          </View>
          <View style={styles.lockedCard}>
            {renderPremiumOverlay()}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>📈 Progress Over Time</Text>
          {renderTimeRangeSelector()}
        </View>
        <View style={styles.progressCard}>
          <ProgressChart performances={performances} timeRange={timeRange} />
        </View>
      </View>
    );
  };

  // Add toggle button for testing
  const renderTestingControls = () => (
    <View style={styles.testingControls}>
      <TouchableOpacity 
        style={[styles.testButton, isPremium && styles.testButtonActive]}
        onPress={() => setIsPremium(!isPremium)}
      >
        <Text style={[styles.testButtonText, isPremium && styles.testButtonTextActive]}>
          {isPremium ? 'Premium Mode' : 'Free Mode'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Analytics</Text>
        <Text style={styles.subtitle}>
          Track your cognitive performance and unlock insights
        </Text>
        {renderTestingControls()}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderBrainBodyScore()}
        {renderSkillBreakdown()}
        {renderProgressOverTime()}
        
        <PersonalRecords performances={performances} isPremium={isPremium} />
        <ChallengeHistory isPremium={isPremium} />
        
        {!isPremium && (
          <View style={styles.upgradeSection}>
            <LinearGradient
              colors={['#8B5CF6', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeCard}
            >
              <Crown size={40} color="#FFFFFF" />
              <Text style={styles.upgradeTitle}>Unlock Premium Analytics</Text>
              <Text style={styles.upgradeDescription}>
                Get detailed insights, progress tracking, personal records, and smart recommendations
              </Text>
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>Start Free Trial</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
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
  testingControls: {
    marginTop: 16,
    alignItems: 'flex-start',
  },
  testButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  testButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#6B7280',
  },
  testButtonTextActive: {
    color: '#FFFFFF',
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
  brainScoreCard: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  brainScoreGradient: {
    padding: 24,
  },
  brainScoreContent: {
    alignItems: 'center',
  },
  brainScoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  brainScoreText: {
    marginLeft: 16,
    alignItems: 'center',
  },
  brainScoreTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  brainScoreTier: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  brainScoreMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  brainScoreValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 48,
    color: '#FFFFFF',
  },
  brainScoreMax: {
    fontFamily: 'Poppins-Medium',
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#1F2937',
  },
  timeRangeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  timeRangeButtonActive: {
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  timeRangeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6B7280',
  },
  timeRangeButtonTextActive: {
    color: '#374151',
  },
  skillCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  skillLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    gap: 16,
  },
  skillLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  skillLegendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  lockedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 200,
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    overflow: 'hidden',
  },
  premiumGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  premiumTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  premiumDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeSection: {
    marginBottom: 24,
  },
  upgradeCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  upgradeTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  upgradeDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  upgradeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  upgradeButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});