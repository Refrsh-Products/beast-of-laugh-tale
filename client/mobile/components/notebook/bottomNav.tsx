import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { Text } from '../ui/text';
import { Button } from '../ui/button';
import { Icon } from '../ui/icon';
import {
  AudioLines,
  ChevronsUpDown,
  LucideIcon,
  CircleQuestionMark,
  Presentation,
  Settings,
  SquareCheckBig,
} from 'lucide-react-native';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { id, notebookId } = useLocalSearchParams<{ id?: string; notebookId?: string }>();
  const activeNotebookId = notebookId ?? id;
  const [value, setValue] = useState(() => (pathname.includes('/chat') ? 'chat' : 'files'));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedToolIcon, setSelectedToolIcon] = useState<LucideIcon | null>(null);
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 4,
    right: 4,
  };

  useEffect(() => {
    setValue(pathname.includes('/chat') ? 'chat' : 'files');
  }, [pathname]);

  const handleTabChange = (nextValue: string) => {
    setValue(nextValue);

    if (!activeNotebookId) return;

    if (nextValue === 'chat') {
      router.replace({ pathname: '/notebooks/chat', params: { notebookId: activeNotebookId } });
      return;
    }

    router.replace({ pathname: '/notebooks/[id]', params: { id: activeNotebookId } });
  };

  return (
    <View className="flex flex-row items-center gap-2">
      <View className="flex max-w-sm flex-col gap-6">
        <Tabs value={value} onValueChange={handleTabChange}>
          {/* Gray pill container background behind all tabs */}
          <TabsList
            style={{
              backgroundColor: '#d3d3d3', // The base gray background
              padding: 4,
              borderRadius: 10,
              flexDirection: 'row',
              width: '100%',
            }}>
            <TabsTrigger
              value="files"
              style={[
                {
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  borderWidth: 0, // Kills the hard black border on inactive tabs
                },
                // Highlights only the active tab with white bg + shadow
                value === 'files' && {
                  backgroundColor: '#ffffff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                },
              ]}>
              <Text style={{ fontWeight: value === 'files' ? '600' : '400' }}>Files</Text>
            </TabsTrigger>

            <TabsTrigger
              value="chat"
              style={[
                {
                  flex: 1,
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  borderWidth: 0, // Kills the hard black border on inactive tabs
                },
                // Highlights only the active tab with white bg + shadow
                value === 'chat' && {
                  backgroundColor: '#ffffff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                },
              ]}>
              <Text style={{ fontWeight: value === 'chat' ? '600' : '400' }}>Chat</Text>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </View>
      <DropdownMenu onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant={isMenuOpen ? 'secondary' : 'outline'} size="icon">
            <Icon as={selectedToolIcon ?? ChevronsUpDown} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          insets={contentInsets}
          sideOffset={2}
          className="w-56 border-gray-400 bg-background"
          align="end">
          <DropdownMenuLabel>
            <Text variant="muted" className="text-xs">
              Tools
            </Text>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onPress={() => {
                setSelectedToolIcon(SquareCheckBig);
                if (activeNotebookId) {
                  router.push({ pathname: '/notebooks/quiz', params: { notebookId: activeNotebookId } });
                }
              }}>
              <Icon as={SquareCheckBig} />
              <Text variant="small">Quiz</Text>
            </DropdownMenuItem>
            <DropdownMenuItem
              onPress={() => {
                setSelectedToolIcon(Presentation);
                if (activeNotebookId) {
                  router.push({ pathname: '/notebooks/presentation', params: { notebookId: activeNotebookId } });
                }
              }}>
              <Icon as={Presentation} />
              <Text variant="small">Presentation</Text>
            </DropdownMenuItem>
            <DropdownMenuItem
              onPress={() => {
                setSelectedToolIcon(AudioLines);
                if (activeNotebookId) {
                  router.push({ pathname: '/notebooks/transcription', params: { notebookId: activeNotebookId } });
                }
              }}>
              <Icon as={AudioLines} />
              <Text variant="small">Audio Transcription</Text>
            </DropdownMenuItem>
            <DropdownMenuItem
              onPress={() => {
                setSelectedToolIcon(CircleQuestionMark);
              }}>
              <Icon as={CircleQuestionMark} />
              <Text variant="small">Help</Text>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Icon as={Settings} />
              <Text variant="small">Settings</Text>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>
                <Text>Account</Text>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Text>Billing</Text>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Text>More...</Text>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Text variant="small">Log Out</Text>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  );
}

export { BottomNav };
