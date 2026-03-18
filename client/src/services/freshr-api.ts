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
    `${NotebookServiceApiBase}/notebook/${notebook_id}`,
  deleteNotebook: (notebook_id: string) =>
    `${NotebookServiceApiBase}/notebook/${notebook_id}`,
  createFile: (notebook_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}/files/create`,
  getNotebookFiles: (notebook_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}/files`,
  deleteNotebookFiles: (notebook_id: string, file_id: string) =>
    `${NotebookServiceApiBase}/${notebook_id}/files/delete/${file_id}/`,
};

export default createFreshrApiInstance;
