import {
  RiBarChart2Line,
  RiBookOpenLine,
  RiChat3Line,
  RiCodeSSlashLine,
  RiCornerDownRightLine,
  RiDoubleQuotesL,
  RiFilePdfLine,
  RiFileTextLine,
  RiFlaskLine,
  RiGovernmentLine,
  RiImageLine,
  RiListCheck3,
  RiMicroscopeLine,
  RiScales3Line,
  RiSlideshow2Line,
  type RemixiconComponentType,
} from "@remixicon/react";

/**
 * Name-to-component bridge for the landing page.
 *
 * The content module is plain data — a .ts file with no JSX — so it names its
 * icons as strings and this map resolves them. That keeps copy and iconography
 * editable in one place without turning the content module into a component
 * file that imports from the icon library.
 *
 * Anything referenced from LandingPage.dto.ts must appear here; the Record
 * type means a typo in either file is a compile error rather than a blank gap
 * on the page.
 */
export const LANDING_ICONS = {
  RiBarChart2Line,
  RiBookOpenLine,
  RiChat3Line,
  RiCodeSSlashLine,
  RiCornerDownRightLine,
  RiDoubleQuotesL,
  RiFilePdfLine,
  RiFileTextLine,
  RiFlaskLine,
  RiGovernmentLine,
  RiImageLine,
  RiListCheck3,
  RiMicroscopeLine,
  RiScales3Line,
  RiSlideshow2Line,
} satisfies Record<string, RemixiconComponentType>;

export type LandingIconName = keyof typeof LANDING_ICONS;
