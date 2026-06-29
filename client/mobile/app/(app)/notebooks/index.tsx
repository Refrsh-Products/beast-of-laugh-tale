import { Link } from 'expo-router';
import { Filter, Search } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { UseageCard } from '@/components/notebook/useageCard';
import { Text } from '@/components/ui/text';
import { useNotebookService } from '@/hooks/useNotebookService';
import { Notebook } from '@freshr/shared';
import { mobileSessionStore } from '@/lib/session';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const NOTEBOOK_LIMIT = 4;

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

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [value, setValue] = useState<Tab>('active');

  const loadNotebooks = useCallback(async () => {
    try {
      const data = await notebookService.list();
      setNotebooks(data);
    } catch (err) {
      console.error('Failed to load notebooks', err);
    }
  }, [notebookService]);

  // Initial fetch on mount.
  useEffect(() => {
    loadNotebooks();
  }, [loadNotebooks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadNotebooks();
    } finally {
      setRefreshing(false);
    }
  }, [loadNotebooks]);

  const activeCount = useMemo(
    () => notebooks.filter((notebook) => !notebook.is_archived).length,
    [notebooks]
  );

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
          <UseageCard featureTitle="Notebooks" maxLimit={NOTEBOOK_LIMIT} used={activeCount} />
          <UseageCard featureTitle="Quiz" maxLimit={NOTEBOOK_LIMIT} used={activeCount} />
          <UseageCard featureTitle="Presentation" maxLimit={NOTEBOOK_LIMIT} used={activeCount} />
          <UseageCard featureTitle="Storage" maxLimit={NOTEBOOK_LIMIT} used={activeCount} />
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
              <Link
                key={notebook.id}
                href={{ pathname: '/notebooks/[id]', params: { id: notebook.id } }}
                asChild>
                <Pressable className="gap-1 rounded-2xl border border-border bg-card p-4 active:opacity-70">
                  <Text className="text-lg font-semibold uppercase">{notebook.title}</Text>
                  <Text className="text-sm text-muted-foreground">
                    Last edited {formatRelativeTime(notebook.updated_at)}
                  </Text>
                </Pressable>
              </Link>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create notebook */}
      <View className="border-t border-border px-5 py-4">
        <Link href="/notebooks/create" asChild>
          <Button variant="outline" size="lg">
            <Text>+ Create Notebook</Text>
          </Button>
        </Link>
      </View>
    </Screen>
  );
}
