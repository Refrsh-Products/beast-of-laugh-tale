import axios from "axios";

const createFreshrApiInstance = () => {
  return axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 10000, // Request timeout in milliseconds
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Users
export const UserServiceApiBase = "/users";
export const UserServiceApiEndpoints = {
  accounts: `${UserServiceApiBase}/accounts/`,
  accountMe: `${UserServiceApiBase}/accounts/me/`,
  accountUsage: `${UserServiceApiBase}/accounts/me/usage/`,
};

// Auth
export const AuthServiceApiBase = "/auth";
export const AuthServiceApiEndpoints = {
  login: `${AuthServiceApiBase}/login/`,
  googleLogin: `${AuthServiceApiBase}/google-login/`,
  logout: `${AuthServiceApiBase}/logout/`,
  refreshToken: `${AuthServiceApiBase}/token/refresh/`,
  resetPassword: `${AuthServiceApiBase}/password-reset/`,
  resetPasswordConfirm: `${AuthServiceApiBase}/password-reset/confirm/`,
  register: `${AuthServiceApiBase}/register/`,
};

// Notebooks
export const NotebookServiceApiBase = "/notebooks";
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
};

// Chats
export const ChatServiceApiBase = "/chats";
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

// Payments
export const PaymentServiceApiBase = "/payments";
export const PaymentServiceApiEndpoints = {
  getPayments: `${PaymentServiceApiBase}/`,
  initiatePayment: `${PaymentServiceApiBase}/initiate/`,
  initiateStripePayment: `${PaymentServiceApiBase}/stripe/initiate/`,
};

// Quizzes
export const QuizServiceApiBase = "/quizzes";
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
export const PresentationServiceApiBase = "/presentation";
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

export default createFreshrApiInstance;
