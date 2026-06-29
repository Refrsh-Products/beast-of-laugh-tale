import { View } from 'react-native';
import { Card, CardDescription, CardHeader, CardTitle } from '../ui/card';

interface FileCardProps {
  fileName: string;
  fileSize: number; // Expects size in bytes
  fileType: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 MB';

  const MB = 1024 * 1024;
  const GB = MB * 1024;

  if (bytes >= GB) {
    // If it's 1 GB or larger, format as GB
    return `${parseFloat((bytes / GB).toFixed(2))} GB`;
  }

  // Otherwise, default to formatting in MB
  const sizeInMB = bytes / MB;

  // Prevent microscopic files from rounding down to exactly "0 MB"
  if (sizeInMB > 0 && sizeInMB < 0.01) {
    return '< 0.01 MB';
  }

  return `${parseFloat(sizeInMB.toFixed(2))} MB`;
};

function FileCard({ fileName, fileSize, fileType }: FileCardProps) {
  return (
    <View className="w-full px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{fileName}</CardTitle>
          <CardDescription>
            {formatFileSize(fileSize)} | {fileType}
          </CardDescription>
        </CardHeader>
      </Card>
    </View>
  );
}

export { FileCard };
