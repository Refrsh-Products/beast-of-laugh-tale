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
import type { NotebookService } from './NotebookService.types'

const NotebookServiceMock: NotebookService = {
  list: () => Promise.resolve(getNotebooks()),
  listArchived: () => Promise.resolve(getArchivedNotebooks()),
  create: (title) => Promise.resolve(createNotebook(title)),
  update: (id, changes) => { updateNotebook(id, changes); return Promise.resolve() },
  delete: (id) => { deleteNotebook(id); return Promise.resolve() },
  archive: (id) => { archiveNotebook(id); return Promise.resolve() },
  unarchive: (id) => { unarchiveNotebook(id); return Promise.resolve() },
  seed: () => { seedNotebooks(); return Promise.resolve() },
}

export default NotebookServiceMock
