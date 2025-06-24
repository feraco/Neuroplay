import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trophy, Target, Zap, Crown } from 'lucide-react-native';
import { UserPerformance } from '@/types/performance';

interface PersonalRecordsProps {
  performances: UserPerformance[];
  isPremium: boolean;
}

export function PersonalRecords({ performances, isPremium }: PersonalRecordsProps) {
  const calculateRecords = () => {
    if (performances.length === 0) {
      return {
        highestScore: 0,
        bestStreak: 0,
        totalSessions: 0,
        averageScore: 0,
      };
    }

    const scores = performances.map(p => p.score);
    const highestScore = Math.max(...scores);
    const totalSessions = performances.length;
    const averageScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    // Calculate streak (simplified)
    let currentStreak = 0;
    let bestStreak = 0;
    for (let i = performances.length - 1; i >= 0; i--) {
      if (performances[i].score >= 70) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    return {
      highestScore,
      bestStreak,
      totalSessions,
      averageScore,
    };
  };

  const records = calculateRecords();

  const recordItems = [
    {
      icon: Trophy,
      label: 'Highest Score',
      value: records.highestScore,
      color: '#F59E0B',
    },
    {
      icon: Target,
      label: 'Best Streak',
      value: records.bestStreak,
      color: '#10B981',
    },
    {
      icon: Zap,
      label: 'Total Sessions',
      value: records.totalSessions,
      color: '#3B82F6',
    },
    {
      icon: Trophy,
      label: 'Average Score',
      value: records.averageScore,
      color: '#8B5CF6',
    },
  ];

  const renderPremiumOverlay = () => (
    <View style={styles.premiumOverlay}>
      <Crown size={32} color="#8B5CF6" />
      <Text style={styles.premiumText}>Premium Feature</Text>
      <TouchableOpacity style={styles.upgradeButton}>
        <Text style={styles.upgradeButtonText}>Upgrade</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏆 Personal Records</Text>
      <View style={styles.recordsContainer}>
        {recordItems.map((item, index) => (
          <View key={index} style={styles.recordCard}>
            {!isPremium && index > 1 && renderPremiumOverlay()}
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <item.icon size={24} color={item.color} />
            </View>
            <Text style={styles.recordValue}>{item.value}</Text>
            <Text style={styles.recordLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: '#1F2937',
    marginBottom: 16,
  },
  recordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    maxWidth: '48%',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 24,
    color: '#1F2937',
    marginBottom: 4,
  },
  recordLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  premiumText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#8B5CF6',
    marginTop: 8,
    marginBottom: 12,
  },
  upgradeButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
});