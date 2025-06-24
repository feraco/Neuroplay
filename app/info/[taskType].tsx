import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Users, 
  BookOpen,
  Hand,
  Eye,
  Zap,
  Layers,
  Grid3x3 as Grid3X3,
  Volume2
} from 'lucide-react-native';
import { TaskType } from '@/types/performance';

interface TaskInfo {
  title: string;
  icon: React.ReactNode;
  gradient: string[];
  description: string;
  whatItMeasures: string[];
  howItWorks: string;
  scoringExplanation: string;
  researchBackground: string;
  clinicalUse: string[];
  tips: string[];
  scoreRanges: {
    excellent: string;
    good: string;
    average: string;
    needsImprovement: string;
  };
}

const taskInfoData: Record<TaskType, TaskInfo> = {
  'tapping-speed': {
    title: 'Tapping Speed Test',
    icon: <Hand size={32} color="#FFFFFF" />,
    gradient: ['#FF6B6B', '#FF8E53'],
    description: 'A fundamental test of motor speed and coordination that measures how quickly you can perform repetitive finger movements.',
    whatItMeasures: [
      'Motor speed and dexterity',
      'Hand-eye coordination',
      'Fine motor control',
      'Psychomotor processing speed',
      'Sustained attention to motor tasks'
    ],
    howItWorks: 'You tap a target as quickly as possible for 10 seconds. The test measures the total number of taps and calculates your tapping rate per second.',
    scoringExplanation: 'Scores are based on taps per second, with higher rates indicating better motor speed. The average person can tap 5-7 times per second, while trained individuals may reach 8-10 taps per second.',
    researchBackground: 'Finger tapping tests have been used in neuropsychology since the 1940s. They\'re part of the Halstead-Reitan Neuropsychological Battery and are sensitive to brain injuries, particularly in the motor cortex and basal ganglia.',
    clinicalUse: [
      'Detecting motor impairments in neurological conditions',
      'Monitoring progression in Parkinson\'s disease',
      'Assessing recovery after stroke',
      'Evaluating effects of medications on motor function',
      'Screening for ADHD-related motor difficulties'
    ],
    tips: [
      'Use your index finger for optimal speed',
      'Keep your wrist stable and move only your finger',
      'Find a comfortable rhythm rather than forcing maximum speed',
      'Practice regularly to improve motor coordination'
    ],
    scoreRanges: {
      excellent: '80-100: Exceptional motor speed (8+ taps/second)',
      good: '60-79: Above average motor speed (6-7.9 taps/second)',
      average: '40-59: Average motor speed (4-5.9 taps/second)',
      needsImprovement: '0-39: Below average motor speed (<4 taps/second)'
    }
  },
  'stroop-test': {
    title: 'Stroop Test',
    icon: <Eye size={32} color="#FFFFFF" />,
    gradient: ['#4ECDC4', '#44A08D'],
    description: 'A classic test of cognitive flexibility that measures your ability to inhibit automatic responses and focus on relevant information.',
    whatItMeasures: [
      'Cognitive flexibility and mental agility',
      'Selective attention and focus',
      'Inhibitory control and impulse management',
      'Processing speed under interference',
      'Executive function capabilities'
    ],
    howItWorks: 'You see color words (like "RED") displayed in different colors. Your task is to identify the color of the text, not read the word. This creates cognitive interference that you must overcome.',
    scoringExplanation: 'Scores combine accuracy and speed. Higher scores indicate better cognitive flexibility. The test measures how well you can suppress the automatic response to read words and focus on color identification.',
    researchBackground: 'Developed by John Ridley Stroop in 1935, this test demonstrates automatic processing and cognitive interference. It\'s one of the most widely used tests in psychology and neuroscience research.',
    clinicalUse: [
      'Assessing attention disorders (ADHD)',
      'Evaluating executive function deficits',
      'Monitoring cognitive decline in aging',
      'Detecting frontal lobe dysfunction',
      'Measuring treatment effects in psychiatric conditions'
    ],
    tips: [
      'Focus on the color, not the word meaning',
      'Take a moment to process before responding',
      'Don\'t rush - accuracy is as important as speed',
      'Practice ignoring irrelevant information in daily life'
    ],
    scoreRanges: {
      excellent: '80-100: Superior cognitive flexibility',
      good: '60-79: Good attention control and flexibility',
      average: '40-59: Average cognitive flexibility',
      needsImprovement: '0-39: Difficulty with cognitive interference'
    }
  },
  'reaction-time': {
    title: 'Reaction Time Test',
    icon: <Zap size={32} color="#FFFFFF" />,
    gradient: ['#45B7D1', '#2196F3'],
    description: 'A measure of how quickly your nervous system can process information and respond to stimuli.',
    whatItMeasures: [
      'Processing speed of the nervous system',
      'Alertness and vigilance',
      'Sensorimotor integration',
      'Attention and readiness to respond',
      'Neural transmission efficiency'
    ],
    howItWorks: 'You wait for a visual stimulus (color change) and respond as quickly as possible. The test measures the time between stimulus presentation and your response across multiple trials.',
    scoringExplanation: 'Faster reaction times indicate better neural processing speed. Scores account for both average reaction time and consistency across trials. Elite athletes often have reaction times under 200ms.',
    researchBackground: 'Reaction time research dates back to the 1850s with Hermann von Helmholtz. It\'s fundamental to understanding human information processing and is used extensively in cognitive psychology and sports science.',
    clinicalUse: [
      'Assessing neurological function and integrity',
      'Monitoring effects of aging on cognitive speed',
      'Evaluating concussion and brain injury recovery',
      'Testing medication effects on alertness',
      'Screening for attention and processing disorders'
    ],
    tips: [
      'Stay relaxed but alert during the waiting period',
      'Focus on the stimulus area without staring',
      'Respond immediately when you see the change',
      'Maintain consistent finger position for all trials'
    ],
    scoreRanges: {
      excellent: '80-100: Very fast reactions (<250ms average)',
      good: '60-79: Fast reactions (250-350ms average)',
      average: '40-59: Average reactions (350-450ms average)',
      needsImprovement: '0-39: Slow reactions (>450ms average)'
    }
  },
  'tower-of-hanoi': {
    title: 'Tower of Hanoi',
    icon: <Layers size={32} color="#FFFFFF" />,
    gradient: ['#96CEB4', '#FFEAA7'],
    description: 'A classic puzzle that tests problem-solving skills, planning ability, and working memory through strategic thinking.',
    whatItMeasures: [
      'Problem-solving and logical reasoning',
      'Planning and strategic thinking',
      'Working memory capacity',
      'Spatial reasoning abilities',
      'Cognitive flexibility in strategy adjustment'
    ],
    howItWorks: 'Move all disks from one tower to another following simple rules: move one disk at a time, and never place a larger disk on a smaller one. The challenge increases with more disks.',
    scoringExplanation: 'Scores are based on efficiency (moves used vs. minimum possible) and completion time. Perfect solutions use the minimum number of moves: 2^n - 1, where n is the number of disks.',
    researchBackground: 'Invented by French mathematician Édouard Lucas in 1883, this puzzle has become a standard tool in cognitive psychology for studying problem-solving, planning, and executive function.',
    clinicalUse: [
      'Assessing executive function and planning abilities',
      'Evaluating problem-solving skills in various populations',
      'Monitoring cognitive rehabilitation progress',
      'Detecting planning deficits in neurological conditions',
      'Research on cognitive development in children'
    ],
    tips: [
      'Think several moves ahead before acting',
      'Start with smaller disk configurations to learn patterns',
      'Remember: to move n disks, you must first move n-1 disks',
      'Don\'t rush - planning time often saves total time'
    ],
    scoreRanges: {
      excellent: '80-100: Optimal strategy with minimal moves',
      good: '60-79: Efficient problem-solving with few extra moves',
      average: '40-59: Adequate problem-solving with some inefficiency',
      needsImprovement: '0-39: Difficulty with strategic planning'
    }
  },
  'spatial-memory': {
    title: 'Spatial Memory Test',
    icon: <Grid3X3 size={32} color="#FFFFFF" />,
    gradient: ['#A8EDEA', '#FED6E3'],
    description: 'A test of working memory that measures your ability to remember and reproduce spatial sequences.',
    whatItMeasures: [
      'Spatial working memory capacity',
      'Visual-spatial processing abilities',
      'Attention and concentration',
      'Sequential memory skills',
      'Spatial pattern recognition'
    ],
    howItWorks: 'Watch sequences of highlighted squares, then reproduce them in the correct order. Sequences start short and gradually increase in length to test your memory limits.',
    scoringExplanation: 'Scores reflect both accuracy and the maximum sequence length achieved. Higher scores indicate better spatial working memory. Most people can remember 5-7 spatial locations.',
    researchBackground: 'Based on the Corsi Block Test developed by Philip Corsi in 1972, spatial memory tests are crucial for understanding working memory and have been extensively studied in cognitive neuroscience.',
    clinicalUse: [
      'Assessing working memory deficits',
      'Evaluating spatial processing disorders',
      'Monitoring cognitive changes in aging',
      'Detecting early signs of dementia',
      'Research on memory and attention disorders'
    ],
    tips: [
      'Try to create a mental path connecting the squares',
      'Use verbal labels or patterns to help remember',
      'Focus intently during the presentation phase',
      'Practice with shorter sequences to build confidence'
    ],
    scoreRanges: {
      excellent: '80-100: Superior spatial memory (7+ sequence length)',
      good: '60-79: Good spatial memory (5-6 sequence length)',
      average: '40-59: Average spatial memory (4-5 sequence length)',
      needsImprovement: '0-39: Difficulty with spatial sequences (<4 length)'
    }
  },
  'decision-task': {
    title: 'Decision Task',
    icon: <Brain size={32} color="#FFFFFF" />,
    gradient: ['#8B5CF6', '#A855F7'],
    description: 'A test of decision-making, risk assessment, and learning that measures how you adapt to changing reward probabilities.',
    whatItMeasures: [
      'Decision-making under uncertainty',
      'Risk assessment and tolerance',
      'Learning from feedback and adaptation',
      'Reward sensitivity and motivation',
      'Cognitive flexibility in changing environments'
    ],
    howItWorks: 'Choose between two doors with hidden rewards. Reward probabilities change throughout the task, requiring you to learn, adapt, and make optimal decisions based on feedback.',
    scoringExplanation: 'Scores combine total rewards earned, adaptation speed to probability changes, and learning efficiency. Higher scores indicate better decision-making and learning abilities.',
    researchBackground: 'Based on probabilistic learning paradigms used in behavioral economics and neuroscience. These tasks help understand how the brain processes rewards and makes decisions under uncertainty.',
    clinicalUse: [
      'Assessing decision-making in psychiatric disorders',
      'Evaluating risk-taking behaviors',
      'Studying addiction and reward processing',
      'Monitoring treatment effects on decision-making',
      'Research on learning and adaptation mechanisms'
    ],
    tips: [
      'Pay attention to patterns in rewards over time',
      'Be willing to change strategies when patterns shift',
      'Balance exploration of new options with exploitation of good ones',
      'Don\'t get discouraged by temporary low-reward periods'
    ],
    scoreRanges: {
      excellent: '80-100: Excellent adaptation and decision-making',
      good: '60-79: Good learning and risk assessment',
      average: '40-59: Adequate decision-making abilities',
      needsImprovement: '0-39: Difficulty adapting to changing conditions'
    }
  },
  'sound-discrimination': {
    title: 'Sound Discrimination Test',
    icon: <Volume2 size={32} color="#FFFFFF" />,
    gradient: ['#10B981', '#059669'],
    description: 'A test of auditory perception that measures your ability to detect subtle differences in sound frequencies.',
    whatItMeasures: [
      'Auditory discrimination abilities',
      'Frequency processing and pitch perception',
      'Attention to auditory stimuli',
      'Auditory working memory',
      'Sound pattern recognition'
    ],
    howItWorks: 'Listen to sequences of four tones and identify whether the last tone is higher, lower, or the same as the others. The test uses various frequencies to assess your auditory discrimination abilities.',
    scoringExplanation: 'Scores are based on accuracy and response speed. Higher scores indicate better auditory processing abilities. The test accounts for both same-tone and different-tone trial performance.',
    researchBackground: 'Auditory discrimination tests are fundamental in psychoacoustics and audiology. They help understand how the auditory system processes frequency information and are used in both research and clinical settings.',
    clinicalUse: [
      'Assessing auditory processing disorders',
      'Evaluating hearing and perception abilities',
      'Monitoring age-related hearing changes',
      'Detecting central auditory processing problems',
      'Research on auditory cognition and perception'
    ],
    tips: [
      'Use headphones for the best experience',
      'Focus carefully on the last tone in each sequence',
      'Take your time to process the sounds before responding',
      'Practice distinguishing between similar frequencies'
    ],
    scoreRanges: {
      excellent: '80-100: Superior auditory discrimination',
      good: '60-79: Good frequency processing abilities',
      average: '40-59: Average auditory discrimination',
      needsImprovement: '0-39: Difficulty with sound discrimination'
    }
  }
};

