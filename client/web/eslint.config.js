import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * Screens that predate the design-token redesign and still style themselves
 * with inline `style={{ … }}` objects. The no-inline-style rule is switched off
 * for these, and the list may only ever SHRINK — delete a path as its screen is
 * migrated to token utilities, and never add one.
 *
 * A genuinely computed value (a width percentage, a transform) is a legitimate
 * use of `style` even in migrated code; those carry an eslint-disable comment
 * with a reason at the call site instead of being listed here.
 */
const LEGACY_INLINE_STYLE_FILES = [
  'src/components/google-auth/GoogleAuthBtn.tsx',
  'src/components/landing/FeatureCard.tsx',
  'src/components/landing/PricingSection.tsx',
  'src/components/landing/RotatingText.tsx',
  'src/components/landing/TestimonialSection.tsx',
  'src/components/notebook/AudioColumn.tsx',
  'src/components/notebook/ChatColumn.tsx',
  'src/components/notebook/ChatMessage.tsx',
  'src/components/notebook/FileItem.tsx',
  'src/components/notebook/FilesColumn.tsx',
  'src/components/notebook/NotebookTitle.tsx',
  'src/components/notebook/OptionsColumn.tsx',
  'src/components/notebook/PastPresentationsColumn.tsx',
  'src/components/notebook/PastQuizColumn.tsx',
  'src/components/notebook/PresentationColumn.tsx',
  'src/components/notebook/QuizColumn.tsx',
  'src/components/notebook/QuizReviewColumn.tsx',
  'src/components/notebook/QuizTakingScreen.tsx',
  'src/components/notebook/UploadConfirmModal.tsx',
  'src/components/payment/PaymentContentArea.tsx',
  'src/components/presentation/PresentationPreview.tsx',
  'src/components/presentation/PresentationViewer.tsx',
  'src/components/presentation/SlideEditor.tsx',
  'src/components/presentation/SlideLayouts.tsx',
  'src/components/presentation/exportPresentation.tsx',
  'src/components/profile-account/AccountContentArea.tsx',
  'src/components/profile-account/ProfileAvatar.tsx',
  'src/components/profile-account/ProfileContentArea.tsx',
  'src/components/profile-account/ProfileSidebar.tsx',
  'src/components/profile-account/SupportContentArea.tsx',
  'src/components/quiz/Divider.tsx',
  'src/components/quiz/QuizCard.tsx',
  'src/components/quiz/QuizTopicChip.tsx',
  'src/components/quiz/quiz-taking-screen/QuizTakingScreenExitConfirmModal.tsx',
  'src/components/quiz/quiz-taking-screen/QuizTakingScreenModal.tsx',
  'src/components/quiz/quiz-taking-screen/QuizTakingScreenNavButton.tsx',
  'src/components/quiz/quiz-taking-screen/QuizTakingScreenTimesUpModal.tsx',
  'src/components/quiz/quiz-taking-screen/QuizTakingScreenUnansweredModal.tsx',
  'src/components/settings/SettingsField.tsx',
  'src/page/ForgotPasswordPage.tsx',
  'src/page/ForgotPasswordSentPage.tsx',
  'src/page/LandingPage.tsx',
  'src/page/LoginPage.tsx',
  'src/page/NotFoundPage.tsx',
  'src/page/NotebookPage.tsx',
  'src/page/OnboardingPage.tsx',
  'src/page/PaymentCancelPage.tsx',
  'src/page/PaymentSuccessPage.tsx',
  'src/page/PolicyPage.tsx',
  'src/page/ProfilePage.tsx',
  'src/page/ResetPasswordPage.tsx',
  'src/page/SignupPage.tsx',
  'src/page/SupportPage.tsx',
  'src/page/VerifyEmailPage.tsx',
  'src/page/VerifyEmailSentPage.tsx',
]

const NO_INLINE_STYLE_MESSAGE =
  'Inline style={{…}} bypasses the design tokens in src/index.css. Use Tailwind token utilities (bg-card, text-muted-foreground, p-4) instead. If the value is genuinely computed at runtime, add an eslint-disable-next-line comment explaining why.'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='style']",
          message: NO_INLINE_STYLE_MESSAGE,
        },
      ],
    },
  },
  {
    // The shrinking legacy list — see the comment above it.
    files: LEGACY_INLINE_STYLE_FILES,
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
])
