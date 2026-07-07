import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { PresentationSlide } from '@freshr/shared';

const G = '#84e487';
const B = '#000000';
const W = '#FFFFFF';

interface SlideThumbnailProps {
  slide: PresentationSlide;
  index: number;
  selected: boolean;
  onPress: () => void;
}

export function SlideThumbnail({ slide, index, selected, onPress }: SlideThumbnailProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      {/* 16:9 thumbnail box */}
      <View
        style={[
          styles.thumbnailBox,
          selected && styles.thumbnailBoxSelected,
        ]}
      >
        {/* Green strip */}
        <View style={styles.greenStrip} />

        <View style={styles.thumbnailContent}>
          {/* Title preview */}
          <Text style={styles.titlePreview} numberOfLines={1}>
            {slide.title || slide.caption || slide.quote || 'Untitled'}
          </Text>

          {/* Bullet preview lines */}
          {slide.bullets.slice(0, 3).map((bullet, i) => (
            <View key={i} style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletPreview} numberOfLines={1}>
                {bullet}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Slide number */}
      <Text style={[styles.slideNumber, selected && styles.slideNumberSelected]}>
        {index + 1}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  thumbnailBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: 1,
    borderColor: '#dddddd',
    backgroundColor: W,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  thumbnailBoxSelected: {
    borderWidth: 2,
    borderColor: B,
  },
  greenStrip: {
    width: 4,
    backgroundColor: G,
  },
  thumbnailContent: {
    flex: 1,
    padding: 5,
    gap: 3,
    overflow: 'hidden',
  },
  titlePreview: {
    fontSize: 7,
    fontWeight: '700',
    color: B,
    lineHeight: 9,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'flex-start',
  },
  bulletDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: G,
    marginTop: 3,
  },
  bulletPreview: {
    fontSize: 5,
    color: '#888888',
    flex: 1,
    lineHeight: 7,
  },
  slideNumber: {
    fontSize: 10,
    color: '#aaaaaa',
    fontWeight: '400',
    marginTop: 5,
    textAlign: 'center',
  },
  slideNumberSelected: {
    color: B,
    fontWeight: '700',
  },
});
