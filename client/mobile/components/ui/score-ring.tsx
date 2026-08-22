import { View, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { useThemeColors } from '@/hooks/useThemeColors';

import Svg, { Circle } from 'react-native-svg';

/** Score bands, high to low. The first one the score clears wins. */
const BANDS = [
  { min: 75, message: 'Great Job!', token: 'success' },
  { min: 50, message: 'Good Effort!', token: 'warning' },
  { min: 0, message: 'Keep Trying!', token: 'destructive' },
] as const;

function ScoreRing({ scorePercent }: { scorePercent: number }) {
  // react-native-svg takes colours as props, not classNames, so the ring is one
  // of the few places that reads the theme directly rather than via a utility.
  const colors = useThemeColors();

  const size = 140;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * scorePercent) / 100;

  const band = BANDS.find((b) => scorePercent >= b.min) ?? BANDS[BANDS.length - 1];

  return (
    <View style={ringStyles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors[band.token]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={ringStyles.labelOverlay}>
        <Text className="text-foreground text-[28px] font-extrabold leading-[34px]">
          {scorePercent}%
        </Text>
        <Text className="text-muted-foreground mt-0.5 text-xs font-medium">{band.message}</Text>
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
});

export { ScoreRing };
