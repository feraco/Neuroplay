export interface UserPerformance {
  id: string;
  taskType: TaskType;
  score: number;
  date: Date;
  metrics: TaskMetrics;
}

export type TaskType = 
  | 'tapping-speed'
  | 'stroop-test'
  | 'reaction-time'
  | 'tower-of-hanoi'
  | 'spatial-memory'
  | 'decision-task'
  | 'sound-discrimination';

export interface TaskMetrics {
  // Tapping Speed
  numberOfTaps?: number;
  duration?: number;
  
  // Stroop Test
  correctAnswers?: number;
  incorrectAnswers?: number;
  averageReactionTime?: number;
  
  // Reaction Time
  reactionTimes?: number[];
  averageReactionTime?: number;
  
  // Tower of Hanoi
  moves?: number;
  solveTime?: number;
  minMoves?: number;
  
  // Spatial Memory
  correctMatches?: number;
  totalAttempts?: number;
  sequenceLength?: number;

  // Decision Task
  leftDoorChoices?: number;
  rightDoorChoices?: number;
  totalReward?: number;
  adaptationRate?: number;
  riskTakingScore?: number;
  learningScore?: number;
  choices?: Array<{
    trial: number;
    choice: 'left' | 'right';
    reward: number;
    rewardType: 'high' | 'low' | 'none';
    reactionTime: number;
  }>;

  // Sound Discrimination
  correctIdentifications?: number;
  incorrectIdentifications?: number;
  averageResponseTime?: number;
  accuracyByFrequency?: Record<string, number>;
  responses?: Array<{
    trial: number;
    frequencies: number[];
    lastToneRelation: 'higher' | 'lower' | 'same';
    userResponse: 'higher' | 'lower';
    correct: boolean;
    responseTime: number;
  }>;
}

export interface DailyChallenge {
  id: string;
  date: Date;
  tasks: TaskType[];
  completed: boolean;
  completedTasks: TaskType[];
}

export interface UserStats {
  totalScore: number;
  streak: number;
  tasksCompleted: number;
  averageScores: Record<TaskType, number>;
  lastActivity: Date;
}