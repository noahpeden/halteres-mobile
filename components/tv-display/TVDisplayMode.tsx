import { ChevronLeft, ChevronRight, X } from "lucide-react-native";
import { useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { WorkoutSection } from "@/lib/utils/workoutParser";

type TVDisplayModeProps = {
  isOpen: boolean;
  currentSection: WorkoutSection | null;
  sections: WorkoutSection[];
  currentSectionId: number;
  workoutTitle: string;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onGoToSection: (id: number) => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Fullscreen TV display overlay for workout sections
 * Optimized for casting to TV screens
 */
export function TVDisplayMode({
  isOpen,
  currentSection,
  sections,
  currentSectionId,
  workoutTitle,
  onClose,
  onNext,
  onPrevious,
  onGoToSection,
}: TVDisplayModeProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Fade in animation
  useEffect(() => {
    if (isOpen) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isOpen, fadeAnim]);

  // Reset scroll position when section changes
  useEffect(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
  }, [currentSectionId]);

  if (!isOpen || !currentSection) return null;

  return (
    <Modal
      visible={isOpen}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1}>
              {workoutTitle}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={28} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Main Content Area */}
        <View style={styles.contentArea}>
          {/* Previous Button */}
          {sections.length > 1 && (
            <TouchableOpacity
              onPress={onPrevious}
              style={[styles.navButton, styles.navButtonLeft]}
            >
              <ChevronLeft size={32} color="#ffffff" />
            </TouchableOpacity>
          )}

          {/* Section Content */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Section Title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{currentSection.title}</Text>
              <View style={styles.titleUnderline} />
            </View>

            {/* Section Content - Large TV-readable text */}
            <Text style={styles.sectionContent}>{currentSection.content}</Text>
          </ScrollView>

          {/* Next Button */}
          {sections.length > 1 && (
            <TouchableOpacity
              onPress={onNext}
              style={[styles.navButton, styles.navButtonRight]}
            >
              <ChevronRight size={32} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Navigation Dots */}
        {sections.length > 1 && (
          <View style={styles.dotsContainer}>
            {sections.map((section, index) => (
              <TouchableOpacity
                key={section.id}
                onPress={() => onGoToSection(index)}
                style={[
                  styles.dot,
                  index === currentSectionId && styles.dotActive,
                ]}
              />
            ))}
          </View>
        )}

        {/* Hint Text */}
        <Text style={styles.hintText}>Swipe or tap arrows to navigate</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  headerTitleContainer: {
    flex: 1,
    marginRight: 16,
  },
  headerTitle: {
    fontWeight: "600",
    color: "#475569",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
  },
  contentArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  navButtonLeft: {
    marginLeft: 12,
  },
  navButtonRight: {
    marginRight: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  sectionHeader: {
    alignItems: "center",
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#4f46e5",
    textAlign: "center",
    marginBottom: 12,
  },
  titleUnderline: {
    width: 80,
    height: 4,
    backgroundColor: "#4f46e5",
    borderRadius: 2,
  },
  sectionContent: {
    fontSize: 24,
    lineHeight: 36,
    color: "#1e293b",
    textAlign: "center",
    fontWeight: "500",
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#cbd5e1",
  },
  dotActive: {
    backgroundColor: "#4f46e5",
    transform: [{ scale: 1.2 }],
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  hintText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    paddingBottom: 16,
  },
});
