/**
 * Every word on the landing page.
 *
 * Kept apart from the components so the copy can be edited without touching
 * layout, and so claims are reviewable in one place. Two rules for anything
 * added here:
 *
 *  1. It has to be true of the product as it ships today. No spaced
 *     repetition, no survey statistics, no ".edu unlocks everything" — Freshr
 *     does none of those, and a marketing page is the worst place to find out.
 *  2. Links point at routes that exist in App.tsx. No placeholder "#".
 */

import type { LandingIconName } from "../../components/landing/landingIcons";

export interface NavLink {
  label: string;
  href: string;
}

/** In-page anchors first, then the real route. */
export const NAV_LINKS: NavLink[] = [
  { label: "How it works", href: "#how" },
  { label: "Subjects", href: "#subjects" },
  { label: "Pricing", href: "#pricing" },
  { label: "Sign in", href: "/login" },
];

export const HERO = {
  /* Split so the middle line can carry the Sulu + italic treatment. */
  headingBefore: "Your notes,",
  headingAccent: "answered",
  headingAfter: "in your words.",
  body: "Freshr reads your lecture slides, PDFs and handwritten notes, then answers questions about them with a citation back to the exact page. Quizzes and slide decks come from the same material — so everything you study is your own.",
  primaryCta: { label: "Start free", href: "/signup" },
  secondaryCta: { label: "See how it works", href: "#how" },
} as const;

/**
 * The hero's front card mirrors the real quiz-taking screen rather than
 * inventing a flashcard UI, so the first thing a visitor sees is a surface
 * that actually exists in the product.
 */
export const HERO_CARD = {
  deckLabel: "Biology 201 · Cellular Structures",
  tag: "QUIZ",
  /* A real question, not one with its own answer already filled in — the
     lettered options below are what carries the answer. */
  question: "Which part of the cell hosts the citric acid cycle?",
  options: [
    { letter: "A", text: "Cytoplasm", correct: false },
    { letter: "B", text: "Mitochondrial matrix", correct: true },
    { letter: "C", text: "Golgi apparatus", correct: false },
  ],
  footerHint: "Cited from Lecture 07, slide 12",
  progressLabel: "Q 3 of 5",
  progressPercent: 60,
} as const;

export interface Subject {
  icon: LandingIconName;
  label: string;
}

/** Deliberately generic — these are course areas, not claimed integrations. */
export const SUBJECTS: Subject[] = [
  { icon: "RiMicroscopeLine", label: "Biology" },
  { icon: "RiFlaskLine", label: "Chemistry" },
  { icon: "RiBarChart2Line", label: "Economics" },
  { icon: "RiCodeSSlashLine", label: "Computer Science" },
  { icon: "RiGovernmentLine", label: "Political Science" },
  { icon: "RiBookOpenLine", label: "Literature" },
  { icon: "RiScales3Line", label: "Law" },
];

export const SUBJECTS_LABEL = "Built for the courses you're actually taking";

export interface DeckChip {
  icon: LandingIconName;
  label: string;
  solid?: boolean;
}

export interface DeckSection {
  num: string;
  eyebrow: string;
  titleBefore: string;
  titleItalic: string;
  body: string;
  variant: "ecru" | "ink";
  chips?: DeckChip[];
  /** Renders the three tool-preview cards under the body. */
  showMiniCards?: boolean;
}

export const DECK_SECTIONS: DeckSection[] = [
  {
    num: "CARD 01",
    eyebrow: "Step 01 · Drop it in",
    titleBefore: "Drop the whole folder.",
    titleItalic: "Don't sort it first.",
    body: "A 60-slide PDF, the notes your TA emailed at 1 AM, a photo of the whiteboard before it got wiped. Drag them into a notebook and Freshr reads them as one pile — including scans and handwriting — so nothing gets left out because it was the wrong file type.",
    variant: "ecru",
    chips: [
      { icon: "RiFilePdfLine", label: "Lecture 07.pdf", solid: true },
      { icon: "RiFileTextLine", label: "notes_tues.docx" },
      { icon: "RiSlideshow2Line", label: "slides_week6.pptx" },
      { icon: "RiImageLine", label: "board_photo.jpg" },
    ],
  },
  {
    num: "CARD 02",
    eyebrow: "Step 02 · It reads, you review",
    titleBefore: "One notebook,",
    titleItalic: "three ways to study it.",
    body: "The same material becomes whatever you need that night — a conversation when you're confused, a quiz when you want to check yourself, a slide deck when you have to present it on Thursday. Every one of them is built from your notebook, and nothing else.",
    variant: "ecru",
    showMiniCards: true,
  },
  {
    num: "CARD 03",
    eyebrow: "Step 03 · Ask, in your own words",
    titleBefore: "Stuck on slide 43 at 2 AM?",
    titleItalic: "Ask it a question.",
    body: "Freshr answers from your notebook rather than the open internet, so it won't confidently hand you something your professor never said. Every answer carries a citation back to the page it came from, which is also how you check it.",
    variant: "ink",
    chips: [
      {
        icon: "RiDoubleQuotesL",
        label: "Why is glycolysis anaerobic here but not there?",
      },
      {
        icon: "RiCornerDownRightLine",
        label: "Slide 43 · Lecture 07",
        solid: true,
      },
    ],
  },
];

export interface MiniCard {
  label: string;
  icon: LandingIconName;
  before: string;
  highlight: string;
  after: string;
}

