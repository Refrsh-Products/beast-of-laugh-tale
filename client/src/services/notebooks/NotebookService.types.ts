import type { Notebook } from "../../storage";

export interface NotebookService {
  list(): Promise<Notebook[]>; // List of all the notebooks for the user
  listArchived(): Promise<Notebook[]>; // List of all the archived notebooks for the user
  create(title: string): Promise<Notebook>; // Create a notebook for the user
  update(id: string, changes: Partial<Notebook>): Promise<Notebook>; // Update an existing notebook for the user
  delete(id: string): Promise<void>; // Delete an existing notebook for the user
  archive(id: string): Promise<void>;
  unarchive(id: string): Promise<void>;
  seed(): Promise<void>;
}
