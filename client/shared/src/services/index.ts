export * from "./endpoints";

export { NeedsVerificationError, createAuthService } from "./auth";
export type { AuthService } from "./auth";

export { createAccountService } from "./account";
export type {
  AccountService,
  AccountFetchResult,
  AccountPatch,
  OnboardingStatus,
} from "./account";

export { createChatService } from "./chat";
export type { ChatServices, ChatSession, ChatMessage } from "./chat";

export { createNotebookService } from "./notebooks";
export type {
  NotebookService,
  NotebookFileCreateResponse,
} from "./notebooks";

export { createPaymentService } from "./payment";
export type { PaymentService, Payment } from "./payment";

export { createPresentationService } from "./presentation";
export type {
  PresentationService,
  PresentationSession,
  PresentationSlide,
  PresentationCreatePayload,
  PresentationLayout,
  PresentationStatus,
  SlideImage,
  SlideUpdatePayload,
  TextLength,
} from "./presentation";

export { createQuizService } from "./quiz";
export type {
  QuizService,
  NotebookTopic,
  QuizGenerateOptions,
  QuizCreatePayload,
  QuizAnswerPayload,
} from "./quiz";

export { createTranscriptionService } from "./transcription";
export type { TranscriptionService } from "./transcription";

export { createPolicyService } from "./policy";
export type { PolicyService, PolicyDto } from "./policy";
