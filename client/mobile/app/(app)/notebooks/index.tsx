import { Link } from 'expo-router';
import { View, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useCallback, useEffect, useState } from 'react';
import { useNotebookService } from '@/hooks/useNotebookService';
import { Notebook } from '@freshr/shared';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotebookListScreen() {
  const notebookService = useNotebookService();

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [refreshing, setRefreshing] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9Bd35A', '#689F38']}
            tintColor="#689F38"
          />
        }>
        <View className="flex-1 items-center justify-center gap-4 p-6">
          <Text className="text-2xl font-bold">Notebooks</Text>

          {notebooks.length === 0 ? (
            <Text className="text-muted-foreground">
              No notebooks yet. Pull down to refresh.
            </Text>
          ) : (
            notebooks.map((notebook) => (
              <Link key={notebook.id} href={`/notebooks/${notebook.id}`} asChild>
                <Button>
                  <Text>{notebook.title}</Text>
                </Button>
              </Link>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
