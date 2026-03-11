import createFreshrApiInstance, { NotebookServiceApiEndpoints } from '../freshr-api'
import type { NotebookService } from './NotebookService.types'
import type { Notebook } from '../../storage'

function getAuthHeaders() {
  const token = sessionStorage.getItem('accessToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const api = createFreshrApiInstance()

const NotebookServiceApi: NotebookService = {
  list: async () => {
    const response = await api.get<Notebook[]>(NotebookServiceApiEndpoints.createNotebook.replace('/create/', '/'), {
      headers: getAuthHeaders(),
    })
    return response.data
  },

  listArchived: async () => {
    // Backend endpoint TBD — return empty until confirmed
    return []
  },

  create: async (title) => {
    const response = await api.post<Notebook>(
      NotebookServiceApiEndpoints.createNotebook,
      { title },
      { headers: getAuthHeaders() }
    )
    return response.data
  },

  update: async (id, changes) => {
    await api.patch(`/notebooks/${id}/`, changes, { headers: getAuthHeaders() })
  },

  delete: async (id) => {
    await api.delete(NotebookServiceApiEndpoints.deleteNotebook(String(id)), {
      headers: getAuthHeaders(),
    })
  },

  archive: async (id) => {
    await api.patch(`/notebooks/${id}/`, { archived: true }, { headers: getAuthHeaders() })
  },

  unarchive: async (id) => {
    await api.patch(`/notebooks/${id}/`, { archived: false }, { headers: getAuthHeaders() })
  },

  seed: async () => {
    // No-op in API mode — backend has its own data
  },
}

export default NotebookServiceApi
