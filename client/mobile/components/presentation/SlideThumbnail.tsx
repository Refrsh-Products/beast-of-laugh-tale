import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { PresentationSlide } from '@freshr/shared';
import { cn } from '@/lib/utils';
import { SLIDE_PALETTE } from './slidePalette';

interface SlideThumbnailProps {
  slide: PresentationSlide;
  index: number;
  selected: boolean;
  onPress: () => void;
}

/**
 * A miniature of one slide in the navigator grid.
 *
 * Two colour systems meet here, on purpose. Everything *inside* the 16:9 box is
 * the slide itself, so it uses SLIDE_PALETTE and stays fixed in both themes —
 * a thumbnail that inverted would misrepresent what the deck actually looks
 * like. Everything *outside* it is app chrome (the row divider, the selected
 * outline, the slide number) and uses tokens like the rest of the app.
 */
export function SlideThumbnail({ slide, index, selected, onPress }: SlideThumbnailProps) {
  return (
    <Pressable onPress={onPress} className="border-border border-b-hairline p-2.5">
      {/* 16:9 thumbnail box */}
      <View
        className={cn('aspect-video w-full flex-row overflow-hidden border', {
          'border-primary border-2': selected,
          'border-border': !selected,
        })}
        style={styles.page}>
        {/* Green strip */}
        <View style={styles.greenStrip} />

        <View className="flex-1 gap-[3px] overflow-hidden p-[5px]">
          {/* Title preview */}
          <Text style={styles.titlePreview} numberOfLines={1}>
            {slide.title || slide.caption || slide.quote || 'Untitled'}
          </Text>

          {/* Bullet preview lines */}
          {slide.bullets.slice(0, 3).map((bullet, i) => (
            <View key={i} className="flex-row items-start gap-[3px]">
              <View style={styles.bulletDot} />
              <Text style={styles.bulletPreview} numberOfLines={1}>
                {bullet}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Slide number */}
      <Text
        className={cn(
          'mt-[5px] text-center text-[10px]',
          selected ? 'text-foreground font-bold' : 'text-muted-foreground font-normal'
        )}>
        {index + 1}
      </Text>
    </Pressable>
  );
}

// The slide's own surface. Fixed by SLIDE_PALETTE, not the theme — see the
// component doc above.
const styles = StyleSheet.create({
  page: {
    backgroundColor: SLIDE_PALETTE.paper,
  },
  greenStrip: {
    width: 4,
    backgroundColor: SLIDE_PALETTE.green,
  },
  titlePreview: {
    fontSize: 7,
    fontWeight: '700',
    color: SLIDE_PALETTE.ink,
    lineHeight: 9,
  },
  bulletDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: SLIDE_PALETTE.green,
    marginTop: 3,
  },
  bulletPreview: {
    fontSize: 5,
    color: SLIDE_PALETTE.footer,
    flex: 1,
    lineHeight: 7,
  },
});
