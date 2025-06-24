import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Hand, Eye, Zap, Layers, Grid3x3 as Grid3X3, Brain, Volume2 } from 'lucide-react-native';
import { TaskCard } from '@/components/TaskCard';

export default function Tasks() {
  const tasks = [
    {
      taskType: 'tapping-speed' as const,
      title: 'Tapping Speed',
      description: 'Tap as fast as you can to test your motor speed and coordination',
      icon: <Hand size={24} color="#FFFFFF" />,
      gradient: ['#FF6B6B', '#FF8E53'],
      route: '/tasks/tapping-speed',
    },
    {
      taskType: 'stroop-test' as const,
      title: 'Stroop Test',
      description: 'Test your cognitive flexibility and attention control',
      icon: <Eye size={24} color="#FFFFFF" />,
      gradient: ['#4ECDC4', '#44A08D'],
      route: '/tasks/stroop-test',
    },
    {
      taskType: 'reaction-time' as const,
      title: 'Reaction Time',
      description: 'Measure how quickly you respond to visual stimuli',
      icon: <Zap size={24} color="#FFFFFF" />,
      gradient: ['#45B7D1', '#2196F3'],
      route: '/tasks/reaction-time',
    },
    {
      taskType: 'tower-of-hanoi' as const,
      title: 'Tower of Hanoi',
      description: 'Solve this classic puzzle to test your problem-solving skills',
      icon: <Layers size={24} color="#FFFFFF" />,
      gradient: ['#96CEB4', '#FFEAA7'],
      route: '/tasks/tower-of-hanoi',
    },
    {
      taskType: 'spatial-memory' as const,
      title: 'Spatial Memory',
      description: 'Remember and reproduce sequences to test your working memory',
      icon: <Grid3X3 size={24} color="#FFFFFF" />,
      gradient: ['#A8EDEA', '#FED6E3'],
      route: '/tasks/spatial-memory',
    },
    {
      taskType: 'decision-task' as const,
      title: 'Decision Task',
      description: 'Make choices between doors to test risk-taking and learning',
      icon: <Brain size={24} color="#FFFFFF" />,
      gradient: ['#8B5CF6', '#A855F7'],
      route: '/tasks/decision-task',
    },
    {
      taskType: 'sound-discrimination' as const,
      title: 'Sound Discrimination',
      description: 'Listen to tone sequences and identify pitch differences',
      icon: <Volume2 size={24} color="#FFFFFF" />,
      gradient: ['#10B981', '#059669'],
      route: '/tasks/sound-discrimination',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cognitive Tasks</Text>
        <Text style={styles.subtitle}>
          Choose a task to challenge your brain and improve your cognitive performance
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tasks.map((task) => (
          <TaskCard
            key={task.taskType}
            taskType={task.taskType}
            title={task.title}
            description={task.description}
            icon={task.icon}
            gradient={task.gradient}
            onPress={() => router.push(task.route)}
          />
        ))}
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
});