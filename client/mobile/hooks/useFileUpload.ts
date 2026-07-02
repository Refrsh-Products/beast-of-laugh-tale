import { useCallback, useMemo, useRef, useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import axios, { type CancelTokenSource } from 'axios';
import { useNotebookService } from './useNotebookService';
import { appConfig } from '@/lib/config';
import { mobileSessionStore } from '@/lib/session';
import { NotebookServiceApiEndpoints } from '@freshr/shared';
import {
  DOCUMENT_PICKER_TYPES,
  validateFile,
  type FileValidationResult,
} from '@/lib/fileUpload';
import type { FileUploadStatus } from '@/components/notebook/fileCard';

// ── Upload entry tracked per in-flight file ──────────────────────────────────
export interface UploadEntry {
  tempId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  progress: number; // 0-100
  status: FileUploadStatus;
  error: string | null;
  /** Preserved so we can retry without re-picking. */
  asset: DocumentPicker.DocumentPickerAsset;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFileUpload(notebookId: string) {
  const notebookService = useNotebookService();

  // The most-recently picked file awaiting confirmation.
  const [selectedAsset, setSelectedAsset] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Modal-level uploading flag (disables Cancel while the request is in flight).
  const [isConfirming, setIsConfirming] = useState(false);

  // All upload entries (in-progress, succeeded, failed) keyed by tempId.
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadEntry>>(
    () => new Map(),
  );

  // Track cancel tokens for in-flight uploads so we can abort on unmount.
  const cancelTokens = useRef<Map<string, CancelTokenSource>>(new Map());

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Immutable map update helper. */
  const updateEntry = useCallback(
    (tempId: string, patch: Partial<UploadEntry>) => {
      setUploadingFiles((prev) => {
        const next = new Map(prev);
        const existing = next.get(tempId);
        if (existing) {
          next.set(tempId, { ...existing, ...patch });
        }
        return next;
      });
    },
    [],
  );

  const removeEntry = useCallback((tempId: string) => {
    setUploadingFiles((prev) => {
      const next = new Map(prev);
      next.delete(tempId);
      return next;
    });
  }, []);

  // ── Public API ───────────────────────────────────────────────────────────

  /** Opens the system file picker. */
  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: DOCUMENT_PICKER_TYPES,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      const validation: FileValidationResult = validateFile(asset);

      setSelectedAsset(asset);
      setValidationError(validation.valid ? null : validation.error);
    } catch (err) {
      console.error('[useFileUpload] Failed to pick document', err);
    }
  }, []);

  /** Clears the current selection (closes the preview modal). */
  const cancelSelection = useCallback(() => {
    setSelectedAsset(null);
    setValidationError(null);
    setIsConfirming(false);
  }, []);

  /**
   * Performs the actual multipart upload with progress tracking.
   * Can be called from `confirmUpload` (fresh pick) or `retryUpload` (failed).
   */
  const doUpload = useCallback(
    async (asset: DocumentPicker.DocumentPickerAsset, tempId: string) => {
      // Prepare FormData the way React Native expects.
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      } as any);

      const source = axios.CancelToken.source();
      cancelTokens.current.set(tempId, source);

      updateEntry(tempId, { status: 'uploading', progress: 0, error: null });

      try {
        await axios.post(
          `${appConfig.apiBaseUrl}${NotebookServiceApiEndpoints.createFile(notebookId)}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${mobileSessionStore.getAccessToken()}`,
            },
            timeout: 120_000,
            cancelToken: source.token,
            onUploadProgress: (event) => {
              if (event.total) {
                const pct = Math.round((event.loaded / event.total) * 100);
                updateEntry(tempId, { progress: pct });
              }
            },
          },
        );

        updateEntry(tempId, { status: 'success', progress: 100 });

        // Auto-remove from the uploading list after the success indicator fades.
        setTimeout(() => removeEntry(tempId), 2500);
      } catch (err: any) {
        if (axios.isCancel(err)) return;

        const message =
          err?.response?.data?.detail ??
          err?.response?.data?.error ??
          err?.message ??
          'Upload failed. Please try again.';

        updateEntry(tempId, { status: 'error', error: message });
      } finally {
        cancelTokens.current.delete(tempId);
      }
    },
    [notebookId, updateEntry, removeEntry],
  );

  /** Called when the user taps "Upload" in the preview modal. */
  const confirmUpload = useCallback(async () => {
    if (!selectedAsset) return;

    const tempId = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const entry: UploadEntry = {
      tempId,
      fileName: selectedAsset.name,
      fileSize: selectedAsset.size ?? 0,
      fileType: selectedAsset.mimeType ?? 'unknown',
      progress: 0,
      status: 'uploading',
      error: null,
      asset: selectedAsset,
    };

    setUploadingFiles((prev) => {
      const next = new Map(prev);
      next.set(tempId, entry);
      return next;
    });

    // Close the modal immediately — the FileCard will show progress.
    setIsConfirming(true);
    cancelSelection();

    await doUpload(selectedAsset, tempId);
  }, [selectedAsset, cancelSelection, doUpload]);

  /** Retry a failed upload without re-picking. */
  const retryUpload = useCallback(
    (tempId: string) => {
      const entry = uploadingFiles.get(tempId);
      if (!entry) return;
      void doUpload(entry.asset, tempId);
    },
    [uploadingFiles, doUpload],
  );

  return {
    // Document picker
    pickFile,
    selectedAsset,
    validationError,
    // Preview modal actions
    confirmUpload,
    cancelSelection,
    isConfirming,
    // Active upload tracking
    uploadingFiles,
    retryUpload,
  };
}
