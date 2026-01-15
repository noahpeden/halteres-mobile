import { useState, useContext, useEffect } from "react";
import { View, StyleSheet, Image } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Surface,
  Avatar,
  ActivityIndicator,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase/client";
import { AuthContext } from "@/components/providers/AuthProvider";

type Gym = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  require_approval: boolean;
};

export default function JoinGymScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { user, refetchGymMemberships } = useContext(AuthContext);

  const [inviteCode, setInviteCode] = useState(params.code || "");
  const [gym, setGym] = useState<Gym | null>(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-lookup if code is provided in params
  useEffect(() => {
    if (params.code) {
      handleLookup();
    }
  }, [params.code]);

  const handleLookup = async () => {
    if (!inviteCode.trim()) {
      setError("Please enter an invite code");
      return;
    }

    setLoading(true);
    setError(null);
    setGym(null);

    try {
      const { data, error: lookupError } = await supabase
        .from("gyms")
        .select("id, name, description, logo_url, require_approval")
        .eq("invite_code", inviteCode.toUpperCase().trim())
        .is("deleted_at", null)
        .single();

      if (lookupError) {
        if (lookupError.code === "PGRST116") {
          setError("Invalid invite code. Please check and try again.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setGym(data);
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!user) {
      // Navigate to login with return params
      router.push({
        pathname: "/(auth)/login",
        params: { redirect: "join-gym", code: inviteCode },
      });
      return;
    }

    if (!gym) return;

    setJoining(true);
    setError(null);

    try {
      // Check if already a member
      const { data: existingMembership } = await supabase
        .from("gym_memberships")
        .select("id, status")
        .eq("gym_id", gym.id)
        .eq("user_id", user.id)
        .single();

      if (existingMembership) {
        if (existingMembership.status === "active") {
          setError("You are already a member of this gym.");
          setJoining(false);
          return;
        }
        if (existingMembership.status === "pending") {
          setError("Your membership request is pending approval.");
          setJoining(false);
          return;
        }
      }

      // Create membership
      const { error: joinError } = await supabase
        .from("gym_memberships")
        .upsert(
          [
            {
              gym_id: gym.id,
              user_id: user.id,
              role: "athlete",
              status: gym.require_approval ? "pending" : "active",
              joined_at: gym.require_approval
                ? null
                : new Date().toISOString(),
            },
          ],
          { onConflict: "gym_id,user_id" }
        );

      if (joinError) throw joinError;

      setSuccess(
        gym.require_approval
          ? "Membership request sent! Waiting for approval."
          : `Welcome to ${gym.name}!`
      );

      await refetchGymMemberships();

      // Navigate to athlete home after delay
      setTimeout(() => {
        router.replace("/(athlete)/home");
      }, 2000);
    } catch (err) {
      setError("Failed to join gym. Please try again.");
    } finally {
      setJoining(false);
    }
  };

  const handleReset = () => {
    setGym(null);
    setInviteCode("");
    setError(null);
    setSuccess(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={styles.title}>
          Join a Gym
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter the invite code from your coach to join their gym.
        </Text>

        {!gym ? (
          // Code Entry View
          <Surface style={styles.card} elevation={2}>
            <TextInput
              label="Invite Code"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              style={styles.input}
              mode="outlined"
              placeholder="e.g., ABC123"
              maxLength={8}
            />

            {error && (
              <Text variant="bodySmall" style={styles.errorText}>
                {error}
              </Text>
            )}

            <Button
              mode="contained"
              onPress={handleLookup}
              loading={loading}
              disabled={loading || !inviteCode.trim()}
              style={styles.button}
            >
              Find Gym
            </Button>
          </Surface>
        ) : success ? (
          // Success View
          <Surface style={styles.card} elevation={2}>
            <View style={styles.successContainer}>
              <Text variant="headlineSmall" style={styles.successIcon}>
                :)
              </Text>
              <Text variant="titleMedium" style={styles.successText}>
                {success}
              </Text>
              <ActivityIndicator style={styles.redirectLoader} />
              <Text variant="bodySmall" style={styles.redirectText}>
                Redirecting...
              </Text>
            </View>
          </Surface>
        ) : (
          // Gym Preview View
          <Surface style={styles.card} elevation={2}>
            <View style={styles.gymPreview}>
              {gym.logo_url ? (
                <Avatar.Image size={80} source={{ uri: gym.logo_url }} />
              ) : (
                <Avatar.Text
                  size={80}
                  label={gym.name.charAt(0)}
                  style={styles.avatar}
                />
              )}

              <Text variant="headlineSmall" style={styles.gymName}>
                {gym.name}
              </Text>

              {gym.description && (
                <Text variant="bodyMedium" style={styles.gymDescription}>
                  {gym.description}
                </Text>
              )}
            </View>

            {error && (
              <Text variant="bodySmall" style={styles.errorText}>
                {error}
              </Text>
            )}

            <View style={styles.buttonRow}>
              <Button
                mode="outlined"
                onPress={handleReset}
                style={styles.secondaryButton}
              >
                Back
              </Button>
              <Button
                mode="contained"
                onPress={handleJoin}
                loading={joining}
                disabled={joining}
                style={styles.primaryButton}
              >
                {user ? "Join Gym" : "Sign In to Join"}
              </Button>
            </View>
          </Surface>
        )}

        <Button
          mode="text"
          onPress={() => router.back()}
          style={styles.cancelButton}
        >
          Cancel
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "bold",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.7,
  },
  card: {
    padding: 24,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  errorText: {
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 16,
  },
  gymPreview: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatar: {
    marginBottom: 16,
  },
  gymName: {
    marginTop: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  gymDescription: {
    marginTop: 8,
    textAlign: "center",
    opacity: 0.7,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
  },
  primaryButton: {
    flex: 2,
  },
  cancelButton: {
    marginTop: 24,
  },
  successContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  successText: {
    textAlign: "center",
    color: "#2e7d32",
    marginBottom: 16,
  },
  redirectLoader: {
    marginBottom: 8,
  },
  redirectText: {
    opacity: 0.6,
  },
});
