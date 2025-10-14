import { Stack } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ApiProvider, useApi } from "../context/ApiContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Loading Screen Component
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#625BFF" />
    </View>
  );
}

// Navigation Component mit Loading Check
function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  // Zeige Loading Screen während Auth geladen wird
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Nicht eingeloggt → Login Screen
        <Stack.Screen name="login" options={{ headerShown: false }} />
      ) : (
        // Eingeloggt → Tab Navigation
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      )}
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    console.log("🚀 RootLayout mounted");
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ApiProvider>
            <RootNavigator />
          </ApiProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// Styles für Loading Screen
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});