/** One preview per tool, matching the columns of the notebook workspace. */
export const MINI_CARDS: MiniCard[] = [
  {
    label: "Chat",
    icon: "RiChat3Line",
    before: "The citric acid cycle takes place in the ",
    highlight: "mitochondrial matrix",
    after: " — Lecture 07, slide 12.",
  },
  {
    label: "Quiz",
    icon: "RiListCheck3",
    before:
      "A Nash equilibrium is a set of strategies where no player gains by ",
    highlight: "switching alone",
    after: ".",
  },
  {
    label: "Slides",
    icon: "RiSlideshow2Line",
    before: "In The Waste Land, water is both ",
    highlight: "drought and drowning",
    after: " — not one or the other.",
  },
];

export interface Testimonial {
  name: string;
  university: string;
  quote: string;
  stars: number;
}

/**
 * Real students, real quotes — the only social proof we have, and worth more
 * than an invented percentage. Kept verbatim from the previous landing page.
 */
export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Mushfiqur Rahman Zaed",
    university: "Independent University, Bangladesh",
    quote:
      "It saved me so much time. Whether I'm preparing a presentation or getting ready for a quiz, FRESHR has me completely covered.",
    stars: 5,
  },
  {
    name: "Sababa Shornil",
    university: "Independent University, Bangladesh",
    quote:
      "I used it right before my exams and it worked really well. It helped me cover most of the syllabus efficiently — something I always struggled with since I tend to only start studying the day before.",
    stars: 5,
  },
  {
    name: "Humaira Afnan Rowza",
    university: "Independent University, Bangladesh",
    quote:
      "It helped me with my MCQs and gave me a much clearer understanding of my lecture material.",
    stars: 4,
  },
  {
    name: "Mushfika Zerin Zemima",
    university: "Independent University, Bangladesh",
    quote:
      "It gives you a proper online quiz and shows you the answers — that's exactly what I needed.",
    stars: 4,
  },
  {
    name: "Adnan Shihab",
    university: "Independent University, Bangladesh",
    quote:
      "Even though it's still in development with just two features, both of them are genuinely helpful for saving students' time.",
    stars: 4,
  },
];

export const TESTIMONIALS_INTRO = {
  eyebrow: "From the people using it",
  titleBefore: "Students at IUB,",
  titleItalic: "the week before finals.",
} as const;

/**
 * The pricing preamble. The inspiration promised "free while you're a student"
 * via .edu — Freshr has no .edu programme and does charge, so this says the
 * true version instead: the free tier is real and permanent, and the paid
 * tiers are shown at their actual prices from src/constants/plans.ts.
 */
export const PRICING = {
  eyebrow: "Pricing",
  titleBefore: "Start free.",
  titleItalic: "Upgrade only if you outgrow it.",
  body: "Basic is free forever — three notebooks, and enough questions and quizzes a day to get through a normal week. No card to start, and no per-deck paywall that stops working the night before your exam.",
  cta: { label: "Start free", href: "/signup" },
  footnote: "Prices in Bangladeshi Taka. Cancel any time.",
} as const;

export interface FooterColumn {
  heading: string;
  links: NavLink[];
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "Subjects", href: "#subjects" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    heading: "Students",
    links: [
      { label: "Start free", href: "/signup" },
      { label: "Sign in", href: "/login" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Refund Policy", href: "/refund-policy" },
    ],
  },
];

export const FOOTER = {
  blurb:
    "A study notebook made from your own material, that can answer questions about it and show you where the answer came from.",
  madeIn: "Made on a campus in Dhaka.",
} as const;

export const PAGE_META = {
  title: "FRESHR — Your notes, answered in your words",
  description:
    "Freshr turns your lecture slides, PDFs and handwritten notes into a study notebook you can ask questions, take quizzes from, and build slide decks with — every answer cited back to your own material.",
} as const;

/* ---------------------------------------------------------------------------
 * LEGACY — consumed only by the landing page being replaced.
 *
 * Kept so the tree still compiles while the new sections are built alongside
 * the old ones. Deleted together with FeatureCard / RotatingText /
 * TestimonialSection / PricingSection in the teardown step.
 * ------------------------------------------------------------------------ */

export const FEATURES = [
  {
    icon: "📁",
    title: "Upload anything",
    desc: "Drop in your PDFs, notes, slides, or research papers, and FRESHR pulls out everything inside. No formatting, no cleanup. Just upload and you're done.",
  },
  {
    icon: "⚡",
    title: "Ready in seconds",
    desc: "The moment you add a document, FRESHR reads and organizes it for you automatically. By the time you've finished uploading, it's already searchable.",
  },
  {
    icon: "🧠",
    title: "Just ask",
    desc: "No need to thinks about prompts. Ask a question the way you'd ask a friend, and get clear answers pulled straight from your own materials.",
  },
  {
    icon: "🔒",
    title: "Private by default",
    desc: "Your notebooks belong to you and only you. No one else can ever see or access what you upload. Your notes stay yours.",
  },
  {
    icon: "📓",
    title: "Organized your way",
    desc: "Keep everything tidy by subject, course, or project. Each notebook stands on its own, so your biology notes never mix with your business lectures.",
  },
  {
    icon: "✦",
    title: "Nothing gets missed",
    desc: "Even the tables and images in your notes are read and understood, so the answers you get capture the full picture, not just the text.",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Create a notebook",
    desc: "Sort your study materials by subject, course, or project. Each notebook is its own space, so everything stays neat and easy to find.",
  },
  {
    n: "02",
    title: "Add your lecture contents",
    desc: "Drop in your PDFs, notes, and research papers. FRESHR reads every page for you, even handwriting and scanned pages, so nothing gets left out.",
  },
  {
    n: "03",
    title: "Ask anything",
    desc: "Type your question the way you'd say it out loud. Get a clear answer, with links back to the exact spot in your notes it came from.",
  },
];

export const TICKER_TEXT =
  "Built for exams  ·  Quiz yourself  ·  Reads most files  ·  Cites your sources  ·  Understands handwritten notes  ·  Answers your questions  ·  AI study tool  ·  Generate Presentations  ·      ";
