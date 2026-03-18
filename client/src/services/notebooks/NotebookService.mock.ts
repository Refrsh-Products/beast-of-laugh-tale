import {
  getNotebooks,
  getArchivedNotebooks,
  createNotebook,
  updateNotebook,
  deleteNotebook,
  archiveNotebook,
  unarchiveNotebook,
  seedNotebooks,
} from '../../storage'
import type { NotebookFile } from '../../storage'
import type { NotebookService } from './NotebookService.types'

const NotebookServiceMock: NotebookService = {
  list: () => Promise.resolve(getNotebooks()),
  listArchived: () => Promise.resolve(getArchivedNotebooks()),
  listFiles: (notebookId) => {
    const nb = getNotebooks().find((n) => n.id === notebookId)
    const count = nb?.file_count ?? 0
    const files: NotebookFile[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      notebook: parseInt(notebookId, 10) || 0,
      name: `file_${i + 1}`,
      file_type: 'pdf',
      is_indexed: true,
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
    return Promise.resolve(files)
  },
  create: (title) => Promise.resolve(createNotebook(title)),
  update: (id, changes) => {
    updateNotebook(id, changes)
    const updated = getNotebooks().find((notebook) => notebook.id === id)
    if (!updated) return Promise.reject(new Error(`Notebook with id "${id}" not found`))
    return Promise.resolve(updated)
  },
  delete: (id) => { deleteNotebook(id); return Promise.resolve() },
  archive: (id) => { archiveNotebook(id); return Promise.resolve() },
  unarchive: (id) => { unarchiveNotebook(id); return Promise.resolve() },
  seed: () => { seedNotebooks(); return Promise.resolve() },
}

export default NotebookServiceMock
