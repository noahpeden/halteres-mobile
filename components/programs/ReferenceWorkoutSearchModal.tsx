import { Search, X } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Checkbox,
  Chip,
  Divider,
  IconButton,
  Modal,
  Portal,
  Searchbar,
  Text,
  useTheme,
} from "react-native-paper";
import { type SearchWorkout, useWorkoutSearch } from "@/hooks/useWorkoutSearch";

type ReferenceWorkoutSearchModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (workouts: SearchWorkout[]) => void;
  initialSelectedWorkouts?: SearchWorkout[];
};

export function ReferenceWorkoutSearchModal({
  visible,
  onDismiss,
  onSelect,
  initialSelectedWorkouts = [],
}: ReferenceWorkoutSearchModalProps) {
  const theme = useTheme();
  const { results, loading, error, search, clearResults } = useWorkoutSearch();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkouts, setSelectedWorkouts] = useState<SearchWorkout[]>(
    initialSelectedWorkouts,
  );
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedWorkouts(initialSelectedWorkouts);
      setSearchQuery("");
      setHasSearched(false);
      clearResults();
    }
  }, [visible, initialSelectedWorkouts, clearResults]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    await search({ searchQuery });
  }, [searchQuery, search]);

  const handleToggleWorkout = useCallback((workout: SearchWorkout) => {
    setSelectedWorkouts((prev) => {
      const isSelected = prev.some((w) => w.id === workout.id);
      if (isSelected) {
        return prev.filter((w) => w.id !== workout.id);
      }
      return [...prev, workout];
    });
  }, []);

  const handleConfirm = useCallback(() => {
    onSelect(selectedWorkouts);
    onDismiss();
  }, [selectedWorkouts, onSelect, onDismiss]);

  const handleDismiss = useCallback(() => {
    clearResults();
    onDismiss();
  }, [clearResults, onDismiss]);

  const getBodyPreview = (body: string) => {
    if (!body) return "";
    const cleanBody = body
      .replace(/[#*_`]/g, "")
      .replace(/\n+/g, " ")
      .trim();
    return cleanBody.length > 150 ? `${cleanBody.slice(0, 150)}...` : cleanBody;
  };

  const renderWorkoutItem = ({ item }: { item: SearchWorkout }) => {
    const isSelected = selectedWorkouts.some((w) => w.id === item.id);

    return (
      <View
        style={[
          styles.workoutItem,
          isSelected && { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <Checkbox
          status={isSelected ? "checked" : "unchecked"}
          onPress={() => handleToggleWorkout(item)}
        />
        <View style={styles.workoutContent}>
          <Text
            variant="titleSmall"
            numberOfLines={1}
            style={styles.workoutTitle}
          >
            {item.title}
          </Text>
          {item.body && (
            <Text
              variant="bodySmall"
              numberOfLines={2}
              style={styles.workoutPreview}
            >
              {getBodyPreview(item.body)}
            </Text>
          )}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {item.tags.slice(0, 3).map((tag) => (
                <Chip key={tag} compact style={styles.tag}>
                  {tag}
                </Chip>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={[
          styles.modal,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Search size={24} color={theme.colors.primary} />
            <Text variant="titleLarge" style={styles.title}>
              Search Workouts
            </Text>
          </View>
          <IconButton
            icon={() => <X size={20} color={theme.colors.onSurface} />}
            onPress={handleDismiss}
          />
        </View>

        <Text variant="bodySmall" style={styles.subtitle}>
          Search for reference workouts to inspire your program
        </Text>

        {/* Search bar */}
        <Searchbar
          placeholder="Search (e.g., EMOM, strength, Fran)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          style={styles.searchbar}
        />

        <Button
          mode="contained"
          onPress={handleSearch}
          loading={loading}
          disabled={loading || !searchQuery.trim()}
          style={styles.searchButton}
        >
          Search
        </Button>

        <Divider style={styles.divider} />

        {/* Selected count */}
        {selectedWorkouts.length > 0 && (
          <View style={styles.selectedBanner}>
            <Text variant="labelLarge">
              {selectedWorkouts.length} workout
              {selectedWorkouts.length !== 1 ? "s" : ""} selected
            </Text>
            <Button compact onPress={() => setSelectedWorkouts([])}>
              Clear
            </Button>
          </View>
        )}

        {/* Results */}
        <View style={styles.resultsContainer}>
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
              <Text variant="bodyMedium" style={styles.loadingText}>
                Searching...
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text variant="bodyMedium" style={{ color: theme.colors.error }}>
                {error}
              </Text>
            </View>
          )}

          {!loading && !error && hasSearched && results.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text variant="bodyMedium" style={styles.emptyText}>
                No workouts found. Try a different search term.
              </Text>
            </View>
          )}

          {!loading && results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(item) => item.id}
              renderItem={renderWorkoutItem}
              ItemSeparatorComponent={() => <Divider />}
              style={styles.list}
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={handleDismiss}
            style={styles.actionButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            disabled={selectedWorkouts.length === 0}
            style={styles.actionButton}
          >
            Add{" "}
            {selectedWorkouts.length > 0 ? `(${selectedWorkouts.length})` : ""}
          </Button>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontWeight: "bold",
  },
  subtitle: {
    opacity: 0.7,
    marginBottom: 16,
  },
  searchbar: {
    marginBottom: 12,
  },
  searchButton: {
    marginBottom: 12,
  },
  divider: {
    marginVertical: 12,
  },
  selectedBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  resultsContainer: {
    flex: 1,
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    opacity: 0.7,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  emptyText: {
    opacity: 0.7,
    textAlign: "center",
  },
  list: {
    maxHeight: 300,
  },
  workoutItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 8,
    borderRadius: 8,
  },
  workoutContent: {
    flex: 1,
    marginLeft: 8,
  },
  workoutTitle: {
    fontWeight: "600",
    marginBottom: 4,
  },
  workoutPreview: {
    opacity: 0.7,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  tag: {
    height: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
  },
});
