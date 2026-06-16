import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PptxGenJS from "pptxgenjs";
import type {
  PresentationSession,
  PresentationSlide,
} from "@freshr/shared";
import { renderSlideContent, B, G } from "./SlideLayouts";

const SLIDE_W_PX = 960;
const SLIDE_H_PX = 540;
const SLIDE_H_IN = 5.625;
const GREY = "888888";

// ─── PDF ─────────────────────────────────────────────────────────────────────

async function captureSlide(
  slide: PresentationSlide,
  topic: string,
  total: number,
): Promise<HTMLCanvasElement> {
  const container = document.createElement("div");
  container.style.cssText = `position:fixed;left:-9999px;top:-9999px;width:${SLIDE_W_PX}px;height:${SLIDE_H_PX}px;overflow:hidden;background:white;font-size:16px;`;
  document.body.appendChild(container);

  const root = createRoot(container);
  flushSync(() => {
    root.render(
      <div
        style={{
          width: SLIDE_W_PX,
          height: SLIDE_H_PX,
          background: "white",
          display: "flex",
          flexDirection: "column",
          padding: "12px 12px 8px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {renderSlideContent(slide)}
        </div>
        <div
          style={{
            borderTop: "1px solid #ddd",
            marginTop: 8,
            paddingTop: 4,
            display: "flex",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 9,
              color: "#000000",
              letterSpacing: "0.1em",
            }}
          >
            {topic?.toUpperCase()}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: 9, color: "#000000" }}>
            {slide.order_index + 1} / {total}
          </span>
        </div>
      </div>,
    );
  });

  await document.fonts.ready;

  const canvas = await html2canvas(container, {
    scale: 1,
    useCORS: true,
    allowTaint: true,
    logging: false,
    width: SLIDE_W_PX,
    height: SLIDE_H_PX,
  });

  root.unmount();
  document.body.removeChild(container);

  return canvas;
}

export async function exportAsPdf(
  presentation: PresentationSession,
): Promise<void> {
  const slides = presentation.slides ?? [];
  if (slides.length === 0) return;

  const pageW = 254;
  const pageH = 142.875;
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [pageW, pageH],
  });

  for (let i = 0; i < slides.length; i++) {
    if (i > 0) pdf.addPage([pageW, pageH], "landscape");
    const canvas = await captureSlide(
      slides[i],
      presentation.topic,
      slides.length,
    );
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    pdf.addImage(imgData, "JPEG", 0, 0, pageW, pageH);
  }

  pdf.save(`${presentation.topic || "presentation"}.pdf`);
}

// ─── PPTX ────────────────────────────────────────────────────────────────────

