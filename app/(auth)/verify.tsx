import { useState } from "react";
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Text, TextInput } from "react-native-paper";
import { useSignUp } from "@clerk/expo";
import { router } from "expo-router";

export default function VerifyEmailScreen() {
  const { signUp, setActive } = useSignUp();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const onVerify = async () => {
    try {
      setLoading(true);
      if (!signUp) throw new Error("Auth not ready");
      const res = await signUp.attemptEmailAddressVerification({ code });
      // @ts-ignore
      if (res.status === "complete") {
        // @ts-ignore
        await setActive!({ session: res.createdSessionId });
        router.replace("/");
        return;
      }
      Alert.alert("Verification", "Enter a valid code to continue.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Verify your email
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Enter the 6-digit code we sent to your email address.
          </Text>
          <View style={styles.form}>
            <TextInput
              label="Email code"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
            />
            <Button mode="contained" onPress={onVerify} loading={loading} disabled={loading} style={styles.button}>
              Verify and continue
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  keyboardView: { flex: 1 },
  content: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { textAlign: "center", fontWeight: "700", marginBottom: 8 },
  subtitle: { textAlign: "center", marginBottom: 16 },
  form: { marginTop: 8 },
  input: { backgroundColor: "transparent", marginBottom: 8 },
  button: { marginTop: 8 },
});

