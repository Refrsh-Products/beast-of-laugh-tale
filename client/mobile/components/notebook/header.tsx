import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ChevronLeft, EllipsisVerticalIcon } from 'lucide-react-native';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import { Separator } from '../ui/separator';
import { Icon } from '../ui/icon';

interface HeaderProps {
  title: string;
}

function Header({ title }: HeaderProps) {
  const router = useRouter();

  return (
    <View className="w-full px-5">
      <View className="w-full flex-row items-center justify-between">
        <Button variant="ghost" size="icon" onPress={() => router.back()}>
          <Icon as={ChevronLeft} size={30} />
        </Button>

        <Text variant="h3">{title}</Text>

        <Button
          variant="outline"
          size="icon"
          onPress={() => {
            console.log('not implemented yet');
          }}>
          <EllipsisVerticalIcon size={20} className="text-foreground" />
        </Button>
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
