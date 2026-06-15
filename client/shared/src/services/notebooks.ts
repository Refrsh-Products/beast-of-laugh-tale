import type { ServiceDeps } from "../platform/deps";
import type { Notebook, NotebookFile } from "../types/entities";
import type { NotebookTopic } from "./quiz";
import { NotebookServiceApiEndpoints } from "./endpoints";

export interface NotebookFileCreateResponse {
  success: Boolean;
  errors: [];
  id: string;
  ingestion_status: string;
}

export interface NotebookService {
  list(): Promise<Notebook[]>; // List of all the notebooks for the user
  listArchived(): Promise<Notebook[]>; // List of all the archived notebooks for the user
  getNotebook(notebook_id: string): Promise<Notebook>; // Get the information on the notebook with the given id
  create(title: string): Promise<Notebook>; // Create a notebook for the user
  update(id: string, changes: Partial<Notebook>): Promise<Notebook>; // Update an existing notebook for the user
  delete(id: string): Promise<void>; // Delete an existing notebook for the user
  archive(id: string): Promise<void>;
  unarchive(id: string): Promise<void>;
  listFiles(notebookId: string): Promise<NotebookFile[]>; // List files in a notebook
  createFile(
    notebook_id: string,
    file: File,
  ): Promise<NotebookFileCreateResponse>; // Upload a new file in notebook with the given id
  deleteFile(notebook_id: string, file_id: string): Promise<void>;
  renameFile(
    notebook_id: string,
    file_id: string,
    newName: string,
  ): Promise<void>;
  listTopics(notebook_id: string): Promise<NotebookTopic[]>;
  seed(): Promise<void>;
}

export function createNotebookService(deps: ServiceDeps): NotebookService {
  const { http } = deps;

  return {
    list: async () => {
      return await http.request<Notebook[]>(
        NotebookServiceApiEndpoints.getNotebooks,
        "GET",
      );
    },

    listArchived: async () => {
      return await http.request<Notebook[]>(
        `${NotebookServiceApiEndpoints.getNotebooks}?archived=true`,
        "GET",
      );
    },

    getNotebook: async (notebook_id) => {
      const response = await http.request(
        NotebookServiceApiEndpoints.getNotebook(notebook_id),
        "GET",
      );
      return response as Awaited<ReturnType<NotebookService["getNotebook"]>>;
    },

    create: async (title) => {
      return await http.request<Notebook>(
        NotebookServiceApiEndpoints.createNotebook,
        "POST",
        { title: title },
      );
    },

    update: async (notebook_id, changes) => {
      return await http.request<Notebook>(
        NotebookServiceApiEndpoints.updateNotebook(notebook_id),
        "PATCH",
        changes,
      );
    },

    delete: async (notebook_id) => {
      await http.request(
        NotebookServiceApiEndpoints.deleteNotebook(notebook_id),
        "DELETE",
      );
      console.log("[NotebookService] Deleting Notebook: ", notebook_id);
    },

    archive: async (notebook_id) => {
      await http.request<Notebook>(
        NotebookServiceApiEndpoints.archiveNotebook(notebook_id),
        "POST",
      );
      console.log("[NotebookService] Archived Notebook: ", notebook_id);
    },

    unarchive: async (notebook_id) => {
      await http.request<Notebook>(
        NotebookServiceApiEndpoints.unarchiveNotebook(notebook_id),
        "POST",
      );
      console.log("[NotebookService] Unarchived Notebook: ", notebook_id);
    },

    seed: async () => {
      // No-op in API mode — backend has its own data
    },

    listFiles: async (notebookId) => {
      const response = await http.request(
        NotebookServiceApiEndpoints.getNotebookFiles(notebookId),
        "GET",
      );
      return response as Awaited<ReturnType<NotebookService["listFiles"]>>;
    },

    createFile: async (notebookId, file) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await http.request(
        NotebookServiceApiEndpoints.createFile(notebookId),
        "POST",
        formData,
        { headers: { "Content-Type": undefined }, timeout: 120000 },
      );

      return response as NotebookFileCreateResponse;
    },

    deleteFile: async (notebook_id, file_id) => {
      await http.request(
        NotebookServiceApiEndpoints.deleteNotebookFiles(notebook_id, file_id),
        "DELETE",
      );
    },

    renameFile: async (_notebook_id, _file_id, _newName) => {
      // TODO: wire up rename endpoint when Safwan is ready
    },

    listTopics: async (notebookId) => {
      return await http.request<NotebookTopic[]>(
        NotebookServiceApiEndpoints.getNotebookTopics(notebookId),
        "GET",
      );
    },
  };
}
