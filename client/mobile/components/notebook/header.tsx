import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ChevronLeft, EllipsisVerticalIcon, Edit2, Pin, Archive, Trash2, PinOff } from 'lucide-react-native';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { Separator } from '../ui/separator';
import { Icon } from '../ui/icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu';

interface HeaderProps {
  title: string;
  isPinned?: boolean;
  isArchived?: boolean;
  onRename?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onPinToggle?: () => void;
}

function Header({
  title,
  isPinned,
  isArchived,
  onRename,
  onDelete,
  onArchive,
  onPinToggle,
}: HeaderProps) {
  const router = useRouter();

  return (
    <View className="w-full px-5">
      <View className="w-full flex-row items-center justify-between">
        <Button variant="ghost" size="icon" onPress={() => router.back()}>
          <Icon as={ChevronLeft} size={30} />
        </Button>

        <Text variant="h3">{title}</Text>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <EllipsisVerticalIcon size={20} className="text-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48">
            <DropdownMenuItem onPress={onRename} disabled={isArchived}>
              <Icon as={Edit2} size={16} className="mr-2 text-foreground" />
              <Text>Rename</Text>
            </DropdownMenuItem>
            
            <DropdownMenuItem onPress={onPinToggle}>
              <Icon as={isPinned ? PinOff : Pin} size={16} className="mr-2 text-foreground" />
              <Text>{isPinned ? 'Unpin' : 'Pin'}</Text>
            </DropdownMenuItem>

            {!isArchived && (
              <DropdownMenuItem onPress={onArchive}>
                <Icon as={Archive} size={16} className="mr-2 text-foreground" />
                <Text>Archive</Text>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            
            <DropdownMenuItem onPress={onDelete} variant="destructive">
              <Icon as={Trash2} size={16} className="mr-2 text-destructive" />
              <Text className="text-destructive">Delete</Text>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </View>

      <Separator
        style={{
          marginTop: 10,
          backgroundColor: '#E4E4E7',
          height: 1,
        }}
      />
    </View>
  );
}

export { Header };
