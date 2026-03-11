import type { Notebook } from '../../storage'

export interface NotebookService {
  list(): Promise<Notebook[]>
  listArchived(): Promise<Notebook[]>
  create(title: string): Promise<Notebook>
  update(id: number, changes: Partial<Notebook>): Promise<void>
  delete(id: number): Promise<void>
  archive(id: number): Promise<void>
  unarchive(id: number): Promise<void>
  seed(): Promise<void>
}
