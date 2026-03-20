import React, { useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  ListRenderItemInfo,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RootStackParamList, TravelEntry } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useEntries } from '../context/EntriesContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { theme, isDark, toggleTheme } = useTheme();
  const { entries, removeEntry } = useEntries();

  // Set header right button for dark mode toggle
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => [
            styles.headerBtn,
            pressed && { opacity: 0.6 },
          ]}
          accessibilityLabel="Toggle dark/light mode"
          accessibilityRole="button"
        >
          <Text style={[styles.headerBtnText, { color: theme.headerText }]}>
            {isDark ? '☀️' : '🌙'}
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, isDark, toggleTheme, theme.headerText]);

  const handleRemove = useCallback(
    (id: string) => {
      Alert.alert(
        'Remove Entry',
        'Are you sure you want to delete this travel memory?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => removeEntry(id),
          },
        ]
      );
    },
    [removeEntry]
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TravelEntry>) => (
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.border,
            shadowColor: theme.shadow,
          },
        ]}
      >
        <Image
          source={{ uri: item.imageUri }}
          style={styles.cardImage}
          resizeMode="cover"
          accessibilityLabel={`Travel photo from ${item.address}`}
        />
        <View style={styles.cardBody}>
          <View style={styles.cardInfo}>
            <Text style={[styles.addressText, { color: theme.text }]} numberOfLines={2}>
              📍 {item.address}
            </Text>
            <Text style={[styles.dateText, { color: theme.textMuted }]}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
          <Pressable
            onPress={() => handleRemove(item.id)}
            style={({ pressed }) => [
              styles.removeBtn,
              { backgroundColor: theme.danger, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityLabel={`Remove entry from ${item.address}`}
            accessibilityRole="button"
          >
            <Text style={[styles.removeBtnText, { color: theme.dangerText }]}>
              🗑
            </Text>
          </Pressable>
        </View>
      </View>
    ),
    [theme, handleRemove]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { color: theme.emptyIcon }]}>🗺️</Text>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        No Entries Yet
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
        Tap the button below to capture{'\n'}your first travel memory!
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['bottom']}
    >
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          entries.length === 0 ? styles.emptyList : styles.list
        }
        showsVerticalScrollIndicator={false}
      />

      <View style={[styles.fabContainer, { borderTopColor: theme.border }]}>
        <Pressable
          onPress={() => navigation.navigate('AddEntry')}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityLabel="Add new travel entry"
          accessibilityRole="button"
        >
          <Text style={[styles.fabText, { color: theme.primaryText }]}>
            + Add Entry
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 4,
  },
  cardImage: {
    width: '100%',
    height: 200,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  cardInfo: {
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '400',
  },
  removeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  fab: {
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerBtn: {
    padding: 8,
    marginRight: 4,
  },
  headerBtnText: {
    fontSize: 22,
  },
});