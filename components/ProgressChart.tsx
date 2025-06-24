import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { UserPerformance } from '@/types/performance';

const { width } = Dimensions.get('window');

interface ProgressChartProps {
  performances: UserPerformance[];
  timeRange: 7 | 14 | 30;
}

export function ProgressChart({ performances, timeRange }: ProgressChartProps) {
  // Simple mock chart implementation
  const chartData = performances.slice(-timeRange).map((perf, index) => ({
    day: index + 1,
    score: perf.score,
  }));

  const maxScore = Math.max(...chartData.map(d => d.score), 100);
  const chartWidth = width - 80;
  const chartHeight = 150;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance Trend</Text>
      <View style={styles.chart}>
        <View style={styles.chartArea}>
          {chartData.map((data, index) => (
            <View key={index} style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    height: (data.score / maxScore) * chartHeight,
                    backgroundColor: data.score >= 80 ? '#10B981' : data.score >= 60 ? '#F59E0B' : '#EF4444',
                  }
                ]}
              />
              <Text style={styles.barLabel}>{data.day}</Text>
            </View>
          ))}
        </View>
        <View style={styles.yAxis}>
          <Text style={styles.axisLabel}>100</Text>
          <Text style={styles.axisLabel}>50</Text>
          <Text style={styles.axisLabel}>0</Text>
        </View>
      </View>
      {chartData.length === 0 && (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>No performance data available for the selected time range</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 150,
    paddingRight: 16,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 30,
  },
  bar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
    minHeight: 4,
  },
  barLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
  },
  yAxis: {
    justifyContent: 'space-between',
    height: 150,
    paddingVertical: 4,
  },
  axisLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
  },
  noData: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  noDataText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});