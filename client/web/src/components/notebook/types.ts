/**
 * Which tool the notebook workspace is showing. Mirrors the `?view=` query
 * param, which is the source of truth so a tool is deep-linkable.
 *
 * This lived in OptionsColumn until the tool switcher became NotebookToolRail;
 * it sits here so nothing has to import a component just for a type.
 */
export type ActiveView = "chat" | "quiz" | "presentation" | "audio";
