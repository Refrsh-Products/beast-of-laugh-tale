import { Link, useFocusEffect } from 'expo-router';
import {
  Archive,
  ArchiveRestore,
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarArrowDown,
  CalendarArrowUp,
  Search,
  Trash2,
} from 'lucide-react-native';
import { useCallback, useMemo, useState, useRef } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Screen } from '@/components/ui/screen';
import { UpgradeSheet } from '@/components/account/upgradeSheet';
import { UsageCard } from '@/components/notebook/usageCard';
import { getApiErrorCode, NOTEBOOK_QUOTA_EXCEEDED } from '@/lib/apiError';
import { Text } from '@/components/ui/text';
import { useNotebookService } from '@/hooks/useNotebookService';
import { useAccountService } from '@/hooks/useAccountService';
import { Notebook, AccountUsage } from '@freshr/shared';
import { mobileSessionStore } from '@/lib/session';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Tab = 'active' | 'archived';
type SortMode = 'newest' | 'oldest' | 'a-z' | 'z-a';

const SORT_CYCLE: SortMode[] = ['newest', 'oldest', 'a-z', 'z-a'];
const SORT_CONFIG: Record<SortMode, { icon: typeof ArrowDownAZ; label: string }> = {
  newest: { icon: CalendarArrowDown, label: 'Newest' },
  oldest: { icon: CalendarArrowUp, label: 'Oldest' },
  'a-z': { icon: ArrowDownAZ, label: 'A → Z' },
  'z-a': { icon: ArrowUpAZ, label: 'Z → A' },
};

/** Compact "Last edited 2m ago" style label from an ISO timestamp. */
function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const mins = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;

  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;

  const weeks = Math.round(days / 7);
  if (weeks === 1) return 'a week ago';
  if (weeks < 4) return `${weeks} weeks ago`;

  const months = Math.round(days / 30);
  return months <= 1 ? 'a month ago' : `${months} months ago`;
}

