import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View, type ViewStyle } from 'react-native';
import { Text } from '../ui/text';
import { Icon } from '../ui/icon';
import {
  AudioLines,
  ChevronsUpDown,
  Folder,
  LucideIcon,
  MessageCircle,
  Presentation,
  Settings,
  SquareCheckBig,
} from 'lucide-react-native';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';

type SectionKey = 'files' | 'chat' | 'quiz' | 'presentation' | 'transcription';

const SECTION_ICONS: Record<SectionKey, LucideIcon> = {
  files: Folder,
  chat: MessageCircle,
  quiz: SquareCheckBig,
  presentation: Presentation,
  transcription: AudioLines,
};

const TOOL_SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'quiz', label: 'Quiz' },
  { key: 'presentation', label: 'Presentation' },
  { key: 'transcription', label: 'Audio Transcription' },
];

/** Floating icon pill. Files and Chat get fixed slots; the third
 *  slot opens the full menu and adopts the icon of whichever tool screen is
 *  active (with a tiny chevron), so the bar always reflects where you are.
 *  Active state derives from the route — never from which tab you came from. */
function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { id, notebookId } = useLocalSearchParams<{ id?: string; notebookId?: string }>();
  const activeNotebookId = notebookId ?? id;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDarkColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();
  // The active slot must contrast with the `bg-muted` pill, so it can't reuse
  // the `background` token (which nearly matches muted AND the screen — the
  // highlight vanished). A raised surface — white in light, a lighter gray in
  // dark — plus a soft shadow reads clearly, Linear-style.
  const activeSlotStyle: ViewStyle = {
    backgroundColor: isDarkColorScheme ? 'hsl(0 0% 32%)' : '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: isDarkColorScheme ? 0.4 : 0.12,
    shadowRadius: 3,
    elevation: 3,
  };
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const active: SectionKey = pathname.includes('/chat')
    ? 'chat'
    : pathname.includes('/quiz')
      ? 'quiz'
      : pathname.includes('/presentation')
        ? 'presentation'
        : pathname.includes('/transcription')
          ? 'transcription'
          : 'files';

  const isToolActive = active !== 'files' && active !== 'chat';

  const navigate = (key: SectionKey) => {
    if (!activeNotebookId || key === active) return;
    if (key === 'files') {
      router.replace({ pathname: '/notebooks/[id]', params: { id: activeNotebookId } });
      return;
    }
    const pathnames: Record<Exclude<SectionKey, 'files'>, string> = {
      chat: '/notebooks/chat',
      quiz: '/notebooks/quiz',
      presentation: '/notebooks/presentation',
      transcription: '/notebooks/transcription',
    };
    router.replace({
      pathname: pathnames[key] as never,
      params: { notebookId: activeNotebookId } as never,
    });
  };

  // Defensive: item presses also close the dropdown; deferring one tick lets
  // the portal finish closing before `replace` unmounts the screen that owns it.
  const navigateFromMenu = (key: SectionKey) => {
    setTimeout(() => navigate(key), 0);
  };

  return (
    <View className="flex-row items-center rounded-full bg-muted p-1.5">
      <NavSlot
        icon={Folder}
        label="Files"
        active={active === 'files'}
        activeStyle={activeSlotStyle}
        onPress={() => navigate('files')}
      />
      <NavSlot
        icon={MessageCircle}
        label="Chat"
        active={active === 'chat'}
        activeStyle={activeSlotStyle}
        onPress={() => navigate('chat')}
      />

      <DropdownMenu onOpenChange={setIsMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Pressable
            accessibilityLabel="More tools"
            className="flex-row items-center justify-center gap-1 rounded-full px-5 py-2.5 active:opacity-70"
            style={isToolActive || isMenuOpen ? activeSlotStyle : undefined}>
            <Icon
              as={isToolActive ? SECTION_ICONS[active] : ChevronsUpDown}
              size={20}
              className={isToolActive || isMenuOpen ? 'text-foreground' : 'text-muted-foreground'}
            />
            {isToolActive && (
              <Icon as={ChevronsUpDown} size={12} className="text-muted-foreground" />
            )}
          </Pressable>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          insets={contentInsets}
          side="top"
          sideOffset={10}
          align="center"
          className="w-64 rounded-2xl border-border bg-background">
          <DropdownMenuGroup>
            <MenuRow
              icon={Folder}
              label="Files"
              active={active === 'files'}
              onPress={() => navigateFromMenu('files')}
            />
            <MenuRow
              icon={MessageCircle}
              label="Chat"
              active={active === 'chat'}
              onPress={() => navigateFromMenu('chat')}
            />
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {TOOL_SECTIONS.map(({ key, label }) => (
              <MenuRow
                key={key}
                icon={SECTION_ICONS[key]}
                label={label}
                active={active === key}
                onPress={() => navigateFromMenu(key)}
              />
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <MenuRow
            icon={Settings}
            label="Account"
            onPress={() => setTimeout(() => router.push('/account'), 0)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  );
}

function NavSlot({
  icon,
  label,
  active,
  activeStyle,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  activeStyle: ViewStyle;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      className="items-center justify-center rounded-full px-5 py-2.5 active:opacity-70"
      style={active ? activeStyle : undefined}>
      <Icon as={icon} size={20} className={active ? 'text-foreground' : 'text-muted-foreground'} />
    </Pressable>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <DropdownMenuItem onPress={onPress} className={`gap-3 rounded-lg ${active ? 'bg-accent' : ''}`}>
      <Icon as={icon} size={18} className="text-foreground" />
      <Text variant="small">{label}</Text>
    </DropdownMenuItem>
  );
}

export { BottomNav };