export default function TaskInfo() {
  const { taskType } = useLocalSearchParams<{ taskType: TaskType }>();
  
  if (!taskType || !taskInfoData[taskType]) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Task information not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const info = taskInfoData[taskType];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Task Information</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={info.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <View style={styles.heroContent}>
              <View style={styles.heroIcon}>
                {info.icon}
              </View>
              <Text style={styles.heroTitle}>{info.title}</Text>
              <Text style={styles.heroDescription}>{info.description}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* What It Measures */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Target size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>What It Measures</Text>
          </View>
          <View style={styles.measuresList}>
            {info.whatItMeasures.map((measure, index) => (
              <View key={index} style={styles.measureItem}>
                <View style={styles.measureBullet} />
                <Text style={styles.measureText}>{measure}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Brain size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>How It Works</Text>
          </View>
          <Text style={styles.sectionText}>{info.howItWorks}</Text>
        </View>

        {/* Scoring Explanation */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>Understanding Your Score</Text>
          </View>
          <Text style={styles.sectionText}>{info.scoringExplanation}</Text>
          
          <View style={styles.scoreRanges}>
            <Text style={styles.scoreRangesTitle}>Score Ranges:</Text>
            <View style={styles.scoreRange}>
              <View style={[styles.scoreRangeIndicator, { backgroundColor: '#10B981' }]} />
              <Text style={styles.scoreRangeText}>{info.scoreRanges.excellent}</Text>
            </View>
            <View style={styles.scoreRange}>
              <View style={[styles.scoreRangeIndicator, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.scoreRangeText}>{info.scoreRanges.good}</Text>
            </View>
            <View style={styles.scoreRange}>
              <View style={[styles.scoreRangeIndicator, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.scoreRangeText}>{info.scoreRanges.average}</Text>
            </View>
            <View style={styles.scoreRange}>
              <View style={[styles.scoreRangeIndicator, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.scoreRangeText}>{info.scoreRanges.needsImprovement}</Text>
            </View>
          </View>
        </View>

        {/* Research Background */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>Research Background</Text>
          </View>
          <Text style={styles.sectionText}>{info.researchBackground}</Text>
        </View>

        {/* Clinical Use */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>Clinical Applications</Text>
          </View>
          <View style={styles.clinicalList}>
            {info.clinicalUse.map((use, index) => (
              <View key={index} style={styles.clinicalItem}>
                <View style={styles.clinicalBullet} />
                <Text style={styles.clinicalText}>{use}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>Tips for Better Performance</Text>
          </View>
          <View style={styles.tipsList}>
            {info.tips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => router.push(`/tasks/${taskType}`)}
          >
            <LinearGradient
              colors={info.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Text style={styles.actionButtonText}>Try This Test</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerBackButton: {
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
  heroSection: {
    marginBottom: 24,
  },
  heroGradient: {
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#1F2937',
    marginLeft: 12,
  },
  sectionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  measuresList: {
    gap: 12,
  },
  measureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  measureBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
    marginTop: 8,
    marginRight: 12,
  },
  measureText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 24,
  },
  scoreRanges: {
    marginTop: 20,
  },
  scoreRangesTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#374151',
    marginBottom: 12,
  },
  scoreRange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreRangeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  scoreRangeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  clinicalList: {
    gap: 12,
  },
  clinicalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  clinicalBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginTop: 8,
    marginRight: 12,
  },
  clinicalText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 24,
  },
  tipsList: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipNumberText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  tipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 24,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#EF4444',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});