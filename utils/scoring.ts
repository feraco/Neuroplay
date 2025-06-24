import { TaskType, TaskMetrics } from '@/types/performance';

export const ScoringService = {
  calculateScore(taskType: TaskType, metrics: TaskMetrics): number {
    switch (taskType) {
      case 'tapping-speed':
        return this.calculateTappingScore(metrics);
      case 'stroop-test':
        return this.calculateStroopScore(metrics);
      case 'reaction-time':
        return this.calculateReactionTimeScore(metrics);
      case 'tower-of-hanoi':
        return this.calculateTowerOfHanoiScore(metrics);
      case 'spatial-memory':
        return this.calculateSpatialMemoryScore(metrics);
      case 'decision-task':
        return this.calculateDecisionTaskScore(metrics);
      case 'sound-discrimination':
        return this.calculateSoundDiscriminationScore(metrics);
      default:
        return 0;
    }
  },

  calculateTappingScore(metrics: TaskMetrics): number {
    if (!metrics.numberOfTaps || !metrics.duration) return 0;
    
    const tapsPerSecond = metrics.numberOfTaps / (metrics.duration / 1000);
    
    // Realistic scoring based on actual human tapping speeds:
    // 3-4 taps/sec = Average (50-60 points)
    // 5-6 taps/sec = Good (70-80 points) 
    // 7-8 taps/sec = Excellent (85-95 points)
    // 9+ taps/sec = Exceptional (95-100 points)
    
    let score = 0;
    
    if (tapsPerSecond >= 9) {
      score = 95 + Math.min(5, (tapsPerSecond - 9) * 2); // 95-100 for 9+ taps/sec
    } else if (tapsPerSecond >= 7) {
      score = 85 + ((tapsPerSecond - 7) / 2) * 10; // 85-95 for 7-9 taps/sec
    } else if (tapsPerSecond >= 5) {
      score = 70 + ((tapsPerSecond - 5) / 2) * 15; // 70-85 for 5-7 taps/sec
    } else if (tapsPerSecond >= 3) {
      score = 50 + ((tapsPerSecond - 3) / 2) * 20; // 50-70 for 3-5 taps/sec
    } else if (tapsPerSecond >= 1) {
      score = 20 + ((tapsPerSecond - 1) / 2) * 30; // 20-50 for 1-3 taps/sec
    } else {
      score = tapsPerSecond * 20; // 0-20 for under 1 tap/sec
    }
    
    return Math.min(Math.round(score), 100);
  },

  calculateStroopScore(metrics: TaskMetrics): number {
    if (!metrics.correctAnswers || !metrics.incorrectAnswers || !metrics.averageReactionTime) return 0;
    
    const accuracy = metrics.correctAnswers / (metrics.correctAnswers + metrics.incorrectAnswers);
    const speedBonus = Math.max(0, (2000 - metrics.averageReactionTime) / 20); // Bonus for speed under 2s
    
    return Math.min(Math.round(accuracy * 70 + speedBonus), 100);
  },

  calculateReactionTimeScore(metrics: TaskMetrics): number {
    if (!metrics.averageReactionTime) return 0;
    
    // Lower reaction time = higher score
    const baseScore = Math.max(0, (1000 - metrics.averageReactionTime) / 10);
    return Math.min(Math.round(baseScore), 100);
  },

  calculateTowerOfHanoiScore(metrics: TaskMetrics): number {
    if (!metrics.moves || !metrics.solveTime || !metrics.minMoves) return 0;
    
    const efficiency = metrics.minMoves / metrics.moves;
    const timeBonus = Math.max(0, (120000 - metrics.solveTime) / 1200); // Bonus for solving under 2 minutes
    
    return Math.min(Math.round(efficiency * 60 + timeBonus), 100);
  },

  calculateSpatialMemoryScore(metrics: TaskMetrics): number {
    if (!metrics.correctMatches || !metrics.totalAttempts || !metrics.sequenceLength) return 0;
    
    const accuracy = metrics.correctMatches / metrics.totalAttempts;
    const lengthBonus = metrics.sequenceLength * 5; // Bonus for longer sequences
    
    return Math.min(Math.round(accuracy * 70 + lengthBonus), 100);
  },

  calculateDecisionTaskScore(metrics: TaskMetrics): number {
    if (!metrics.totalReward || !metrics.adaptationRate || !metrics.riskTakingScore || !metrics.learningScore) return 0;
    
    // Combine multiple factors for decision-making score
    const rewardScore = Math.min(metrics.totalReward / 10, 40); // Max 40 points for reward
    const adaptationScore = metrics.adaptationRate * 30; // Max 30 points for adaptation
    const riskScore = metrics.riskTakingScore * 15; // Max 15 points for risk-taking
    const learningScorePoints = metrics.learningScore * 15; // Max 15 points for learning
    
    return Math.min(Math.round(rewardScore + adaptationScore + riskScore + learningScorePoints), 100);
  },

  calculateSoundDiscriminationScore(metrics: TaskMetrics): number {
    if (!metrics.correctIdentifications || !metrics.incorrectIdentifications || !metrics.averageResponseTime) return 0;
    
    const accuracy = metrics.correctIdentifications / (metrics.correctIdentifications + metrics.incorrectIdentifications);
    const speedBonus = Math.max(0, (3000 - metrics.averageResponseTime) / 30); // Bonus for speed under 3s
    
    return Math.min(Math.round(accuracy * 80 + speedBonus), 100);
  },

  calculateOverallScore(scores: Record<TaskType, number>): number {
    const values = Object.values(scores).filter(score => score > 0);
    if (values.length === 0) return 0;
    
    return Math.round(values.reduce((sum, score) => sum + score, 0) / values.length);
  },
};