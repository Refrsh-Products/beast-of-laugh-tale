import type { YearOfStudy } from '../types';

/**
 * Sentinel for "my university isn't in the list". Never leaves the client — the
 * UIs swap it for whatever the user typed before building the request. Can't
 * collide with a real entry, since those are all plain university names.
 */
export const OTHER_UNIVERSITY = '__other__';

/**
 * Curated list of Bangladeshi universities, alphabetical.
 *
 * This is the ONLY copy. The server stores `university` as free text and does
 * no choice validation on purpose — that's what makes the "Other" escape hatch
 * work — so a second list anywhere would only rot.
 *
 * Acronyms are baked into the name so a substring search on "BUET" or "NSU"
 * hits. To add a university, add one string; the option list below derives from
 * it, so the value and label can't drift.
 */
export const UNIVERSITY_NAMES: readonly string[] = [
  'Ahsanullah University of Science and Technology (AUST)',
  'American International University-Bangladesh (AIUB)',
  'Armed Forces Medical College (AFMC)',
  'Asian University for Women (AUW)',
  'Bangabandhu Sheikh Mujib Medical University (BSMMU)',
  'Bangladesh Agricultural University (BAU)',
  'Bangladesh Medical College',
  'Bangladesh Open University (BOU)',
  'Bangladesh University of Business and Technology (BUBT)',
  'Bangladesh University of Engineering and Technology (BUET)',
  'Bangladesh University of Professionals (BUP)',
  'Bangladesh University of Textiles (BUTEX)',
  'BRAC University',
  'Chittagong Independent University (CIU)',
  'Chittagong Medical College (CMC)',
  'Chittagong University of Engineering and Technology (CUET)',
  'Comilla University (CoU)',
  'Daffodil International University (DIU)',
  'Dhaka Medical College (DMC)',
  'Dhaka University of Engineering and Technology (DUET)',
  'East West University (EWU)',
  'Green University of Bangladesh (GUB)',
  'Hajee Mohammad Danesh Science and Technology University (HSTU)',
  'Independent University, Bangladesh (IUB)',
  'International Islamic University Chittagong (IIUC)',
  'International University of Business Agriculture and Technology (IUBAT)',
  'Islamic University of Technology (IUT)',
  'Islamic University, Kushtia (IU)',
  'Jagannath University (JnU)',
  'Jahangirnagar University (JU)',
  'Jashore University of Science and Technology (JUST)',
  'Khulna University (KU)',
  'Khulna University of Engineering and Technology (KUET)',
  'Mawlana Bhashani Science and Technology University (MBSTU)',
  'Military Institute of Science and Technology (MIST)',
  'National University (NU)',
  'North South University (NSU)',
  'Northern University Bangladesh (NUB)',
  'Noakhali Science and Technology University (NSTU)',
  'Patuakhali Science and Technology University (PSTU)',
  'Premier University, Chittagong',
  'Primeasia University',
  'Rajshahi University of Engineering and Technology (RUET)',
  'Rajshahi Medical College (RMC)',
  'Shahjalal University of Science and Technology (SUST)',
  'Sher-e-Bangla Agricultural University (SAU)',
  'Sir Salimullah Medical College (SSMC)',
  'Southeast University (SEU)',
  'Stamford University Bangladesh',
  'Sylhet Agricultural University (SAU, Sylhet)',
  'United International University (UIU)',
  'University of Asia Pacific (UAP)',
  'University of Chittagong (CU)',
  'University of Dhaka (DU)',
  'University of Liberal Arts Bangladesh (ULAB)',
  'University of Rajshahi (RU)',
  'University of Science and Technology Chittagong (USTC)',
  'World University of Bangladesh (WUB)',
];

/**
 * `value === label`, so the string the user picks is exactly what gets stored
 * and there is no mapping table to keep in sync.
 *
 * "Other" is deliberately NOT in here — both UIs pass it separately as a pinned
 * row so the search filter can never hide it from the one user who needs it.
 */
export const UNIVERSITY_OPTIONS: { value: string; label: string }[] =
  UNIVERSITY_NAMES.map((name) => ({ value: name, label: name }));

/**
 * Why we ask for a phone number, shown under the field on both platforms.
 *
 * Keep this honest and keep it matching privacy policy §3.1. It deliberately
 * does NOT mention account recovery (recovery is email-only — nothing in the
 * codebase recovers an account by phone) or WhatsApp (joining the community is
 * a link tap and needs no phone number at all).
 */
export const PHONE_PURPOSE_HELP =
  'So our team can reach you about your order or subscription if something goes wrong.';

export const YEAR_OF_STUDY_OPTIONS: { value: YearOfStudy; label: string }[] = [
  { value: 'YEAR_1', label: '1st Year' },
  { value: 'YEAR_2', label: '2nd Year' },
  { value: 'YEAR_3', label: '3rd Year' },
  { value: 'YEAR_4', label: '4th Year' },
  { value: 'YEAR_5', label: '5th Year' },
  { value: 'YEAR_6', label: '6th Year' },
  { value: 'MASTERS', label: 'Masters/Postgrad' },
  { value: 'GRADUATED', label: 'Graduated' },
];
