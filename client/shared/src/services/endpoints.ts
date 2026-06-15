/**
 * API endpoint path builders. Pure strings — no axios, no env. The axios
 * instance factory stays in web (`services/freshr-api.ts`), which re-exports
 * these for back-compat.
 *
 * NOTE: the `/api/...` prefix is replaced with `/v1/...` in story 1.5.
 */

// Users
export const UserServiceApiBase = "/api/users";
export const UserServiceApiEndpoints = {
  accounts: `${UserServiceApiBase}/accounts/`,
  accountMe: `${UserServiceApiBase}/accounts/me/`,
  accountUsage: `${UserServiceApiBase}/accounts/me/usage/`,
};

// Auth
export const AuthServiceApiBase = "/api/auth";
export const AuthServiceApiEndpoints = {
  login: `${AuthServiceApiBase}/login/`,
  googleLogin: `${AuthServiceApiBase}/google-login/`,
  logout: `${AuthServiceApiBase}/logout/`,
  refreshToken: `${AuthServiceApiBase}/token/refresh/`,
  resetPassword: `${AuthServiceApiBase}/password-reset/`,
  resetPasswordConfirm: `${AuthServiceApiBase}/password-reset/confirm/`,
  register: `${AuthServiceApiBase}/register/`,
  verifyEmail: `${AuthServiceApiBase}/verify-email/`,
  verifyEmailConfirm: `${AuthServiceApiBase}/verify-email/confirm/`,
};

// Notebooks
export const NotebookServiceApiBase = "/api/notebooks";
export const NotebookServiceApiEndpoints = {
  getNotebooks: `${NotebookServiceApiBase}/`,
  createNotebook: `${NotebookServiceApiBase}/`,
  getNotebook: (notebook_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}`,
  updateNotebook: (notebook_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}`,
  deleteNotebook: (notebook_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}`,
  createFile: (notebook_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}/files/create`,
  getNotebookFiles: (notebook_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}/files`,
  deleteNotebookFiles: (notebook_id: string, file_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}/files/delete/${file_id}/`,
  getNotebookTopics: (notebook_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}/topics`,
  archiveNotebook: (notebook_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}/archive`,
  unarchiveNotebook: (notebook_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}/unarchive`,
};

// Transcriptions
export const TranscriptionServiceApiBase = "/api/transcription";
export const TranscriptionServiceEndpoints = {
  transcribeAudio: (notebook_id: string) =>
    `${TranscriptionServiceApiBase}/${notebook_id}/audio/transcribe`,
  listAudioTranscripts: (notebook_id: string) =>
    `${TranscriptionServiceApiBase}/${notebook_id}/audio/transcripts`,
  getAudioTranscript: (notebook_id: string, transcript_id: string) =>
    `${TranscriptionServiceApiBase}/${notebook_id}/audio/transcripts/${transcript_id}`,
  updateAudioTranscript: (notebook_id: string, transcript_id: string) =>
    `${TranscriptionServiceApiBase}/${notebook_id}/audio/transcripts/${transcript_id}/update`,
  generateNotesFromTranscript: (notebook_id: string, transcript_id: string) =>
    `${TranscriptionServiceApiBase}/${notebook_id}/audio/transcripts/${transcript_id}/generate-notes`,
  deleteAudioTranscript: (notebook_id: string, transcript_id: string) =>
    `${TranscriptionServiceApiBase}/${notebook_id}/audio/transcripts/${transcript_id}`,
};

// Chats
export const ChatServiceApiBase = "/api/chats";
export const ChatServiceApiEndpoints = {
  getChatSessions: `${ChatServiceApiBase}/`,
  createChatSession: `${ChatServiceApiBase}/`,
  updateChatSession: (chat_id: string) => `${ChatServiceApiBase}/${chat_id}/`,
  deleteChatSession: (chat_id: string) => `${ChatServiceApiBase}/${chat_id}/`,
  getChatSessionDetails: (chat_id: string) =>
    `${ChatServiceApiBase}/${chat_id}/`,
  getChatSessionMessages: (chat_id: string) =>
    `${ChatServiceApiBase}/${chat_id}/messages/`,
  createChatSessionMessage: (chat_id: string) =>
    `${ChatServiceApiBase}/${chat_id}/messages/`,
  chatMessageStream: (chat_id: string) =>
    `${ChatServiceApiBase}/${chat_id}/messages/stream/`,
};

// Policies
export const PolicyServiceApiBase = "/api/policies";
export const PolicyServiceApiEndpoints = {
  getActive: (slug: string) => `${PolicyServiceApiBase}/${slug}/`,
};

// Payments
export const PaymentServiceApiBase = "/api/payments";
export const PaymentServiceApiEndpoints = {
  getPayments: `${PaymentServiceApiBase}/`,
  initiatePayment: `${PaymentServiceApiBase}/initiate/`,
};

// Quizzes
export const QuizServiceApiBase = "/api/quizzes";
export const QuizServiceApiEndpoints = {
  listQuizSessionsByNotebook: (notebookId: string) =>
    `${QuizServiceApiBase}/?notebook=${notebookId}`,
  createQuizSession: (notebookId: string) =>
    `${QuizServiceApiBase}/?notebook=${notebookId}`,
  deleteQuizSession: (quizId: string) => `${QuizServiceApiBase}/${quizId}/`,
  listFavouriteQuizzes: `${QuizServiceApiBase}/favourites/`,
  getQuizSession: (quizId: string) => `${QuizServiceApiBase}/${quizId}/`,
  submitQuiz: (quizId: string) => `${QuizServiceApiBase}/${quizId}/submit/`,
  retakeQuiz: (quizId: string) => `${QuizServiceApiBase}/${quizId}/retake/`,
};

// Presentations
export const PresentationServiceApiBase = "/api/presentation";
export const PresentationServiceApiEndpoints = {
  listPresentationsByNotebook: (notebookId: string) =>
    `${PresentationServiceApiBase}/?notebook=${notebookId}`,
  createPresentation: (notebookId: string) =>
    `${PresentationServiceApiBase}/?notebook=${notebookId}`,
  getPresentation: (presentationId: string) =>
    `${PresentationServiceApiBase}/${presentationId}/`,
  updatePresentation: (presentationId: string) =>
    `${PresentationServiceApiBase}/${presentationId}/`,
  deletePresentation: (presentationId: string) =>
    `${PresentationServiceApiBase}/${presentationId}/`,
  listFavouritePresentations: `${PresentationServiceApiBase}/favourites/`,
  updateSlide: (presentationId: string, slideId: string) =>
    `${PresentationServiceApiBase}/${presentationId}/slides/${slideId}/`,
  refineSlide: (presentationId: string, slideId: string) =>
    `${PresentationServiceApiBase}/${presentationId}/slides/${slideId}/refine/`,
};
