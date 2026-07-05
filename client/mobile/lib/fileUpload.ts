import type { DocumentPickerAsset } from 'expo-document-picker';

// ── Allowed MIME types ──────────────────────────────────────────────────────
// Maps each allowed MIME type to a human-friendly label shown in the UI.
export const ALLOWED_FILE_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'text/plain': 'Text File',
  'text/markdown': 'Markdown',
  'image/png': 'PNG Image',
  'image/jpeg': 'JPEG Image',
  'image/jpg': 'JPEG Image',
};

/** The MIME type strings passed to `DocumentPicker.getDocumentAsync`. */
export const DOCUMENT_PICKER_TYPES = Object.keys(ALLOWED_FILE_TYPES);

// ── Size limit ──────────────────────────────────────────────────────────────
/** Maximum file size in bytes (25 MB). */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

/** Maximum file size as a human-readable string. */
export const MAX_FILE_SIZE_LABEL = '25 MB';

// ── Validation ──────────────────────────────────────────────────────────────
export interface FileValidationResult {
  valid: boolean;
  error: string | null;
}

/**
 * Validates a picked file against the allowed-type whitelist and the max-size
 * cap. Returns `{ valid: true }` when the file is acceptable, or
 * `{ valid: false, error: '...' }` with a user-facing message otherwise.
 */
export function validateFile(asset: DocumentPickerAsset): FileValidationResult {
  const mime = asset.mimeType ?? '';

  if (!ALLOWED_FILE_TYPES[mime]) {
    const ext = asset.name.split('.').pop()?.toUpperCase() ?? mime;
    return {
      valid: false,
      error: `Unsupported file type: .${ext}. Allowed types: PDF, DOCX, PPTX, TXT, MD, PNG, JPG.`,
    };
  }

  const size = asset.size ?? 0;
  if (size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File is too large (${sizeMB} MB). Maximum allowed size is ${MAX_FILE_SIZE_LABEL}.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Returns a human-friendly file-type label for a given MIME type.
 * Falls back to the uppercase file extension if the MIME isn't recognised.
 */
export function getFileTypeLabel(mimeType: string | undefined, fileName: string): string {
  if (mimeType && ALLOWED_FILE_TYPES[mimeType]) {
    return ALLOWED_FILE_TYPES[mimeType];
  }
  const ext = fileName.split('.').pop()?.toUpperCase();
  return ext ? `.${ext} File` : 'Unknown';
}
