import { useCallback, useRef, useState } from 'react';
import { Alert } from 'react-native';
import axios from 'axios';
import { appConfig } from '@/lib/config';
import { mobileSessionStore } from '@/lib/session';
import { NotebookServiceApiEndpoints } from '@freshr/shared';
import type { NotebookScanRejectionResponse } from '@freshr/shared';
import {
  getScanPhotoLimit,
  makeScanPhotoId,
  type ScanPhoto,
} from '@/lib/scanNotes';

export type ScanMode = 'closed' | 'camera' | 'review';
export type ScanPhase = 'idle' | 'uploading' | 'validating';

interface UseScanNotesOptions {
  /** Called after a batch is accepted (201) so the screen can refresh files. */
  onSuccess?: () => void;
}

export function useScanNotes(notebookId: string, options: UseScanNotesOptions = {}) {
  const { onSuccess } = options;

  const [mode, setMode] = useState<ScanMode>('closed');
  const [photos, setPhotos] = useState<ScanPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Keep the latest onSuccess without making submitBatch's identity churn.
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const limit = getScanPhotoLimit();

  const resetState = useCallback(() => {
    setPhotos([]);
    setIsSubmitting(false);
    setPhase('idle');
    setUploadProgress(0);
    setSubmitError(null);
  }, []);

  const openScanner = useCallback(() => {
    resetState();
    setMode('camera');
  }, [resetState]);

  const forceClose = useCallback(() => {
    setMode('closed');
    resetState();
  }, [resetState]);

  /** Close request that guards against discarding captured photos. */
  const requestClose = useCallback(() => {
    if (isSubmitting) return;
    if (photos.length === 0) {
      forceClose();
      return;
    }
    Alert.alert('Discard photos?', 'Your captured photos will be lost.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: forceClose },
    ]);
  }, [isSubmitting, photos.length, forceClose]);

  const goToCamera = useCallback(() => setMode('camera'), []);
  const goToReview = useCallback(() => setMode('review'), []);

  const addPhoto = useCallback(
    (uri: string) => {
      setPhotos((prev) => {
        if (prev.length >= limit) return prev;
        return [...prev, { id: makeScanPhotoId(), uri, status: 'ok' }];
      });
    },
    [limit]
  );

  const deletePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /** Remove the photo and return to the camera to shoot a replacement. */
  const startRetake = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setMode('camera');
  }, []);

  const submitBatch = useCallback(async () => {
    if (photos.length === 0 || isSubmitting) return;

    // Snapshot ids so a 422's per-photo index maps back to the right photo.
    const submittedIds = photos.map((p) => p.id);

    const formData = new FormData();
    photos.forEach((photo, i) => {
      formData.append('photos', {
        uri: photo.uri,
        name: `scan_${i}.jpg`,
        type: 'image/jpeg',
      } as any);
    });

    setIsSubmitting(true);
    setPhase('uploading');
    setUploadProgress(0);
    setSubmitError(null);
    // Clear any prior rejection flags before re-validating.
    setPhotos((prev) => prev.map((p) => ({ ...p, status: 'ok', rejection: undefined })));

    try {
      const response = await axios.post(
        `${appConfig.apiBaseUrl}${NotebookServiceApiEndpoints.scanPhotos(notebookId)}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${mobileSessionStore.getAccessToken()}`,
          },
          timeout: 180_000,
          onUploadProgress: (event) => {
            if (event.total) {
              const pct = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(pct);
              // Bytes are up; the server is now validating + building the PDF.
              if (pct >= 100) setPhase('validating');
            }
          },
        }
      );

      if (response.status === 201) {
        forceClose();
        onSuccessRef.current?.();
        return;
      }
      // Unexpected 2xx — treat as a soft failure.
      setSubmitError('Something went wrong. Please try again.');
      setPhase('idle');
    } catch (err: any) {
      const status = err?.response?.status;
      const data = err?.response?.data;

      if (status === 422 && data?.code === 'photo_validation_failed') {
        const rejection = data as NotebookScanRejectionResponse;
        const byIndex = new Map(rejection.photos.map((r) => [r.index, r]));
        setPhotos((prev) =>
          prev.map((photo) => {
            const idx = submittedIds.indexOf(photo.id);
            const result = byIndex.get(idx);
            if (result && !result.acceptable) {
              return { ...photo, status: 'rejected', rejection: result };
            }
            return { ...photo, status: 'ok', rejection: undefined };
          })
        );
        setSubmitError('Some photos need to be retaken or removed.');
        setMode('review');
      } else if (status === 403 && data?.code) {
        // Quota / limit / archived — surface the server's message.
        setSubmitError(data.message ?? 'You cannot add this scan.');
        setMode('review');
      } else if (status === 400) {
        setSubmitError(data?.message ?? 'One of the photos could not be read.');
        setMode('review');
      } else {
        setSubmitError("Couldn't check your photos. Please try again.");
        setMode('review');
      }
    } finally {
      setIsSubmitting(false);
      setPhase('idle');
      setUploadProgress(0);
    }
  }, [photos, isSubmitting, notebookId, forceClose]);

  return {
    mode,
    photos,
    limit,
    isSubmitting,
    phase,
    uploadProgress,
    submitError,
    openScanner,
    requestClose,
    forceClose,
    goToCamera,
    goToReview,
    addPhoto,
    deletePhoto,
    startRetake,
    submitBatch,
  };
}
