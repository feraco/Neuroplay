import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Calendar, Star, Award, Crown } from 'lucide-react-native';

interface ChallengeHistoryProps {
  isPremium: boolean;
}

export function ChallengeHistory({ isPremium }: ChallengeHistoryProps) {
  // Mock challenge data
  const challenges = [
    {
      id: 1,
      name: 'Memory Master',
      date: '2024-01-15',
      score: 95,
      rank: 1,
      participants: 150,
      completed: true,
    },
    {
      id: 2,
      name: 'Speed Demon',
      date: '2024-01-10',
      score: 87,
      rank: 5,
      participants: 200,
      completed: true,
    },
    {
      id: 3,
      name: 'Focus Challenge',
      date: '2024-01-05',
      score: 92,
      rank: 2,
      participants: 120,
      completed: true,
    },
  ];

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#F59E0B';
    if (rank <= 3) return '#6B7280';
    if (rank <= 10) return '#8B5CF6';
    return '#6B7280';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return Trophy;
    if (rank <= 3) return Award;
    return Star;
  };

  const renderPremiumOverlay = () => (
    <View style={styles.premiumOverlay}>
      <Crown size={40} color="#8B5CF6" />
      <Text style={styles.premiumTitle}>Premium Feature</Text>
      <Text style={styles.premiumDescription}>
        View your complete challenge history and detailed performance analytics
      </Text>
      <TouchableOpacity style={styles.upgradeButton}>
        <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎯 Challenge History</Text>
      <View style={styles.historyContainer}>
        {!isPremium && renderPremiumOverlay()}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={[styles.challengesList, !isPremium && styles.blurred]}
        >
          {challenges.map((challenge) => {
            const RankIcon = getRankIcon(challenge.rank);
            return (
              <View key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <Text style={styles.challengeName}>{challenge.name}</Text>
                  <View style={[styles.rankBadge, { backgroundColor: `${getRankColor(challenge.rank)}20` }]}>
                    <RankIcon size={16} color={getRankColor(challenge.rank)} />
                    <Text style={[styles.rankText, { color: getRankColor(challenge.rank) }]}>
                      #{challenge.rank}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.challengeStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{challenge.score}</Text>
                    <Text style={styles.statLabel}>Score</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{challenge.participants}</Text>
                    <Text style={styles.statLabel}>Players</Text>
                  </View>
                </View>
                
                <View style={styles.challengeFooter}>
                  <Calendar size={14} color="#6B7280" />
                  <Text style={styles.challengeDate}>
                    {new Date(challenge.date).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
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
  historyContainer: {
    position: 'relative',
  },
  challengesList: {
    paddingVertical: 8,
  },
  blurred: {
    opacity: 0.3,
  },
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    width: 200,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  challengeName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rankText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
  },
  challengeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
    color: '#1F2937',
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  challengeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  challengeDate: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
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
    padding: 20,
  },
  premiumTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#8B5CF6',
    marginTop: 12,
    marginBottom: 8,
  },
  premiumDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  upgradeButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  upgradeButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});

// Import Trophy for the getRankIcon function
import { Trophy } from 'lucide-react-native';