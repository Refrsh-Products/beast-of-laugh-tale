import { View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Info } from 'lucide-react-native';

interface ArchiveBannerProps {
  isArchived?: boolean;
}

export function ArchiveBanner({ isArchived }: ArchiveBannerProps) {
  if (!isArchived) return null;

  return (
    <View className="mx-5 mt-4 flex-row items-center rounded-lg bg-muted p-3 gap-1">
      <Icon as={Info} size={20} className="mr-2 text-muted-foreground" />
      <Text className="text-muted-foreground text-sm">
        This notebook has been archived. Read-only mode.
      </Text>
    </View>
  );
}
