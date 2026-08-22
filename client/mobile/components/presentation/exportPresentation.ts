import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { PresentationSession, PresentationSlide } from '@freshr/shared';

import { SLIDE_PALETTE } from './slidePalette';

const G = SLIDE_PALETTE.green;
const B = SLIDE_PALETTE.ink;

/**
 * Generates a landscape PDF from the presentation data using expo-print
 * and opens the native share sheet via expo-sharing.
 */
export async function exportAsPdf(presentation: PresentationSession): Promise<void> {
  const slides = presentation.slides ?? [];
  if (slides.length === 0) return;

  const html = buildHtml(presentation.topic, slides);

  const { uri } = await Print.printToFileAsync({
    html,
    width: 792, // 11 inches * 72 dpi (landscape letter)
    height: 612, // 8.5 inches * 72 dpi
  });

  await Sharing.shareAsync(uri, {
    UTI: 'com.adobe.pdf',
    mimeType: 'application/pdf',
    dialogTitle: `${presentation.topic || 'Presentation'}.pdf`,
  });
}

function buildHtml(topic: string, slides: PresentationSlide[]): string {
  const slidePages = slides
    .map((slide, i) => buildSlideHtml(slide, topic, slides.length, i))
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        @page { size: 11in 8.5in; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Courier New', monospace; }
        .slide {
          width: 11in;
          height: 8.5in;
          padding: 0.5in 0.6in 0.4in;
          display: flex;
          flex-direction: column;
          page-break-after: always;
          background: white;
        }
        .slide:last-child { page-break-after: auto; }
        .slide-content { flex: 1; display: flex; overflow: hidden; }
        .green-strip { width: 8px; background: ${G}; flex-shrink: 0; margin-right: 16px; border-radius: 2px; }
        .slide-title {
          font-size: 28px; font-weight: 800; color: ${B};
          border-bottom: 3px solid ${B}; padding-bottom: 6px; margin-bottom: 12px;
          letter-spacing: -0.5px;
        }
        .bullet-list { list-style: none; padding: 0; }
        .bullet-list li {
          font-size: 16px; color: ${B}; line-height: 1.7; margin-bottom: 6px;
          padding-left: 16px; position: relative;
        }
        .bullet-list li::before {
          content: '•'; color: ${G}; font-weight: 700; position: absolute; left: 0;
        }
        .body-text { font-size: 15px; color: ${SLIDE_PALETTE.body}; line-height: 1.8; }
        .quote-mark { font-size: 48px; font-weight: 800; color: ${G}; text-align: center; }
        .quote-text { font-size: 22px; font-weight: 700; color: ${B}; text-align: center; line-height: 1.4; margin-bottom: 12px; }
        .quote-source { font-size: 13px; color: ${SLIDE_PALETTE.source}; text-align: center; }
        .slide-footer {
          border-top: 1px solid ${SLIDE_PALETTE.rule}; margin-top: 12px; padding-top: 6px;
          display: flex; justify-content: space-between; font-size: 10px; color: ${SLIDE_PALETTE.footer};
          letter-spacing: 1px; flex-shrink: 0;
        }
        .slide-img { width: 100%; height: 100%; object-fit: cover; border: 2px solid ${B}; }
        .two-col { display: flex; flex: 1; gap: 24px; }
        .two-col > div { flex: 1; }
        .caption { font-size: 13px; color: ${SLIDE_PALETTE.caption}; font-style: italic; margin-top: 6px; }
      </style>
    </head>
    <body>
      ${slidePages}
    </body>
    </html>
  `;
}

function buildSlideHtml(
  slide: PresentationSlide,
  topic: string,
  total: number,
  _index: number
): string {
  const footer = `
    <div class="slide-footer">
      <span>${(topic || '').toUpperCase()}</span>
      <span>${slide.order_index + 1} / ${total}</span>
    </div>
  `;

  const bulletsHtml = (items: string[]) =>
    `<ul class="bullet-list">${items.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>`;

  const imgTag = (url: string) => `<img src="${escapeHtml(url)}" class="slide-img" />`;

  let content = '';

  switch (slide.layout) {
    case 'bullets':
      content = `
        <div class="slide-content">
          <div class="green-strip"></div>
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
            <div class="slide-title">${escapeHtml(slide.title)}</div>
            ${bulletsHtml(slide.bullets)}
          </div>
        </div>
      `;
      break;

    case 'title-only':
      content = `
        <div class="slide-content">
          <div class="green-strip"></div>
          <div style="flex:1;display:flex;align-items:center">
            <div style="font-size:40px;font-weight:800;color:${B};letter-spacing:-1px">
              ${escapeHtml(slide.title)}
            </div>
          </div>
        </div>
      `;
      break;

    case 'body-text':
      content = `
        <div class="slide-content">
          <div class="green-strip"></div>
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
            <div class="slide-title">${escapeHtml(slide.title)}</div>
            <div class="body-text">${escapeHtml(slide.body_text || slide.bullets.join(' '))}</div>
          </div>
        </div>
      `;
      break;

    case 'two-col': {
      const half = Math.ceil(slide.bullets.length / 2);
      content = `
        <div class="slide-content">
          <div style="flex:1;display:flex;flex-direction:column">
            <div style="display:flex"><div class="green-strip"></div><div class="slide-title">${escapeHtml(slide.title)}</div></div>
            <div class="two-col">
              <div>${bulletsHtml(slide.bullets.slice(0, half))}</div>
              <div>${bulletsHtml(slide.bullets.slice(half))}</div>
            </div>
          </div>
        </div>
      `;
      break;
    }

    case 'image-right':
      content = `
        <div class="slide-content">
          <div style="flex:1;display:flex;flex-direction:column">
            <div style="display:flex"><div class="green-strip"></div><div class="slide-title">${escapeHtml(slide.title)}</div></div>
            <div style="display:flex;flex:1;gap:20px">
              <div style="flex:1">${bulletsHtml(slide.bullets)}</div>
              <div style="width:42%">${slide.images[0] ? imgTag(slide.images[0].url) : ''}</div>
            </div>
          </div>
        </div>
      `;
      break;

    case 'image-left':
      content = `
        <div class="slide-content">
          <div style="flex:1;display:flex;flex-direction:column">
            <div style="display:flex"><div class="green-strip"></div><div class="slide-title">${escapeHtml(slide.title)}</div></div>
            <div style="display:flex;flex:1;gap:20px">
              <div style="width:42%">${slide.images[0] ? imgTag(slide.images[0].url) : ''}</div>
              <div style="flex:1">${bulletsHtml(slide.bullets)}</div>
            </div>
          </div>
        </div>
      `;
      break;

    case 'full-image':
      content = `
        <div class="slide-content">
          <div style="flex:1;display:flex;flex-direction:column">
            <div style="flex:1">${slide.images[0] ? imgTag(slide.images[0].url) : ''}</div>
            ${slide.caption || slide.title ? `<div class="caption">${escapeHtml(slide.caption || slide.title)}</div>` : ''}
          </div>
        </div>
      `;
      break;

    case 'image-top':
      content = `
        <div class="slide-content">
          <div style="flex:1;display:flex;flex-direction:column">
            <div style="flex:0 0 50%">${slide.images[0] ? imgTag(slide.images[0].url) : ''}</div>
            <div style="display:flex;padding-top:12px">
              <div class="green-strip"></div>
              <div>
                <div class="slide-title" style="font-size:20px">${escapeHtml(slide.title)}</div>
                ${bulletsHtml(slide.bullets.slice(0, 2))}
              </div>
            </div>
          </div>
        </div>
      `;
      break;

    case 'quote':
      content = `
        <div class="slide-content" style="align-items:center;justify-content:center">
          <div style="text-align:center;padding:0 2em">
            <div class="quote-mark">❝</div>
            <div class="quote-text">${escapeHtml(slide.quote || slide.title)}</div>
            ${slide.quote_source || slide.bullets[0] ? `<div class="quote-source">— ${escapeHtml(slide.quote_source || slide.bullets[0])}</div>` : ''}
          </div>
        </div>
      `;
      break;

    case 'two-images':
      content = `
        <div class="slide-content">
          <div style="flex:1;display:flex;flex-direction:column">
            <div style="display:flex"><div class="green-strip"></div><div class="slide-title">${escapeHtml(slide.title)}</div></div>
            <div style="display:flex;flex:1;gap:16px">
              <div style="flex:1;display:flex;flex-direction:column;gap:6px">
                <div style="flex:1">${slide.images[0] ? imgTag(slide.images[0].url) : ''}</div>
                ${slide.bullets[0] ? `<div class="caption" style="text-align:center">${escapeHtml(slide.bullets[0])}</div>` : ''}
              </div>
              <div style="flex:1;display:flex;flex-direction:column;gap:6px">
                <div style="flex:1">${slide.images[1] ? imgTag(slide.images[1].url) : ''}</div>
                ${slide.bullets[1] ? `<div class="caption" style="text-align:center">${escapeHtml(slide.bullets[1])}</div>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
      break;

    default:
      content = `
        <div class="slide-content">
          <div class="green-strip"></div>
          <div style="flex:1;display:flex;flex-direction:column;justify-content:center">
            <div class="slide-title">${escapeHtml(slide.title)}</div>
            ${bulletsHtml(slide.bullets)}
          </div>
        </div>
      `;
  }

  return `<div class="slide">${content}${footer}</div>`;
}

function escapeHtml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
