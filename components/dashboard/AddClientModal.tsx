import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, View } from "react-native";
import {
  Button,
  HelperText,
  Modal,
  Portal,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useCreateClient } from "@/hooks/useClients";
import {
  type ClientInput,
  clientSchema,
  type EntityType,
} from "@/lib/validations/program.schema";

interface AddClientModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (entity: { id: string; name: string; type: EntityType }) => void;
}

export function AddClientModal({
  visible,
  onClose,
  onSuccess,
}: AddClientModalProps) {
  const theme = useTheme();
  const createClient = useCreateClient();
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: "",
      type: "CLIENT",
      notes: "",
    },
  });

  const entityType = watch("type");

  const onSubmit = async (data: ClientInput) => {
    try {
      setIsLoading(true);
      const result = await createClient.mutateAsync(data);
      const typeLabel = data.type === "CLASS" ? "Class" : "Client";
      Alert.alert("Success", `${typeLabel} created successfully`);
      reset();
      onClose();
      // Call onSuccess callback if provided (for inline creation in program form)
      if (onSuccess && result) {
        onSuccess({ id: result.id, name: result.name, type: result.type });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create";
      Alert.alert("Error", message);
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
          Add New Client/Class
        </Text>

        <View style={styles.form}>
          {/* Entity Type Selector */}
          <View style={styles.inputContainer}>
            <Text
              variant="labelLarge"
              style={[styles.label, { color: theme.colors.onSurface }]}
            >
              Type
            </Text>
            <SegmentedButtons
              value={entityType}
              onValueChange={(value) => setValue("type", value as EntityType)}
              buttons={[
                {
                  value: "CLIENT",
                  label: "Client",
                  icon: "account",
                },
                {
                  value: "CLASS",
                  label: "Class",
                  icon: "account-group",
                },
              ]}
              style={styles.segmentedButtons}
            />
            <Text
              variant="bodySmall"
              style={[
                styles.helperText,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {entityType === "CLIENT"
                ? "Individual person you're training"
                : "Group of people training together"}
            </Text>
          </View>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label={entityType === "CLIENT" ? "Client Name" : "Class Name"}
                  placeholder={
                    entityType === "CLIENT" ? "John Doe" : "Morning CrossFit"
                  }
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
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.inputContainer}>
                <TextInput
                  label="Notes (Optional)"
                  placeholder={
                    entityType === "CLIENT"
                      ? "Any notes about this client..."
                      : "Any notes about this class..."
                  }
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
              {entityType === "CLIENT" ? "Create Client" : "Create Class"}
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
  label: {
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    backgroundColor: "transparent",
  },
  segmentedButtons: {
    marginBottom: 4,
  },
  helperText: {
    marginTop: 4,
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
