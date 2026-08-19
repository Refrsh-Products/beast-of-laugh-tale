import type { SVGProps } from "react";

/**
 * The FRESHR 'F' logomark, drawn with currentColor so it inherits whatever
 * text colour token its container sets (text-primary, text-primary-foreground,
 * and so on).
 *
 * The brand asset files under public/brand/ come in two flavours: the
 * `-on-dark` / `-on-light` lockups bake in their own background panel and are
 * meant for avatars, app icons and social images, while the mono files are
 * transparent but hardcode black or white. Neither can follow a theme, which
 * is why the path lives here instead.
 *
 * Geometry is verbatim from Logo/01-logomark/logomark-mono-black.svg.
 * Brandbook minimum size for the logomark is 24px — do not render smaller.
 */
export default function BrandMark({
  size = 32,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      viewBox="0 0 340 340"
      width={size}
      height={size}
      fill="currentColor"
      role="img"
      aria-label="FRESHR"
      {...props}
    >
      <path d="M225.24 121.84H156.101C158.424 140.952 174.686 155.765 194.409 155.767H225.24V197.607H194.409C181.591 197.606 169.471 194.599 158.717 189.258C157.394 188.602 155.807 189.547 155.807 191.025V260H114V177.642H136.24C138.033 177.642 138.903 175.379 137.633 174.112C123.038 159.544 114.002 139.393 114 117.134V80H225.24V121.84Z" />
    </svg>
  );
}
