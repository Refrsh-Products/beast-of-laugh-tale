import { View, Text, Image, StyleSheet } from 'react-native';
import type { PresentationSlide } from '@freshr/shared';

const G = '#84e487';
const B = '#000000';
const W = '#FFFFFF';

interface SlideRendererProps {
  slide: PresentationSlide;
  width: number;
  height: number;
}

export function SlideRenderer({ slide, width, height }: SlideRendererProps) {
  // Scale font sizes relative to slide width (base = 960px web equivalent)
  const scale = width / 960;
  const fs = (base: number) => base * scale;

  const greenStrip = (
    <View style={{ width: 10 * scale, backgroundColor: G, borderRadius: 2 }} />
  );

  const titleBlock = (
    <View style={{ marginBottom: fs(8) }}>
      <Text
        style={{
          fontWeight: '800',
          fontSize: fs(32),
          color: B,
          letterSpacing: -0.5,
          lineHeight: fs(36),
        }}
        numberOfLines={3}
      >
        {slide.title}
      </Text>
      <View style={{ height: 3 * scale, backgroundColor: B, marginTop: fs(6) }} />
    </View>
  );

  const bulletList = (items: string[], fontSize = fs(16)) => (
    <View style={{ gap: fs(8) }}>
      {items.map((b, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: fs(8), alignItems: 'flex-start' }}>
          <Text style={{ color: G, fontWeight: '700', fontSize, flexShrink: 0 }}>•</Text>
          <Text style={{ fontSize, color: B, lineHeight: fontSize * 1.55, flex: 1 }}>{b}</Text>
        </View>
      ))}
    </View>
  );

  const imageStyle = (w: number | string, h: number | string): any => ({
    width: w,
    height: h,
    borderWidth: 2 * scale,
    borderColor: B,
    resizeMode: 'cover' as const,
  });

  const content = (() => {
    switch (slide.layout) {
      case 'bullets':
        return (
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {greenStrip}
            <View style={{ flex: 1, justifyContent: 'center', gap: fs(10), paddingLeft: fs(14), overflow: 'hidden' }}>
              {titleBlock}
              {bulletList(slide.bullets)}
            </View>
          </View>
        );

      case 'title-only':
        return (
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {greenStrip}
            <View style={{ flex: 1, justifyContent: 'center', paddingLeft: fs(14) }}>
              <Text
                style={{
                  fontSize: fs(48),
                  fontWeight: '800',
                  color: B,
                  letterSpacing: -1,
                  lineHeight: fs(52),
                }}
              >
                {slide.title}
              </Text>
            </View>
          </View>
        );

      case 'body-text':
        return (
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {greenStrip}
            <View style={{ flex: 1, justifyContent: 'center', gap: fs(10), paddingLeft: fs(14), overflow: 'hidden' }}>
              {titleBlock}
              <Text style={{ fontSize: fs(14), color: '#333333', lineHeight: fs(25) }}>
                {slide.body_text || slide.bullets.join(' ')}
              </Text>
            </View>
          </View>
        );

      case 'two-col': {
        const half = Math.ceil(slide.bullets.length / 2);
        const left = slide.bullets.slice(0, half);
        const right = slide.bullets.slice(half);
        return (
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', marginBottom: fs(8) }}>
              {greenStrip}
              <View style={{ paddingLeft: fs(14), flex: 1 }}>{titleBlock}</View>
            </View>
            <View style={{ flexDirection: 'row', flex: 1, gap: fs(16), overflow: 'hidden' }}>
              <View style={{ flex: 1, borderRightWidth: 1, borderRightColor: '#eeeeee', paddingRight: fs(16) }}>
                {bulletList(left, fs(14))}
              </View>
              <View style={{ flex: 1 }}>
                {bulletList(right, fs(14))}
              </View>
            </View>
          </View>
        );
      }

      case 'image-right':
        return (
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', marginBottom: fs(8) }}>
              {greenStrip}
              <View style={{ paddingLeft: fs(14), flex: 1 }}>{titleBlock}</View>
            </View>
            <View style={{ flexDirection: 'row', flex: 1, gap: fs(16), overflow: 'hidden' }}>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                {bulletList(slide.bullets)}
              </View>
              <View style={{ width: '42%' }}>
                {slide.images[0] && (
                  <Image source={{ uri: slide.images[0].url }} style={imageStyle('100%', '100%')} />
                )}
              </View>
            </View>
          </View>
        );

      case 'image-left':
        return (
          <View style={{ flex: 1, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', marginBottom: fs(8) }}>
              {greenStrip}
              <View style={{ paddingLeft: fs(14), flex: 1 }}>{titleBlock}</View>
            </View>
            <View style={{ flexDirection: 'row', flex: 1, gap: fs(16), overflow: 'hidden' }}>
              <View style={{ width: '42%' }}>
                {slide.images[0] && (
                  <Image source={{ uri: slide.images[0].url }} style={imageStyle('100%', '100%')} />
                )}
              </View>
              <View style={{ flex: 1, justifyContent: 'center' }}>
                {bulletList(slide.bullets)}
              </View>
            </View>
          </View>
        );

      case 'full-image':
        return (
          <View style={{ flex: 1, gap: fs(6), overflow: 'hidden' }}>
            <View style={{ flex: 1, overflow: 'hidden' }}>
              {slide.images[0] && (
                <Image source={{ uri: slide.images[0].url }} style={imageStyle('100%', '100%')} />
              )}
            </View>
            {(slide.caption || slide.title) ? (
              <Text style={{ fontSize: fs(12), color: '#555555', fontStyle: 'italic', paddingLeft: fs(4) }}>
                {slide.caption || slide.title}
              </Text>
            ) : null}
          </View>
        );

      case 'image-top':
        return (
          <View style={{ flex: 1, gap: fs(10), overflow: 'hidden' }}>
            <View style={{ flex: 1, maxHeight: '50%', overflow: 'hidden' }}>
              {slide.images[0] && (
                <Image source={{ uri: slide.images[0].url }} style={imageStyle('100%', '100%')} />
              )}
            </View>
            <View style={{ flexDirection: 'row', overflow: 'hidden', flex: 1 }}>
              {greenStrip}
              <View style={{ flex: 1, gap: fs(6), paddingLeft: fs(14) }}>
                <View>
                  <Text style={{ fontWeight: '800', fontSize: fs(22), color: B }}>
                    {slide.title}
                  </Text>
                  <View style={{ height: 2 * scale, backgroundColor: B, marginTop: fs(4) }} />
                </View>
                {bulletList(slide.bullets.slice(0, 2), fs(13))}
              </View>
            </View>
          </View>
        );

      case 'quote':
        return (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: fs(32) }}>
            <Text style={{ fontSize: fs(40), fontWeight: '800', color: G, lineHeight: fs(44), marginBottom: fs(4) }}>
              ❝
            </Text>
            <Text
              style={{
                fontSize: fs(22),
                fontWeight: '700',
                color: B,
                lineHeight: fs(30),
                letterSpacing: -0.3,
                marginBottom: fs(10),
                textAlign: 'center',
              }}
            >
              {slide.quote || slide.title}
            </Text>
            {(slide.quote_source || slide.bullets[0]) ? (
              <Text style={{ fontSize: fs(11), color: '#666666', letterSpacing: 0.5, textAlign: 'center' }}>
                — {slide.quote_source || slide.bullets[0]}
              </Text>
            ) : null}
          </View>
        );

      case 'two-images':
        return (
          <View style={{ flex: 1, overflow: 'hidden', gap: fs(8) }}>
            <View style={{ flexDirection: 'row', marginBottom: fs(4) }}>
              {greenStrip}
              <View style={{ paddingLeft: fs(14), flex: 1 }}>{titleBlock}</View>
            </View>
            <View style={{ flexDirection: 'row', flex: 1, gap: fs(12), overflow: 'hidden' }}>
              {[0, 1].map((idx) => (
                <View key={idx} style={{ flex: 1, gap: fs(4), overflow: 'hidden' }}>
                  <View style={{ flex: 1, overflow: 'hidden' }}>
                    {slide.images[idx] && (
                      <Image source={{ uri: slide.images[idx].url }} style={imageStyle('100%', '100%')} />
                    )}
                  </View>
                  {slide.bullets[idx] ? (
                    <Text style={{ fontSize: fs(10), color: '#555555', textAlign: 'center' }}>
                      {slide.bullets[idx]}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </View>
        );

      default:
        // Fallback: same as bullets
        return (
          <View style={{ flexDirection: 'row', flex: 1 }}>
            {greenStrip}
            <View style={{ flex: 1, justifyContent: 'center', gap: fs(10), paddingLeft: fs(14), overflow: 'hidden' }}>
              {titleBlock}
              {bulletList(slide.bullets)}
            </View>
          </View>
        );
    }
  })();

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: W,
        padding: fs(14),
      }}
    >
      <View style={{ flex: 1, overflow: 'hidden' }}>
        {content}
      </View>
      {/* Footer */}
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: '#dddddd',
          marginTop: fs(10),
          paddingTop: fs(6),
          flexDirection: 'row',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: fs(9), color: '#888888', letterSpacing: 1 }}>
          {slide.title?.toUpperCase().slice(0, 30)}
        </Text>
        <Text style={{ fontSize: fs(9), color: '#888888' }}>
          {slide.order_index + 1}
        </Text>
      </View>
    </View>
  );
}