export default function NotebookListScreen() {
  const notebookService = useNotebookService();
  const accountService = useAccountService();

  const openRowRef = useRef<string | null>(null);
  const swipeableRefs = useRef<Map<string, any>>(new Map());

  const closeCurrentRow = useCallback((excludeId?: string) => {
    if (openRowRef.current && openRowRef.current !== excludeId) {
      const row = swipeableRefs.current.get(openRowRef.current);
      if (row) {
        row.close();
      }
      openRowRef.current = null;
    }
  }, []);

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [usage, setUsage] = useState<AccountUsage | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingUsage, setLoadingUsage] = useState(true);
  const [value, setValue] = useState<Tab>('active');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  const getNotebookFiles = async (notebooksData: Notebook[]) => {
    try {
      const updatedNotebooks = await Promise.all(
        notebooksData.map(async (notebook) => {
          try {
            const files = await notebookService.listFiles(notebook.id);
            return {
              ...notebook,
              file_count: files.length,
            };
          } catch (error) {
            console.error(`Failed to fetch files for notebook ${notebook.id}:`, error);
            return notebook;
          }
        })
      );
      setNotebooks(updatedNotebooks);
    } catch (error) {
      console.error('Failed to update notebook files:', error);
    }
  };

  const loadData = useCallback(async () => {
    try {
      const [notebooksData, archivedNotebooksData, usageData] = await Promise.all([
        notebookService.list(),
        notebookService.listArchived(),
        accountService.getAccountUsage(),
      ]);
      const allNotebooks = [...notebooksData, ...archivedNotebooksData];
      setNotebooks(allNotebooks);
      setUsage(usageData);
      getNotebookFiles(allNotebooks);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoadingUsage(false);
    }
  }, [notebookService, accountService]);

  // Initial fetch on mount and when screen comes into focus.
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const visibleNotebooks = useMemo(() => {
    let filtered = notebooks.filter((notebook) =>
      value === 'archived' ? notebook.is_archived : !notebook.is_archived
    );

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((notebook) => notebook.title.toLowerCase().includes(lowerQuery));
    }

    return [...filtered].sort((a, b) => {
      switch (sortMode) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  }, [notebooks, value, sortMode, searchQuery]);

  const handleTabChange = (nextValue: string) => {
    setValue(nextValue as Tab);
  };

  const cycleSortMode = () => {
    setSortMode((current) => {
      const idx = SORT_CYCLE.indexOf(current);
      return SORT_CYCLE[(idx + 1) % SORT_CYCLE.length];
    });
  };

  const handleDeleteNotebook = (notebook: Notebook) => {
    Alert.alert('Delete Notebook', `Are you sure you want to delete "${notebook.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await notebookService.delete(notebook.id);
            await loadData();
          } catch (error) {
            console.error('Failed to delete notebook:', error);
            Alert.alert('Error', 'Failed to delete notebook');
          }
        },
      },
    ]);
  };

  const handleToggleArchive = async (notebook: Notebook) => {
    const isArchiving = !notebook.is_archived;
    try {
      if (isArchiving) {
        await notebookService.archive(notebook.id);
      } else {
        await notebookService.unarchive(notebook.id);
      }
      // Close the swipeable row before reloading
      const row = swipeableRefs.current.get(notebook.id);
      if (row) row.close();
      openRowRef.current = null;
      await loadData();
    } catch (error) {
      if (!isArchiving && getApiErrorCode(error) === NOTEBOOK_QUOTA_EXCEEDED) {
        Alert.alert(
          'Notebook limit reached',
          'Restoring this notebook would exceed your active notebook limit on the free plan. Upgrade for more notebooks, or archive another one first.',
          [
            { text: 'Not now', style: 'cancel' },
            { text: 'Upgrade', onPress: () => setShowUpgradeSheet(true) },
          ]
        );
        return;
      }
      console.error(`Failed to ${isArchiving ? 'archive' : 'unarchive'} notebook:`, error);
      Alert.alert('Error', `Failed to ${isArchiving ? 'archive' : 'unarchive'} notebook`);
    }
  };

  return (
    <Screen className="bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-4">
        {isSearching ? (
          <View className="mr-3 flex-1 flex-row items-center pr-2">
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search notebooks..."
              className="flex-1"
              autoFocus
            />
          </View>
        ) : (
          <Text className="text-3xl font-bold tracking-widest">FRESHR</Text>
        )}
        <View className="flex-row items-center gap-3">
          <Pressable
            className={`size-10 items-center justify-center rounded-xl ${isSearching ? 'bg-primary' : 'bg-muted'} active:opacity-70`}
            onPress={() => {
              setIsSearching(!isSearching);
              if (isSearching) {
                setSearchQuery('');
              }
            }}>
            <Icon as={Search} size={20} color={isSearching ? 'white' : undefined} />
          </Pressable>
          <Link href="/account" asChild>
            <Pressable className="rounded-xl active:opacity-70">
              <Avatar alt="Profile" className="size-10 rounded-xl">
                <AvatarImage
                  source={{
                    uri:
                      mobileSessionStore.getAccount()?.profile_picture_url ||
                      'https://github.com/shadcn.png',
                  }}
                />
                <AvatarFallback>
                  <Text>
                    {mobileSessionStore.getAccount()?.first_name?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </AvatarFallback>
              </Avatar>
            </Pressable>
          </Link>
        </View>
      </View>
      <View className="mx-5 h-px bg-border" />

      <ScrollView
        contentContainerClassName="pb-6"
        onScrollBeginDrag={() => closeCurrentRow()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9Bd35A', '#689F38']}
            tintColor="#689F38"
          />
        }>
        {/* Usage Overview */}
        <Text className="px-5 pt-6 text-2xl font-bold">Usage Overview</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 px-5 py-4">
          {loadingUsage ? (
            <View className="w-64 items-center justify-center py-4">
              <ActivityIndicator size="small" />
              <Text className="mt-2 text-muted-foreground">Loading usage...</Text>
            </View>
          ) : usage ? (
            [
              {
                id: 'notebooks',
                title: 'Notebooks',
                used: usage.notebooks.used,
                limit: usage.notebooks.limit,
              },
              {
                id: 'quizzes',
                title: 'Quiz',
                used: usage.daily_quizzes.used,
                limit: usage.daily_quizzes.limit,
              },
              {
                id: 'presentations',
                title: 'Presentation',
                used: usage.presentations.used,
                limit: usage.presentations.limit,
              },
              {
                id: 'storage',
                title: 'Storage',
                used: Number(usage.storage.used_bytes),
                limit: Number(usage.storage.limit_bytes),
                format: 'bytes' as const,
              },
            ].map((item) => (
              <UsageCard
                key={item.id}
                featureTitle={item.title}
                maxLimit={item.limit}
                used={item.used}
                format={item.format}
              />
            ))
          ) : (
            <View className="w-64 items-center justify-center py-4">
              <Text className="text-muted-foreground">Failed to load usage data</Text>
            </View>
          )}
        </ScrollView>

        {/* Filters */}
        <View className="flex-row items-center justify-between px-5">
          <View className="flex max-w-sm flex-col gap-6">
            <Tabs value={value} onValueChange={handleTabChange}>
              <TabsList
                style={{
                  backgroundColor: '#d3d3d3', // The base gray background
                  padding: 4,
                  borderRadius: 10,
                  flexDirection: 'row',
                  width: '100%',
                }}>
                <TabsTrigger
                  value="active"
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
                    value === 'active' && {
                      backgroundColor: '#ffffff',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                  ]}>
                  <Text style={{ fontWeight: value === 'active' ? '600' : '400' }}>Active</Text>
                </TabsTrigger>
                <TabsTrigger
                  value="archived"
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
                    value === 'archived' && {
                      backgroundColor: '#ffffff',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    },
                  ]}>
                  <Text style={{ fontWeight: value === 'archived' ? '600' : '400' }}>Archived</Text>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </View>
          <Pressable
            className="items-center justify-center rounded-xl px-3 py-2 active:opacity-70"
            onPress={cycleSortMode}>
            <Icon as={SORT_CONFIG[sortMode].icon} size={20} />
            <Text className="mt-0.5 text-xs text-muted-foreground">
              {SORT_CONFIG[sortMode].label}
            </Text>
          </Pressable>
        </View>

        {/* Notebook list */}
        <View className="gap-3 px-5 pt-4">
          {visibleNotebooks.length === 0 ? (
            <View className="items-center gap-1 py-16">
              <Text className="text-center text-muted-foreground">
                {value === 'archived'
                  ? 'No archived notebooks.'
                  : 'Create your first notebook now.'}
              </Text>
            </View>
          ) : (
            visibleNotebooks.map((notebook) => (
              <Swipeable
                key={notebook.id}
                ref={(ref) => {
                  if (ref) {
                    swipeableRefs.current.set(notebook.id, ref);
                  } else {
                    swipeableRefs.current.delete(notebook.id);
                  }
                }}
                onSwipeableWillOpen={() => {
                  closeCurrentRow(notebook.id);
                  openRowRef.current = notebook.id;
                }}
                renderRightActions={() => (
                  <View className="flex-row gap-2">
                    <Pressable
                      className="ml-3 w-20 items-center justify-center rounded-2xl"
                      style={{ backgroundColor: notebook.is_archived ? '#3b82f6' : '#f59e0b' }}
                      onPress={() => handleToggleArchive(notebook)}>
                      <Icon
                        as={notebook.is_archived ? ArchiveRestore : Archive}
                        color="white"
                        size={22}
                      />
                      <Text className="mt-1 text-xs font-medium text-white">
                        {notebook.is_archived ? 'Restore' : 'Archive'}
                      </Text>
                    </Pressable>
                    <Pressable
                      className="w-20 items-center justify-center rounded-2xl bg-destructive"
                      onPress={() => {
                        closeCurrentRow();
                        handleDeleteNotebook(notebook);
                      }}>
                      <Icon as={Trash2} color="white" size={22} />
                      <Text className="mt-1 text-xs font-medium text-white">Delete</Text>
                    </Pressable>
                  </View>
                )}>
                <Link href={{ pathname: '/notebooks/[id]', params: { id: notebook.id } }} asChild>
                  <Pressable
                    className="gap-1 rounded-2xl border border-border bg-card p-4 active:opacity-70"
                    onPress={(e) => {
                      if (openRowRef.current) {
                        e.preventDefault();
                        closeCurrentRow();
                        return;
                      }
                    }}>
                    <Text className="text-lg font-semibold uppercase">{notebook.title}</Text>
                    <View className="flex flex-row items-center justify-between">
                      <Text className="text-sm text-muted-foreground">
                        Last edited {formatRelativeTime(notebook.updated_at)}
                      </Text>
                      <Text className="text-sm text-muted-foreground">
                        {notebook.file_count === undefined
                          ? 'Loading...'
                          : notebook.file_count === 0
                            ? 'No Files'
                            : `${notebook.file_count} File${notebook.file_count === 1 ? '' : 's'}`}
                      </Text>
                    </View>
                  </Pressable>
                </Link>
              </Swipeable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create notebook */}
      <View className="px-5 py-4">
        <Link href="/notebooks/create" asChild>
          <Button variant="default" size="lg">
            <Text>+ Create Notebook</Text>
          </Button>
        </Link>
      </View>

      <UpgradeSheet
        visible={showUpgradeSheet}
        onClose={() => setShowUpgradeSheet(false)}
        title="Upgrade your plan on the web"
        body="Paid plans unlock more notebooks, storage, and daily quizzes. Upgrades are handled through your account on the web, outside the app."
      />
    </Screen>
  );
}
