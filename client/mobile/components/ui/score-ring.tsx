import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';

import Svg, { Circle } from 'react-native-svg';

function ScoreRing({ scorePercent }: { scorePercent: number }) {
  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * scorePercent) / 100;

  let ringColor = '#22C55E'; // green
  if (scorePercent < 50)
    ringColor = '#EF4444'; // red
  else if (scorePercent < 75) ringColor = '#F59E0B'; // amber

  let message = 'Great Job!';
  if (scorePercent < 50) message = 'Keep Trying!';
  else if (scorePercent < 75) message = 'Good Effort!';

  return (
    <View style={ringStyles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E4E4E7"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={ringStyles.labelOverlay}>
        <Text style={ringStyles.percentText}>{scorePercent}%</Text>
        <Text style={ringStyles.messageText}>{message}</Text>
      </View>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  labelOverlay: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#18181B',
    lineHeight: 34,
  },
  messageText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#71717A',
    marginTop: 2,
  },
});

export { ScoreRing };
