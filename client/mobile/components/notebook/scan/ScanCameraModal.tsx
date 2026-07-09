import { Modal } from 'react-native';
import { CameraCapture } from './CameraCapture';
import { ScanReview } from './ScanReview';
import type { useScanNotes } from '@/hooks/useScanNotes';

type ScanController = ReturnType<typeof useScanNotes>;

interface ScanCameraModalProps {
  scan: ScanController;
}

/**
 * Full-screen scan flow. Switches between the live camera and the review grid
 * based on the controller's `mode`. State lives in the `useScanNotes` hook so
 * the notebook screen can also react to a successful submit.
 */
export function ScanCameraModal({ scan }: ScanCameraModalProps) {
  const visible = scan.mode !== 'closed';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={scan.requestClose}>
      {scan.mode === 'camera' && (
        <CameraCapture
          photos={scan.photos}
          limit={scan.limit}
          onCapture={scan.addPhoto}
          onDone={scan.goToReview}
          onClose={scan.requestClose}
        />
      )}
      {scan.mode === 'review' && (
        <ScanReview
          photos={scan.photos}
          limit={scan.limit}
          isSubmitting={scan.isSubmitting}
          phase={scan.phase}
          uploadProgress={scan.uploadProgress}
          submitError={scan.submitError}
          onAddMore={scan.goToCamera}
          onDelete={scan.deletePhoto}
          onRetake={scan.startRetake}
          onSubmit={scan.submitBatch}
          onClose={scan.requestClose}
        />
      )}
    </Modal>
  );
}