async function fetchBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function buildPptxSlide(
  pres: PptxGenJS,
  slide: PresentationSlide,
  topic: string,
  total: number,
): Promise<void> {
  const s = pres.addSlide();

  // Green left strip
  s.addShape("rect" as any, {
    x: 0,
    y: 0,
    w: 0.08,
    h: SLIDE_H_IN,
    fill: { color: G.replace("#", "") },
    line: { width: 0, color: G.replace("#", "") },
  });

  // Footer
  const fy = SLIDE_H_IN - 0.28;
  s.addText(topic?.toUpperCase() ?? "", {
    x: 0.2,
    y: fy,
    w: 5,
    h: 0.22,
    fontSize: 7,
    color: GREY,
    fontFace: "Courier New",
  });
  s.addText(`${slide.order_index + 1} / ${total}`, {
    x: 7.5,
    y: fy,
    w: 2.3,
    h: 0.22,
    fontSize: 7,
    color: GREY,
    fontFace: "Courier New",
    align: "right",
  });

  const FONT = "Courier New";
  const BLACK = B.replace("#", "");

  function titleBlock(x: number, y: number, w: number) {
    s.addText(slide.title || "", {
      x,
      y,
      w,
      h: 0.75,
      fontSize: 22,
      bold: true,
      color: BLACK,
      fontFace: FONT,
      charSpacing: -0.5,
    });
    s.addShape("rect" as any, {
      x,
      y: y + 0.75,
      w,
      h: 0.015,
      fill: { color: BLACK },
      line: { width: 0, color: BLACK },
    });
  }

  function bulletsBlock(
    x: number,
    y: number,
    w: number,
    h: number,
    items: string[],
    size = 13,
  ) {
    if (!items.length) return;
    s.addText(
      items.map((b) => ({
        text: b,
        options: {
          bullet: { color: G.replace("#", "") } as any,
          breakLine: true,
        },
      })),
      {
        x,
        y,
        w,
        h,
        fontSize: size,
        color: BLACK,
        fontFace: FONT,
        valign: "top",
      },
    );
  }

  async function imageBlock(
    x: number,
    y: number,
    w: number,
    h: number,
    url: string,
  ) {
    const b64 = await fetchBase64(url);
    if (b64) s.addImage({ data: b64, x, y, w, h });
  }

  switch (slide.layout) {
    case "bullets":
      titleBlock(0.2, 0.25, 9.5);
      bulletsBlock(0.2, 1.15, 9.5, 4.0, slide.bullets);
      break;

    case "title-only":
      s.addText(slide.title || "", {
        x: 0.2,
        y: 1.4,
        w: 9.5,
        h: 2.8,
        fontSize: 34,
        bold: true,
        color: BLACK,
        fontFace: FONT,
        valign: "middle",
      });
      break;

    case "body-text":
      titleBlock(0.2, 0.25, 9.5);
      s.addText(slide.body_text || "", {
        x: 0.2,
        y: 1.15,
        w: 9.5,
        h: 4.0,
        fontSize: 13,
        color: "333333",
        fontFace: FONT,
        valign: "top",
      });
      break;

    case "two-col": {
      titleBlock(0.2, 0.25, 9.5);
      const half = Math.ceil(slide.bullets.length / 2);
      bulletsBlock(0.2, 1.15, 4.6, 4.0, slide.bullets.slice(0, half));
      bulletsBlock(5.0, 1.15, 4.6, 4.0, slide.bullets.slice(half));
      break;
    }

    case "image-right":
      titleBlock(0.2, 0.25, 9.5);
      bulletsBlock(0.2, 1.15, 5.2, 4.0, slide.bullets);
      if (slide.images[0])
        await imageBlock(5.6, 1.15, 4.2, 4.0, slide.images[0].url);
      break;

    case "image-left":
      titleBlock(0.2, 0.25, 9.5);
      if (slide.images[0])
        await imageBlock(0.2, 1.15, 4.2, 4.0, slide.images[0].url);
      bulletsBlock(4.6, 1.15, 5.2, 4.0, slide.bullets);
      break;

    case "full-image":
      if (slide.images[0])
        await imageBlock(0.2, 0.2, 9.6, 4.8, slide.images[0].url);
      if (slide.caption)
        s.addText(slide.caption, {
          x: 0.2,
          y: 5.05,
          w: 9.6,
          h: 0.3,
          fontSize: 10,
          color: "555555",
          italic: true,
          fontFace: FONT,
        });
      break;

    case "image-top":
      if (slide.images[0])
        await imageBlock(0.2, 0.2, 9.6, 2.8, slide.images[0].url);
      s.addText(slide.title || "", {
        x: 0.2,
        y: 3.1,
        w: 9.6,
        h: 0.65,
        fontSize: 18,
        bold: true,
        color: BLACK,
        fontFace: FONT,
      });
      bulletsBlock(0.2, 3.8, 9.6, 1.5, slide.bullets.slice(0, 2), 12);
      break;

    case "quote":
      s.addText("❝", {
        x: 0.5,
        y: 0.7,
        w: 1,
        h: 0.8,
        fontSize: 38,
        bold: true,
        color: G.replace("#", ""),
        fontFace: FONT,
      });
      s.addText(slide.quote || "", {
        x: 0.5,
        y: 1.6,
        w: 9,
        h: 2.6,
        fontSize: 18,
        bold: true,
        color: BLACK,
        fontFace: FONT,
        align: "center",
        valign: "middle",
      });
      if (slide.quote_source)
        s.addText(`— ${slide.quote_source}`, {
          x: 0.5,
          y: 4.35,
          w: 9,
          h: 0.4,
          fontSize: 11,
          color: GREY,
          fontFace: FONT,
          align: "center",
        });
      break;

    case "two-images":
      titleBlock(0.2, 0.25, 9.5);
      if (slide.images[0])
        await imageBlock(0.2, 1.15, 4.6, 3.5, slide.images[0].url);
      if (slide.images[1])
        await imageBlock(5.0, 1.15, 4.6, 3.5, slide.images[1].url);
      if (slide.bullets[0])
        s.addText(slide.bullets[0], {
          x: 0.2,
          y: 4.7,
          w: 4.6,
          h: 0.3,
          fontSize: 9,
          color: "555555",
          italic: true,
          fontFace: FONT,
          align: "center",
        });
      if (slide.bullets[1])
        s.addText(slide.bullets[1], {
          x: 5.0,
          y: 4.7,
          w: 4.6,
          h: 0.3,
          fontSize: 9,
          color: "555555",
          italic: true,
          fontFace: FONT,
          align: "center",
        });
      break;

    default:
      titleBlock(0.2, 0.25, 9.5);
      bulletsBlock(0.2, 1.15, 9.5, 4.0, slide.bullets);
  }
}

export async function exportAsPptx(
  presentation: PresentationSession,
): Promise<void> {
  const slides = presentation.slides ?? [];
  if (slides.length === 0) return;

  const pres = new PptxGenJS();
  pres.layout = "LAYOUT_WIDE";
  pres.title = presentation.topic || "Presentation";

  for (const slide of slides) {
    await buildPptxSlide(pres, slide, presentation.topic, slides.length);
  }

  await pres.writeFile({
    fileName: `${presentation.topic || "presentation"}.pptx`,
  });
}
