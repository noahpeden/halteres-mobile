import { brandColors } from "@/app/_layout";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  Clock,
  FileText,
  Home,
  Plus,
  User,
  Users,
} from "lucide-react-native";
import { useState, useContext } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  Divider,
  Menu,
  Text,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { AddClientModal } from "@/components/dashboard/AddClientModal";
import { AuthContext } from "@/components/providers/AuthProvider";
import { useClients } from "@/hooks/useClients";
import { useCreateProgram } from "@/hooks/usePrograms";
import {
  type EntityType,
  type ProgramInput,
  programSchema,
} from "@/lib/validations/program.schema";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function CreateProgramScreen() {
  const router = useRouter();
  const { gymMemberships, currentGym } = useContext(AuthContext);
  const createProgram = useCreateProgram();
  const { data: clients, isLoading: clientsLoading, refetch } = useClients();

  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");
  const [clientMenuVisible, setClientMenuVisible] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(currentGym?.id || null);
  const [selectedGymName, setSelectedGymName] = useState<string>(currentGym?.name || "");
  const [gymMenuVisible, setGymMenuVisible] = useState(false);

  // Filter gyms where user is owner or coach
  const coachGyms = gymMemberships.filter(
    (m) => m.role === "owner" || m.role === "coach"
  );

  // Group clients by type (matching web app's optgroup pattern)
  const clientsByType = clients?.reduce(
    (acc, client) => {
      const type = client.type || "CLIENT";
      if (!acc[type]) acc[type] = [];
      acc[type].push(client);
      return acc;
    },
    {} as Record<string, typeof clients>,
  );

  const clientList = clientsByType?.CLIENT || [];
  const classList = clientsByType?.CLASS || [];

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProgramInput>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: "",
      description: "",
      duration_weeks: 4,
      client_id: "",
      gym_id: currentGym?.id || null,
    },
  });

  const handleSelectGym = (gymId: string | null, gymName: string) => {
    setSelectedGymId(gymId);
    setSelectedGymName(gymName);
    setValue("gym_id", gymId);
    setGymMenuVisible(false);
  };

  const handleSelectClient = (clientId: string, clientName: string) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
    setValue("client_id", clientId);
    setClientMenuVisible(false);
  };

  const handleCreateNewEntity = () => {
    setClientMenuVisible(false);
    setShowAddClientModal(true);
  };

  const handleEntityCreated = (entity: {
    id: string;
    name: string;
    type: EntityType;
  }) => {
    // Refetch clients list and auto-select the newly created entity
    refetch().then(() => {
      handleSelectClient(entity.id, entity.name);
    });
  };

  const onSubmit = async (data: ProgramInput) => {
    try {
      setIsLoading(true);
      console.log("[CreateProgram] Submitting form data:", data);
      const result = await createProgram.mutateAsync(data);
      console.log("[CreateProgram] Result:", result);
      Alert.alert("Success", "Program created successfully", [
        {
          text: "OK",
          onPress: () => {
            // Navigate to the program detail page
            if (result && typeof result === "object" && "id" in result) {
              router.replace(`/(app)/programs/${result.id}`);
            }
          },
        },
      ]);
    } catch (error) {
      console.error("[CreateProgram] Error caught:", error);
      console.error("[CreateProgram] Error type:", typeof error);
      console.error(
        "[CreateProgram] Error details:",
        JSON.stringify(error, null, 2),
      );

      let errorMessage = "Failed to create program";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        // Handle Supabase error format
        errorMessage = JSON.stringify(error);
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Animation values
  const submitScale = useSharedValue(1);
  const cancelScale = useSharedValue(1);
  const selectScale = useSharedValue(1);
  const gymSelectScale = useSharedValue(1);

  const submitAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  const cancelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cancelScale.value }],
  }));

  const selectAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectScale.value }],
  }));

  const gymSelectAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: gymSelectScale.value }],
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "#f8f9fa" }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        {/* Modern Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color={brandColors.practicalGray.DEFAULT} />
          </Pressable>
          <Text variant="titleMedium" style={styles.headerTitle}>
            Create Program
          </Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.duration(300).delay(100)}
            style={styles.heroSection}
          >
            <View style={styles.heroIconContainer}>
              <FileText
                size={32}
                color={brandColors.smartBlue.DEFAULT}
                strokeWidth={1.5}
              />
            </View>
            <Text variant="headlineSmall" style={styles.heroTitle}>
              New Training Program
            </Text>
            <Text variant="bodyMedium" style={styles.heroSubtitle}>
              Create a customized program for your client or class
            </Text>
          </Animated.View>

          {/* Client Selector Card */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(200)}
            style={styles.formCard}
          >
            <View style={styles.formCardHeader}>
              <View style={styles.formCardIconContainer}>
                <Users
                  size={18}
                  color={brandColors.thrivingGreen.DEFAULT}
                  strokeWidth={2}
                />
              </View>
              <Text variant="titleSmall" style={styles.formCardTitle}>
                Select Client or Class
              </Text>
            </View>

            <Menu
              visible={clientMenuVisible}
              onDismiss={() => setClientMenuVisible(false)}
              contentStyle={styles.menuContent}
              anchor={
                <AnimatedPressable
                  onPress={() => setClientMenuVisible(true)}
                  onPressIn={() => {
                    selectScale.value = withSpring(0.98, {
                      damping: 15,
                      stiffness: 300,
                    });
                  }}
                  onPressOut={() => {
                    selectScale.value = withSpring(1, {
                      damping: 15,
                      stiffness: 150,
                    });
                  }}
                  style={[
                    styles.selectButton,
                    selectedClientId && styles.selectButtonSelected,
                    !selectedClientId && styles.selectButtonError,
                    selectAnimatedStyle,
                  ]}
                >
                  <View style={styles.selectButtonLeft}>
                    {selectedClientId ? (
                      <View style={styles.selectedIndicator}>
                        <Check size={14} color="#fff" strokeWidth={3} />
                      </View>
                    ) : (
                      <User size={20} color={brandColors.practicalGray.light} />
                    )}
                    <Text
                      style={[
                        styles.selectButtonText,
                        selectedClientId && styles.selectButtonTextSelected,
                      ]}
                    >
                      {selectedClientName || "Choose a client or class..."}
                    </Text>
                  </View>
                  <ChevronDown
                    size={20}
                    color={
                      selectedClientId
                        ? brandColors.thrivingGreen.DEFAULT
                        : brandColors.practicalGray.light
                    }
                  />
                </AnimatedPressable>
              }
            >
              {clientsLoading ? (
                <Menu.Item title="Loading..." disabled />
              ) : (
                <>
                  {/* Create New Option */}
                  <Menu.Item
                    leadingIcon={() => (
                      <Plus size={18} color={brandColors.smartBlue.DEFAULT} />
                    )}
                    onPress={handleCreateNewEntity}
                    title="Create New"
                    titleStyle={styles.menuCreateNew}
                  />
                  <Divider style={styles.menuDivider} />

                  {/* Clients Group */}
                  {clientList.length > 0 && (
                    <>
                      <View style={styles.menuGroupHeader}>
                        <User
                          size={14}
                          color={brandColors.practicalGray.light}
                        />
                        <Text style={styles.menuGroupTitle}>Clients</Text>
                      </View>
                      {clientList.map((client) => (
                        <Menu.Item
                          key={client.id}
                          onPress={() =>
                            handleSelectClient(client.id, client.name)
                          }
                          title={client.name}
                          titleStyle={styles.menuItemTitle}
                          leadingIcon={
                            selectedClientId === client.id
                              ? () => (
                                  <Check
                                    size={16}
                                    color={brandColors.thrivingGreen.DEFAULT}
                                  />
                                )
                              : undefined
                          }
                        />
                      ))}
                    </>
                  )}

                  {/* Classes Group */}
                  {classList.length > 0 && (
                    <>
                      <Divider style={styles.menuDivider} />
                      <View style={styles.menuGroupHeader}>
                        <Building2
                          size={14}
                          color={brandColors.practicalGray.light}
                        />
                        <Text style={styles.menuGroupTitle}>Classes</Text>
                      </View>
                      {classList.map((classEntity) => (
                        <Menu.Item
                          key={classEntity.id}
                          onPress={() =>
                            handleSelectClient(classEntity.id, classEntity.name)
                          }
                          title={classEntity.name}
                          titleStyle={styles.menuItemTitle}
                          leadingIcon={
                            selectedClientId === classEntity.id
                              ? () => (
                                  <Check
                                    size={16}
                                    color={brandColors.thrivingGreen.DEFAULT}
                                  />
                                )
                              : undefined
                          }
                        />
                      ))}
                    </>
                  )}

                  {/* Empty State */}
                  {clientList.length === 0 && classList.length === 0 && (
                    <Menu.Item
                      title="No clients yet. Create one!"
                      disabled
                      titleStyle={styles.menuEmptyState}
                    />
                  )}
                </>
              )}
            </Menu>

            {!selectedClientId && (
              <Text style={styles.fieldHint}>
                You need to select a client or class first
              </Text>
            )}
          </Animated.View>

          {/* Program Details Card */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(300)}
            style={[
              styles.formCard,
              !selectedClientId && styles.formCardDisabled,
            ]}
            pointerEvents={selectedClientId ? "auto" : "none"}
          >
            <View style={styles.formCardHeader}>
              <View
                style={[
                  styles.formCardIconContainer,
                  { backgroundColor: brandColors.smartBlue.container },
                ]}
              >
                <FileText
                  size={18}
                  color={brandColors.smartBlue.DEFAULT}
                  strokeWidth={2}
                />
              </View>
              <Text variant="titleSmall" style={styles.formCardTitle}>
                Program Details
              </Text>
            </View>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Program Name"
                    placeholder="e.g., 12-Week Strength Builder"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.name}
                    autoCapitalize="words"
                    mode="outlined"
                    style={styles.input}
                    outlineColor={brandColors.practicalGray.lighter}
                    activeOutlineColor={brandColors.smartBlue.DEFAULT}
                    outlineStyle={styles.inputOutline}
                  />
                  {errors.name && (
                    <Text style={styles.errorText}>{errors.name?.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Description (Optional)"
                    placeholder="Describe the program goals and focus..."
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.description}
                    multiline
                    numberOfLines={4}
                    mode="outlined"
                    style={[styles.input, styles.textArea]}
                    outlineColor={brandColors.practicalGray.lighter}
                    activeOutlineColor={brandColors.smartBlue.DEFAULT}
                    outlineStyle={styles.inputOutline}
                  />
                  {errors.description && (
                    <Text style={styles.errorText}>
                      {errors.description?.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </Animated.View>

          {/* Duration Card */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(400)}
            style={[
              styles.formCard,
              !selectedClientId && styles.formCardDisabled,
            ]}
            pointerEvents={selectedClientId ? "auto" : "none"}
          >
            <View style={styles.formCardHeader}>
              <View
                style={[
                  styles.formCardIconContainer,
                  { backgroundColor: brandColors.helpfulOrange.container },
                ]}
              >
                <Clock
                  size={18}
                  color={brandColors.helpfulOrange.DEFAULT}
                  strokeWidth={2}
                />
              </View>
              <Text variant="titleSmall" style={styles.formCardTitle}>
                Duration
              </Text>
            </View>

            <Controller
              control={control}
              name="duration_weeks"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Weeks"
                    placeholder="4"
                    value={value?.toString()}
                    onChangeText={(text) => {
                      const num = Number.parseInt(text, 10);
                      if (!Number.isNaN(num)) {
                        onChange(num);
                      } else if (text === "") {
                        onChange(0);
                      }
                    }}
                    onBlur={onBlur}
                    error={!!errors.duration_weeks}
                    keyboardType="number-pad"
                    mode="outlined"
                    style={styles.input}
                    outlineColor={brandColors.practicalGray.lighter}
                    activeOutlineColor={brandColors.smartBlue.DEFAULT}
                    outlineStyle={styles.inputOutline}
                    right={<TextInput.Affix text="weeks" />}
                  />
                  {errors.duration_weeks ? (
                    <Text style={styles.errorText}>
                      {errors.duration_weeks?.message}
                    </Text>
                  ) : (
                    <Text style={styles.fieldHint}>Maximum 8 weeks</Text>
                  )}
                </View>
              )}
            />
          </Animated.View>

          {/* Gym Selector Card (Optional) */}
          {coachGyms.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(450)}
              style={[
                styles.formCard,
                !selectedClientId && styles.formCardDisabled,
              ]}
              pointerEvents={selectedClientId ? "auto" : "none"}
            >
              <View style={styles.formCardHeader}>
                <View
                  style={[
                    styles.formCardIconContainer,
                    { backgroundColor: "#e8f4fd" },
                  ]}
                >
                  <Home
                    size={18}
                    color={brandColors.practicalGray.DEFAULT}
                    strokeWidth={2}
                  />
                </View>
                <Text variant="titleSmall" style={styles.formCardTitle}>
                  Assign to Gym (Optional)
                </Text>
              </View>

              <Menu
                visible={gymMenuVisible}
                onDismiss={() => setGymMenuVisible(false)}
                contentStyle={styles.menuContent}
                anchor={
                  <AnimatedPressable
                    onPress={() => setGymMenuVisible(true)}
                    onPressIn={() => {
                      gymSelectScale.value = withSpring(0.98, {
                        damping: 15,
                        stiffness: 300,
                      });
                    }}
                    onPressOut={() => {
                      gymSelectScale.value = withSpring(1, {
                        damping: 15,
                        stiffness: 150,
                      });
                    }}
                    style={[
                      styles.selectButton,
                      selectedGymId && styles.selectButtonSelected,
                      gymSelectAnimatedStyle,
                    ]}
                  >
                    <View style={styles.selectButtonLeft}>
                      {selectedGymId ? (
                        <View style={styles.selectedIndicator}>
                          <Check size={14} color="#fff" strokeWidth={3} />
                        </View>
                      ) : (
                        <Home size={20} color={brandColors.practicalGray.light} />
                      )}
                      <Text
                        style={[
                          styles.selectButtonText,
                          selectedGymId && styles.selectButtonTextSelected,
                        ]}
                      >
                        {selectedGymName || "No gym assigned"}
                      </Text>
                    </View>
                    <ChevronDown
                      size={20}
                      color={
                        selectedGymId
                          ? brandColors.thrivingGreen.DEFAULT
                          : brandColors.practicalGray.light
                      }
                    />
                  </AnimatedPressable>
                }
              >
                {/* No Gym Option */}
                <Menu.Item
                  onPress={() => handleSelectGym(null, "")}
                  title="No gym assigned"
                  titleStyle={styles.menuItemTitle}
                  leadingIcon={
                    !selectedGymId
                      ? () => (
                          <Check
                            size={16}
                            color={brandColors.thrivingGreen.DEFAULT}
                          />
                        )
                      : undefined
                  }
                />
                <Divider style={styles.menuDivider} />

                {/* Gym Options */}
                <View style={styles.menuGroupHeader}>
                  <Home size={14} color={brandColors.practicalGray.light} />
                  <Text style={styles.menuGroupTitle}>Your Gyms</Text>
                </View>
                {coachGyms.map((membership) => (
                  <Menu.Item
                    key={membership.gym.id}
                    onPress={() =>
                      handleSelectGym(membership.gym.id, membership.gym.name)
                    }
                    title={membership.gym.name}
                    titleStyle={styles.menuItemTitle}
                    leadingIcon={
                      selectedGymId === membership.gym.id
                        ? () => (
                            <Check
                              size={16}
                              color={brandColors.thrivingGreen.DEFAULT}
                            />
                          )
                        : undefined
                    }
                  />
                ))}
              </Menu>

              <Text style={styles.fieldHint}>
                Assign this program to a gym you coach
              </Text>
            </Animated.View>
          )}

          {/* Action Buttons */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(500)}
            style={styles.buttonContainer}
          >
            <AnimatedPressable
              onPress={handleSubmit(onSubmit)}
              onPressIn={() => {
                submitScale.value = withSpring(0.98, {
                  damping: 15,
                  stiffness: 300,
                });
              }}
              onPressOut={() => {
                submitScale.value = withSpring(1, {
                  damping: 15,
                  stiffness: 150,
                });
              }}
              disabled={isLoading || !selectedClientId}
              style={[
                styles.primaryButton,
                (!selectedClientId || isLoading) &&
                  styles.primaryButtonDisabled,
                submitAnimatedStyle,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isLoading ? "Creating..." : "Create Program"}
              </Text>
            </AnimatedPressable>

            <AnimatedPressable
              onPress={() => router.back()}
              onPressIn={() => {
                cancelScale.value = withSpring(0.98, {
                  damping: 15,
                  stiffness: 300,
                });
              }}
              onPressOut={() => {
                cancelScale.value = withSpring(1, {
                  damping: 15,
                  stiffness: 150,
                });
              }}
              disabled={isLoading}
              style={[styles.secondaryButton, cancelAnimatedStyle]}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </AnimatedPressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Add Client/Class Modal */}
      <AddClientModal
        visible={showAddClientModal}
        onClose={() => setShowAddClientModal(false)}
        onSuccess={handleEntityCreated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontWeight: "700",
    color: "#121212",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 8,
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: brandColors.smartBlue.container,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontWeight: "700",
    color: "#121212",
    marginBottom: 8,
  },
  heroSubtitle: {
    color: brandColors.practicalGray.DEFAULT,
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  formCardDisabled: {
    opacity: 0.5,
  },
  formCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  formCardIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: brandColors.thrivingGreen.container,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  formCardTitle: {
    fontWeight: "700",
    color: "#121212",
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#ffffff",
  },
  inputOutline: {
    borderRadius: 12,
  },
  textArea: {
    minHeight: 100,
  },
  selectButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderRadius: 12,
    borderColor: brandColors.practicalGray.lighter,
    backgroundColor: "#fafafa",
  },
  selectButtonSelected: {
    borderColor: brandColors.thrivingGreen.DEFAULT,
    backgroundColor: brandColors.thrivingGreen.container,
  },
  selectButtonError: {
    borderColor: brandColors.helpfulOrange.light,
    backgroundColor: brandColors.helpfulOrange.container,
  },
  selectButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: brandColors.thrivingGreen.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
  },
  selectButtonText: {
    fontSize: 15,
    color: brandColors.practicalGray.light,
  },
  selectButtonTextSelected: {
    color: "#121212",
    fontWeight: "600",
  },
  menuContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginTop: 4,
  },
  menuGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f9fa",
  },
  menuGroupTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: brandColors.practicalGray.light,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  menuItemTitle: {
    fontSize: 15,
  },
  menuCreateNew: {
    color: brandColors.smartBlue.DEFAULT,
    fontWeight: "600",
  },
  menuDivider: {
    backgroundColor: "#f0f0f0",
  },
  menuEmptyState: {
    color: brandColors.practicalGray.light,
    fontStyle: "italic",
  },
  fieldHint: {
    fontSize: 12,
    color: brandColors.practicalGray.light,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#dc2626",
    marginTop: 6,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: brandColors.smartBlue.DEFAULT,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: brandColors.practicalGray.lighter,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: brandColors.practicalGray.lighter,
  },
  secondaryButtonText: {
    color: brandColors.practicalGray.DEFAULT,
    fontSize: 16,
    fontWeight: "600",
  },
});
