import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ApiProvider, useApi } from "../context/ApiContext";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import {
  registerForPushNotificationsAsync,
  registerPushTokenWithBackend,
} from "./utils/notifications";

// Loading Screen Component - NEU
function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#625BFF" />
    </View>
  );
}

// Separate Komponente für die Push-Token Integration mit umfassendem Debugging
function PushTokenManager() {
  const api = useApi();
  const auth = useAuth();
  const initializationRef = useRef(false);

  console.log("🔥 === PushTokenManager RENDER ===");
  console.log("🔥 API:", !!api);
  console.log("🔥 Auth:", !!auth);
  console.log("🔥 Auth State:", auth?.isAuthenticated);
  console.log("🔥 User:", auth?.user);
  console.log("🔥 Company ID:", auth?.user?.company_id);

  // 🚨 SOFORTIGER DEBUG BEIM COMPONENT MOUNT
  useEffect(() => {
    console.log("🚨 PushTokenManager mounted");
    const bundleId =
      Constants.manifest?.ios?.bundleIdentifier ||
      Constants.manifest2?.ios?.bundleIdentifier ||
      "Not found";

    console.log("Bundle ID:", bundleId);  
  }, []);

  // 🚨 DEBUG WENN AUTH SICH ÄNDERT
  useEffect(() => {
    console.log("🚨 Auth state changed:", {
      isAuthenticated: auth?.isAuthenticated,
      hasUser: !!auth?.user,
      companyId: auth?.user?.company_id,
    });

    if (auth?.isAuthenticated && auth?.user) {
     
    } else { 
    }
  }, [auth?.isAuthenticated, auth?.user]);

  // 🚨 DEBUG WENN API SICH ÄNDERT
  useEffect(() => {
    console.log("🚨 API context changed:", !!api);
    if (api) {
    }
  }, [api]);

  useEffect(() => {
    // API Context für Logout verfügbar machen
    if (api && auth?.setApiContextForLogout) {
      auth.setApiContextForLogout(api);
    }
  }, [api, auth]);

  // ✅ HAUPTEFFEKT - läuft bei jeder Auth-Änderung
  useEffect(() => {
    let isMounted = true;

    const initializePushNotifications = async () => {
      try {
        console.log("🚀 === INITIALIZING PUSH NOTIFICATIONS ===");
        console.log("🔍 API Context available:", !!api);
        console.log("🔍 Auth Context available:", !!auth);
        console.log("🔍 User authenticated:", auth?.isAuthenticated);
        console.log("🔍 User object:", auth?.user);
        console.log("🔍 Company ID:", auth?.user?.company_id);
        console.log(
          "🔍 Initialization already run:",
          initializationRef.current
        );

        // Verhindere doppelte Ausführung
        if (initializationRef.current) {
          console.log("⏭️ Skipping - already initialized");
          return;
        }

        // Warte bis Api Context verfügbar ist
        if (!api) {
          console.log("⏳ Waiting for API context...");
          return;
        }

        // WICHTIG: Nur für eingeloggte User
        if (!auth?.isAuthenticated || !auth?.user) {
          console.log(
            "🚫 User not authenticated - skipping push token registration"
          );
          console.log("Debug Skip: User not authenticated, skipping registration");
          return;
        }

        // Company ID dynamisch ermitteln
        let companyId = null;

        if (auth?.user?.company_id) {
          companyId = auth.user.company_id;
          console.log(`🏢 Using company ID from user: ${companyId}`);
          console.log("Debug Company: Company ID found:", companyId);
        } else {
          console.log("⚠️ No company ID found in authenticated user");
          console.log(
            "🔍 User object debug:",
            JSON.stringify(auth.user, null, 2)
          );
          console.log("Debug Error: No company ID found in user object");
          return;
        }

        if (isMounted) {
          console.log("🔄 Starting push token registration process...");
          console.log("Debug Process: Starting token registration process...");

          // Markiere als initialisiert
          initializationRef.current = true;

          // WICHTIG: Alle alten Tokens für dieses Gerät löschen
          try {
            console.log("🧹 Cleaning up old push tokens for this device...");

            // Erst einen Test-Token generieren um cleanup zu machen
            const testToken = await registerForPushNotificationsAsync();
            if (testToken) {
              await api.unregisterPushToken(testToken);
              console.log("✅ Old push tokens cleaned up successfully");
            }
          } catch (error) {
            console.log(
              "⚠️ Failed to cleanup old tokens (this is normal for first registration):",
              error
            );
          }

          // Dann neuen Token für aktuelle Company registrieren
          console.log("🔄 Calling registerPushTokenWithBackend...");
          console.log("Debug Backend: Calling backend registration...");

          const result = await registerPushTokenWithBackend(api, companyId);

          if (result.success) {
            console.log(
              "✅ App successfully connected to backend for push notifications"
            );
            console.log(`📱 Token ID: ${result.tokenId}`);
            console.log(`🏢 Registered for Company ID: ${companyId}`);

            console.log(
              "Success! Push notifications registered successfully!",
              `Token ID: ${result.tokenId}`,
              `Company: ${companyId}`
            );

            // ✅ VERIFIKATION: Token in Database prüfen
            try {
              console.log("🔍 Verifying token in database...");
              const tokens = await api.getPushTokens(companyId);
              console.log("📊 Tokens in database:", tokens);
              console.log("Verification: Found", tokens?.length || 0, "tokens in database");
            } catch (error) {
              console.log("⚠️ Could not verify tokens:", error);
              console.log("Verification Warning: Could not verify token in database");
            }
          } else {
            console.log(
              "⚠️ Failed to connect to backend for push notifications:",
              result.error
            );
            console.log("Registration Failed - Error:", result.error);
            initializationRef.current = false; // Reset bei Fehler
          }
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown initialization error";
        console.error("❌ Error initializing push notifications:", error);
        console.log("Critical Error - Initialization failed:", errorMessage);
        initializationRef.current = false; // Reset bei Fehler
      }
    };

    // Nur ausführen wenn User eingeloggt ist
    if (auth?.isAuthenticated && auth?.user && api) {
      console.log(
        "🎯 Auth changed - user is now authenticated, starting initialization..."
      );
      console.log("Debug Trigger: Auth state valid, starting initialization in 2 seconds...");

      // Kleine Verzögerung um sicherzustellen dass alles ready ist
      const timeoutId = setTimeout(initializePushNotifications, 2000);

      return () => {
        clearTimeout(timeoutId);
        isMounted = false;
      };
    } else {
      console.log(
        "🚫 Auth changed but user not authenticated or API not ready"
      );

      // Reset wenn User sich ausloggt
      if (!auth?.isAuthenticated) {
        initializationRef.current = false;
      }
    }
  }, [api, auth?.isAuthenticated, auth?.user]); // ✅ Wichtig: auth.user als Dependency

  // ✅ ZUSÄTZLICHER EFFECT - für sofortige Ausführung nach Login
  useEffect(() => {
    if (
      auth?.isAuthenticated &&
      auth?.user?.company_id &&
      api &&
      !initializationRef.current
    ) {
      console.log("🚨 IMMEDIATE TRIGGER - User just logged in!");
      console.log("🚨 Company ID:", auth.user.company_id);

      console.log("Immediate Trigger: User logged in with Company ID:", auth.user.company_id);

      // Sofortige Ausführung ohne Delay
      const immediateInit = async () => {
        try {
          const companyId = auth.user.company_id;

          console.log("Immediate Init: Starting immediate token generation...");

          const pushToken = await registerForPushNotificationsAsync();

          if (pushToken) {
            console.log("🚨 IMMEDIATE - Generated token:", pushToken);
            console.log("Token Generated:", pushToken.substring(0, 30) + "...");

            // Direkte API-Registrierung
            const result = await api.registerPushToken(
              pushToken,
              companyId,
              "ios",
              "IMMEDIATE"
            );
            console.log("🚨 IMMEDIATE - Registration result:", result);
            console.log("Registration Result:", JSON.stringify(result));

            initializationRef.current = true;
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown immediate error";
          console.error("🚨 IMMEDIATE - Error:", error);
          console.log("Immediate Error:", errorMessage);
        }
      };

      immediateInit();
    }
  }, [auth?.isAuthenticated, auth?.user?.company_id, api]);

  return null;
}

// NEU: Navigation Component mit Loading Check
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

    // Push-Notifications initialisieren (lokale Token-Generierung)
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log("✅ Push Token erhalten:", token);
        console.log("Push Token:", token);
      } else {
        console.log("❌ Kein Push Token erhalten");
        console.log("Root Layout: No token generated");
      }
    });

    // Listener für eingehende Notifications
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("📱 Notification erhalten:", notification);
        console.log("Notification Received - Title:", notification.request.content.title);
      }
    );

    // Listener für wenn User auf Notification tippt
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification angetippt:", response);
        console.log("Notification Tapped: User tapped notification");
      });

   // CORRECT:
return () => {
  notificationListener.remove();
  responseListener.remove();
};
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ApiProvider>
            <PushTokenManager />
            <RootNavigator />
          </ApiProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// NEU: Styles für Loading Screen
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});