import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Info } from 'lucide-react-native';
import { router } from 'expo-router';
import { TaskType } from '@/types/performance';

interface TaskCardProps {
  taskType: TaskType;
  title: string;
  description: string;
  icon: React.ReactNode;
  onPress: () => void;
  lastScore?: number;
  gradient: string[];
}

export function TaskCard({ 
  taskType, 
  title, 
  description, 
  icon, 
  onPress, 
  lastScore,
  gradient 
}: TaskCardProps) {
  const handleInfoPress = () => {
    router.push(`/info/${taskType}`);
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              {icon}
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={handleInfoPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Info size={20} color="rgba(255, 255, 255, 0.8)" />
              </TouchableOpacity>
              {lastScore !== undefined && (
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreText}>{lastScore}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradient: {
    padding: 20,
    minHeight: 120,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scoreText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: '#1F2937',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  description: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
});