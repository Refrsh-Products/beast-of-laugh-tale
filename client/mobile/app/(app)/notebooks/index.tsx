import { Link, useFocusEffect } from 'expo-router';
import { Filter, Search, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, View, ActivityIndicator, Alert } from 'react-native';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { UsageCard } from '@/components/notebook/usageCard';
import { Text } from '@/components/ui/text';
import { useNotebookService } from '@/hooks/useNotebookService';
import { useAccountService } from '@/hooks/useAccountService';
import { Notebook, AccountUsage } from '@freshr/shared';
import { mobileSessionStore } from '@/lib/session';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Tab = 'active' | 'archived';

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
      const [notebooksData, usageData] = await Promise.all([
        notebookService.list(),
        accountService.getAccountUsage(),
      ]);
      setNotebooks(notebooksData);
      setUsage(usageData);
      getNotebookFiles(notebooksData);
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

  const visibleNotebooks = useMemo(
    () =>
      notebooks.filter((notebook) =>
        value === 'archived' ? notebook.is_archived : !notebook.is_archived
      ),
    [notebooks, value]
  );

  const handleTabChange = (nextValue: string) => {
    setValue(nextValue as Tab);
  };

  const handleDeleteNotebook = (notebook: Notebook) => {
    Alert.alert(
      'Delete Notebook',
      `Are you sure you want to delete "${notebook.title}"?`,
      [
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
      ]
    );
  };

  return (
    <Screen className="bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 pb-4">
        <Text className="text-3xl font-bold tracking-widest">FRESHR</Text>
        <View className="flex-row items-center gap-3">
          <Pressable className="size-10 items-center justify-center rounded-xl bg-muted active:opacity-70">
            <Icon as={Search} size={20} />
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
                  <Text style={{ fontWeight: value === 'active' ? '600' : '400' }}>Files</Text>
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
          <Pressable className="size-10 items-center justify-center rounded-xl active:opacity-70">
            <Icon as={Filter} size={20} />
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
                  <Pressable
                    className="ml-3 w-20 items-center justify-center rounded-2xl bg-destructive"
                    onPress={() => {
                      closeCurrentRow();
                      handleDeleteNotebook(notebook);
                    }}>
                    <Icon as={Trash2} color="white" size={24} />
                  </Pressable>
                )}>
                <Link
                  href={{ pathname: '/notebooks/[id]', params: { id: notebook.id } }}
                  asChild>
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
    </Screen>
  );
}
