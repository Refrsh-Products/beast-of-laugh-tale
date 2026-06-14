import createFreshrApiInstance, {
  NotebookServiceApiEndpoints,
} from "../services/freshr-api";
import type { NotebookService } from "../services/notebooks/NotebookService.types";
import type { NotebookFileCreateResponse } from "../services/notebooks/NotebookFile.types";
import type { NotebookTopic } from "../services/quiz/Quiz.types";
import type { Notebook } from "../storage";
import useAxiosInterceptor from "./useAxiosInterceptor";
import { useFetch } from "./useFetch";
import { useMemo } from "react";

const useNotebookServiceApi = (): NotebookService => {
  const api = useMemo(() => createFreshrApiInstance(), []);
  const apiWithInterceptor = useAxiosInterceptor(api);
  const { fetchData } = useFetch(apiWithInterceptor);

  return {
    list: async () => {
      try {
        const response = await fetchData<Notebook[]>(
          NotebookServiceApiEndpoints.getNotebooks,
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    listArchived: async () => {
      try {
        const response = await fetchData<Notebook[]>(
          `${NotebookServiceApiEndpoints.getNotebooks}?archived=true`,
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    getNotebook: async (notebook_id) => {
      try {
        const response = await fetchData(
          NotebookServiceApiEndpoints.getNotebook(notebook_id),
          "GET",
        );
        return response as Awaited<ReturnType<NotebookService["getNotebook"]>>;
      } catch (err) {
        throw err;
      }
    },

    create: async (title) => {
      try {
        const response = await fetchData<Notebook>(
          NotebookServiceApiEndpoints.createNotebook,
          "POST",
          { title: title },
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    update: async (notebook_id, changes) => {
      try {
        const response = await fetchData<Notebook>(
          NotebookServiceApiEndpoints.updateNotebook(notebook_id),
          "PATCH",
          changes,
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    delete: async (notebook_id) => {
      try {
        await fetchData(
          NotebookServiceApiEndpoints.deleteNotebook(notebook_id),
          "DELETE",
        );
        console.log("[useNotebookServiceApi] Deleting Notebook: ", notebook_id);
      } catch (err) {
        throw err;
      }
    },

    archive: async (notebook_id) => {
      try {
        await fetchData<Notebook>(
          NotebookServiceApiEndpoints.archiveNotebook(notebook_id),
          "POST",
        );
        console.log("[useNotebookServiceApi] Archived Notebook: ", notebook_id);
      } catch (err) {
        throw err;
      }
    },

    unarchive: async (notebook_id) => {
      try {
        await fetchData<Notebook>(
          NotebookServiceApiEndpoints.unarchiveNotebook(notebook_id),
          "POST",
        );
        console.log(
          "[useNotebookServiceApi] Unarchived Notebook: ",
          notebook_id,
        );
      } catch (err) {
        throw err;
      }
    },

    seed: async () => {
      // No-op in API mode — backend has its own data
    },

    listFiles: async (notebookId) => {
      try {
        const response = await fetchData(
          NotebookServiceApiEndpoints.getNotebookFiles(notebookId),
          "GET",
        );
        return response as Awaited<ReturnType<NotebookService["listFiles"]>>;
      } catch (err) {
        throw err;
      }
    },

    createFile: async (notebookId, file) => {
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetchData(
          NotebookServiceApiEndpoints.createFile(notebookId),
          "POST",
          formData,
          { headers: { "Content-Type": undefined }, timeout: 120000 },
        );

        return response as NotebookFileCreateResponse;
      } catch (err) {
        throw err;
      }
    },

    deleteFile: async (notebook_id, file_id) => {
      try {
        await fetchData(
          NotebookServiceApiEndpoints.deleteNotebookFiles(notebook_id, file_id),
          "DELETE",
        );
      } catch (err) {
        throw err;
      }
    },

    renameFile: async (_notebook_id, _file_id, _newName) => {
      // TODO: wire up rename endpoint when Safwan is ready
    },

    listTopics: async (notebookId) => {
      try {
        const response = await fetchData<NotebookTopic[]>(
          NotebookServiceApiEndpoints.getNotebookTopics(notebookId),
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },
  };
};

export default useNotebookServiceApi;
