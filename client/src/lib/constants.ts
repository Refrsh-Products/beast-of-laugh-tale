export const ACCEPTED_FILE_EXTENSIONS = [
  ".txt",
  ".md",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".tiff",
  ".bmp",
  ".pdf",
  ".docx",
  ".doc",
  ".pptx",
  ".ppt",
  ".xlsx",
  ".xls",
] as const;

export const ACCEPTED_FILE_TYPES = ACCEPTED_FILE_EXTENSIONS.join(",");

export const ACCEPTED_AUDIO_EXTENSIONS = [
  ".mp3",
  ".mp4",
  ".m4a",
  ".wav",
  ".ogg",
  ".flac",
  ".aac",
  ".webm",
  ".3gp",
  ".amr",
] as const;

export const ACCEPTED_AUDIO_TYPES = ACCEPTED_AUDIO_EXTENSIONS.join(",");

export const MAX_AUDIO_BYTES = 500 * 1024 * 1024; // 500 MB

export function isAudioFile(file: File): boolean {
  const ext = file.name.includes(".")
    ? "." + file.name.split(".").pop()!.toLowerCase()
    : "";
  return (ACCEPTED_AUDIO_EXTENSIONS as readonly string[]).includes(ext);
}
