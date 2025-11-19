import { FileText, Mail } from "lucide-react-native";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import type { Client } from "@/hooks/useClients";

interface ClientCardProps {
  client: any; // Use any for now
  onPress?: () => void;
}

export function ClientCard({ client, onPress }: ClientCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            {client.name}
          </Text>

          <View style={styles.contentGap}>
            <View style={styles.row}>
              <Mail size={14} color={theme.colors.onSurfaceVariant} />
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {client.email}
              </Text>
            </View>

            {client.program_count !== undefined && client.program_count > 0 && (
              <View style={styles.row}>
                <FileText size={14} color={theme.colors.onSurfaceVariant} />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {client.program_count}{" "}
                  {client.program_count === 1 ? "program" : "programs"}
                </Text>
              </View>
            )}

            {client.notes ? (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
                numberOfLines={2}
              >
                {client.notes}
              </Text>
            ) : null}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
  },
  title: {
    fontWeight: "600",
    marginBottom: 8,
  },
  contentGap: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
