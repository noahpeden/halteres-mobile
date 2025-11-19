import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";
import {
  Button,
  HelperText,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useCreateClient } from "@/hooks/useClients";
import {
  type ClientInput,
  clientSchema,
} from "@/lib/validations/program.schema";

interface AddClientModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AddClientModal({ visible, onClose }: AddClientModalProps) {
  const theme = useTheme();
  const createClient = useCreateClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      email: "",
      notes: "",
    },
  });

  const onSubmit = async (data: ClientInput) => {
    try {
      setIsLoading(true);
      await createClient.mutateAsync(data);
      Alert.alert("Success", "Client created successfully");
      reset();
      onClose();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create client");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleClose}
        contentContainerStyle={[
          styles.modalContainer,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text variant="headlineSmall" style={styles.title}>
          Add New Client
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Client Name"
                  placeholder="John Doe"
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
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Email"
                  placeholder="john@example.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  mode="outlined"
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.email}>
                  {errors.email?.message}
                </HelperText>
              </View>
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Notes (Optional)"
                  placeholder="Any notes about this client..."
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={!!errors.notes}
                  multiline
                  numberOfLines={3}
                  mode="outlined"
                  style={styles.input}
                />
                <HelperText type="error" visible={!!errors.notes}>
                  {errors.notes?.message}
                </HelperText>
              </View>
            )}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleClose}
              disabled={isLoading}
              style={styles.button}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
              style={styles.button}
            >
              Create Client
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    padding: 24,
    margin: 20,
    borderRadius: 12,
  },
  title: {
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  form: {
    gap: 4,
  },
  inputContainer: {
    marginBottom: 4,
  },
  input: {
    backgroundColor: "transparent",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
});
