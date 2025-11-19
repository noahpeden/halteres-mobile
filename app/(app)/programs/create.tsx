import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown } from "lucide-react-native";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  HelperText,
  Menu,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useClients } from "@/hooks/useClients";
import { useCreateProgram } from "@/hooks/usePrograms";
import {
  type ProgramInput,
  programSchema,
} from "@/lib/validations/program.schema";

export default function CreateProgramScreen() {
  const router = useRouter();
  const theme = useTheme();
  const createProgram = useCreateProgram();
  const { data: clients, isLoading: clientsLoading } = useClients();
  
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");
  const [clientMenuVisible, setClientMenuVisible] = useState(false);

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
    },
  });

  const handleSelectClient = (clientId: string, clientName: string) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
    setValue("client_id", clientId);
    setClientMenuVisible(false);
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
      console.error("[CreateProgram] Error details:", JSON.stringify(error, null, 2));
      
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

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View
          style={[styles.header, { borderColor: theme.colors.outlineVariant }]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text variant="headlineSmall" style={styles.headerTitle}>
            Create Program
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <View>
              <Text
                variant="headlineMedium"
                style={[styles.title, { color: theme.colors.onSurface }]}
              >
                New Training Program
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                Create a customized training program for your client
              </Text>
            </View>

            {/* Client Selector - REQUIRED FIRST */}
            <View style={styles.inputContainer}>
              <Text variant="labelLarge" style={styles.label}>
                Select Client/Class *
              </Text>
              <Menu
                visible={clientMenuVisible}
                onDismiss={() => setClientMenuVisible(false)}
                anchor={
                  <TouchableOpacity
                    onPress={() => setClientMenuVisible(true)}
                    style={[
                      styles.selectButton,
                      {
                        borderColor: selectedClientId
                          ? theme.colors.outline
                          : theme.colors.error,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectButtonText,
                        {
                          color: selectedClientName
                            ? theme.colors.onSurface
                            : theme.colors.onSurfaceVariant,
                        },
                      ]}
                    >
                      {selectedClientName || "Select a client or class"}
                    </Text>
                    <ChevronDown size={20} color={theme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                }
              >
                {clientsLoading ? (
                  <Menu.Item title="Loading..." disabled />
                ) : clients && clients.length > 0 ? (
                  clients.map((client) => (
                    <Menu.Item
                      key={client.id}
                      onPress={() => handleSelectClient(client.id, client.name)}
                      title={client.name}
                    />
                  ))
                ) : (
                  <Menu.Item title="No clients found" disabled />
                )}
              </Menu>
              {!selectedClientId && (
                <HelperText type="error" visible={true}>
                  Please select a client or class
                </HelperText>
              )}
            </View>

            {/* Rest of form - disabled until client selected */}
            <View
              style={{
                opacity: selectedClientId ? 1 : 0.5,
              }}
              pointerEvents={selectedClientId ? "auto" : "none"}
            >

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
                  />
                  <HelperText type="error" visible={!!errors.name}>
                    {errors.name?.message}
                  </HelperText>
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
                  />
                  <HelperText type="error" visible={!!errors.description}>
                    {errors.description?.message}
                  </HelperText>
                </View>
              )}
            />

            <Controller
              control={control}
              name="duration_weeks"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Duration (Weeks)"
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
                  />
                  <HelperText type="error" visible={!!errors.duration_weeks}>
                    {errors.duration_weeks?.message}
                  </HelperText>
                  {!errors.duration_weeks && (
                    <HelperText type="info" visible={true}>
                      Maximum 8 weeks per program
                    </HelperText>
                  )}
                </View>
              )}
            />

            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Create Program
              </Button>
              <Button
                mode="outlined"
                onPress={() => router.back()}
                disabled={isLoading}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Cancel
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  content: {
    paddingVertical: 24,
    gap: 16,
  },
  title: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: "transparent",
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
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "transparent",
  },
  selectButtonText: {
    fontSize: 16,
  },
  buttonContainer: {
    gap: 12,
    marginTop: 16,
    marginBottom: 32,
  },
  button: {
    width: "100%",
  },
  buttonContent: {
    paddingVertical: 6,
  },
});
