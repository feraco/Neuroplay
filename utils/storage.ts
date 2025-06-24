import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPerformance, DailyChallenge, UserStats, TaskType } from '@/types/performance';

const STORAGE_KEYS = {
  PERFORMANCES: 'neuroplay_performances',
  DAILY_CHALLENGES: 'neuroplay_daily_challenges',
  USER_STATS: 'neuroplay_user_stats',
};

export const StorageService = {
  // Performance data
  async savePerformance(performance: UserPerformance): Promise<void> {
    try {
      const existing = await this.getPerformances();
      const updated = [...existing, performance];
      await AsyncStorage.setItem(STORAGE_KEYS.PERFORMANCES, JSON.stringify(updated));
      
      // Update user stats
      await this.updateUserStats(performance);
    } catch (error) {
      console.error('Error saving performance:', error);
    }
  },

  async getPerformances(): Promise<UserPerformance[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PERFORMANCES);
      if (!data) return [];
      
      const performances = JSON.parse(data);
      return performances.map((p: any) => ({
        ...p,
        date: new Date(p.date),
      }));
    } catch (error) {
      console.error('Error getting performances:', error);
      return [];
    }
  },

  async getPerformancesByTask(taskType: TaskType): Promise<UserPerformance[]> {
    const all = await this.getPerformances();
    return all.filter(p => p.taskType === taskType);
  },

  // Daily challenges
  async saveDailyChallenge(challenge: DailyChallenge): Promise<void> {
    try {
      const existing = await this.getDailyChallenges();
      const updated = existing.filter(c => c.id !== challenge.id);
      updated.push(challenge);
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_CHALLENGES, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving daily challenge:', error);
    }
  },

  async getDailyChallenges(): Promise<DailyChallenge[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_CHALLENGES);
      if (!data) return [];
      
      const challenges = JSON.parse(data);
      return challenges.map((c: any) => ({
        ...c,
        date: new Date(c.date),
      }));
    } catch (error) {
      console.error('Error getting daily challenges:', error);
      return [];
    }
  },

  async getTodaysChallenge(): Promise<DailyChallenge | null> {
    const challenges = await this.getDailyChallenges();
    const today = new Date().toDateString();
    return challenges.find(c => c.date.toDateString() === today) || null;
  },

  async markChallengeTaskComplete(taskType: TaskType): Promise<void> {
    try {
      const challenge = await this.getTodaysChallenge();
      if (!challenge) return;

      if (!challenge.completedTasks.includes(taskType)) {
        challenge.completedTasks.push(taskType);
        challenge.completed = challenge.completedTasks.length === challenge.tasks.length;
        await this.saveDailyChallenge(challenge);
      }
    } catch (error) {
      console.error('Error marking challenge task complete:', error);
    }
  },

  // User stats
  async getUserStats(): Promise<UserStats> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_STATS);
      if (!data) {
        return {
          totalScore: 0,
          streak: 0,
          tasksCompleted: 0,
          averageScores: {
            'tapping-speed': 0,
            'stroop-test': 0,
            'reaction-time': 0,
            'tower-of-hanoi': 0,
            'spatial-memory': 0,
            'decision-task': 0,
            'sound-discrimination': 0,
          },
          lastActivity: new Date(),
        };
      }
      
      const stats = JSON.parse(data);
      return {
        ...stats,
        lastActivity: new Date(stats.lastActivity),
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalScore: 0,
        streak: 0,
        tasksCompleted: 0,
        averageScores: {
          'tapping-speed': 0,
          'stroop-test': 0,
          'reaction-time': 0,
          'tower-of-hanoi': 0,
          'spatial-memory': 0,
          'decision-task': 0,
          'sound-discrimination': 0,
        },
        lastActivity: new Date(),
      };
    }
  },

  async updateUserStats(performance: UserPerformance): Promise<void> {
    try {
      const stats = await this.getUserStats();
      const performances = await this.getPerformances();
      
      // Calculate new averages
      const taskPerformances = performances.filter(p => p.taskType === performance.taskType);
      const averageScore = taskPerformances.reduce((sum, p) => sum + p.score, 0) / taskPerformances.length;
      
      // Update streak
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
      const lastActivityDate = stats.lastActivity.toDateString();
      
      let newStreak = stats.streak;
      if (lastActivityDate === yesterday) {
        newStreak += 1;
      } else if (lastActivityDate !== today) {
        newStreak = 1;
      }
      
      const updatedStats: UserStats = {
        ...stats,
        totalScore: stats.totalScore + performance.score,
        tasksCompleted: stats.tasksCompleted + 1,
        streak: newStreak,
        averageScores: {
          ...stats.averageScores,
          [performance.taskType]: averageScore,
        },
        lastActivity: new Date(),
      };
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(updatedStats));

      // Mark challenge task as complete if applicable
      await this.markChallengeTaskComplete(performance.taskType);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  },

  // Clear all data (for testing/reset)
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.PERFORMANCES,
        STORAGE_KEYS.DAILY_CHALLENGES,
        STORAGE_KEYS.USER_STATS,
      ]);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  },
};