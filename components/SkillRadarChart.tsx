import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polygon, Circle, Text as SvgText, Line } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface SkillData {
  memory: number;
  reactionTime: number;
  attention: number;
  problemSolving: number;
  motorControl: number;
}

interface SkillRadarChartProps {
  data: SkillData;
}

export function SkillRadarChart({ data }: SkillRadarChartProps) {
  const size = Math.min(width - 80, 280);
  const center = size / 2;
  const maxRadius = center - 40;
  
  const skills = [
    { key: 'memory', label: 'Memory', value: data.memory, angle: 0 },
    { key: 'reactionTime', label: 'Reaction', value: data.reactionTime, angle: 72 },
    { key: 'attention', label: 'Attention', value: data.attention, angle: 144 },
    { key: 'problemSolving', label: 'Problem', value: data.problemSolving, angle: 216 },
    { key: 'motorControl', label: 'Motor', value: data.motorControl, angle: 288 },
  ];

  const getPoint = (angle: number, radius: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian),
    };
  };

  const getDataPoints = () => {
    return skills.map(skill => {
      const radius = (skill.value / 100) * maxRadius;
      return getPoint(skill.angle, radius);
    });
  };

  const getGridPoints = (level: number) => {
    const radius = (level / 100) * maxRadius;
    return skills.map(skill => getPoint(skill.angle, radius));
  };

  const dataPoints = getDataPoints();
  const dataPolygon = dataPoints.map(point => `${point.x},${point.y}`).join(' ');

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Grid lines */}
        {[20, 40, 60, 80, 100].map(level => {
          const points = getGridPoints(level);
          const polygon = points.map(point => `${point.x},${point.y}`).join(' ');
          return (
            <Polygon
              key={level}
              points={polygon}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {skills.map(skill => {
          const endPoint = getPoint(skill.angle, maxRadius);
          return (
            <Line
              key={skill.key}
              x1={center}
              y1={center}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="#E5E7EB"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygon */}
        <Polygon
          points={dataPolygon}
          fill="rgba(99, 102, 241, 0.2)"
          stroke="#6366F1"
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((point, index) => (
          <Circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#6366F1"
          />
        ))}

        {/* Labels */}
        {skills.map(skill => {
          const labelPoint = getPoint(skill.angle, maxRadius + 20);
          return (
            <SvgText
              key={skill.key}
              x={labelPoint.x}
              y={labelPoint.y}
              fontSize="12"
              fill="#374151"
              textAnchor="middle"
              alignmentBaseline="middle"
              fontFamily="Inter-Medium"
            >
              {skill.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});