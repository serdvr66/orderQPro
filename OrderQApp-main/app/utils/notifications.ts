import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// Konfiguriere wie Notifications angezeigt werden
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  let token;

  console.log("🚀 === STARTING registerForPushNotificationsAsync ===");

  console.log("📱 Device.isDevice:", Device.isDevice);
  console.log("📱 Platform:", Platform.OS);
  console.log("📱 __DEV__:", __DEV__);
  console.log("📱 Constants.appOwnership:", Constants.appOwnership);
  console.log(
    "📱 Constants.executionEnvironment:",
    Constants.executionEnvironment
  );
  // Für Android: Notification Channel erstellen
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
    console.log("📱 Android notification channel created");
  }

  if (Device.isDevice) {
    console.log(
      "📱 Device is physical device - proceeding with permission request"
    );

    try {
      // Permissions abfragen
      console.log("🔐 Getting existing permissions...");
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      console.log("🔐 Existing permission status:", existingStatus);

      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        console.log("🔐 Requesting permissions...");

        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log("🔐 Permission request result:", status);
      }

      if (finalStatus !== "granted") {
        console.log(
          "❌ Push notification permissions not granted:",
          finalStatus
        );
        console.log("Error: Push notification permissions not granted:", finalStatus);
        return null;
      }

      console.log("✅ Push notification permissions granted");

      try {
        // 🎯 PROJECT ID FIX - wie im Artikel beschrieben
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ||
          Constants?.easConfig?.projectId ||
          "b1c828e2-9d93-4a09-ad69-b31e8f9b940a";

        console.log(
          "📱 Project ID from Constants:",
          Constants?.expoConfig?.extra?.eas?.projectId
        );
        console.log("📱 Using project ID:", projectId);

        if (!projectId) {
          throw new Error("Project ID not found");
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = tokenData.data;

        console.log("✅ Expo Push Token generated:", token);
      } catch (tokenError: unknown) {
        const errorMessage =
          tokenError instanceof Error
            ? tokenError.message
            : "Unknown token error";
        console.log("❌ Error getting push token:", tokenError);
        console.log("Token Error: Error getting push token:", errorMessage);
        return null;
      }
    } catch (permissionError: unknown) {
      const errorMessage =
        permissionError instanceof Error
          ? permissionError.message
          : "Unknown permission error";
      console.log("❌ Error with permissions:", permissionError);
      console.log("Permission Error: Error with permissions:", errorMessage);
      return null;
    }
  } else {
    console.log("❌ Must use physical device for Push Notifications");
    console.log("Error: Must use physical device for Push Notifications");
    return null;
  }

  console.log("✅ === registerForPushNotificationsAsync COMPLETED ===");
  return token;
}

/**
 * Sendet Push-Token an das Backend - DEBUG VERSION
 */
export async function registerPushTokenWithBackend(
  apiContext: any,
  companyId: number
) {
  try {
    console.log("🔄 === STARTING registerPushTokenWithBackend ===");
    console.log("🔄 Company ID:", companyId);
    console.log("🔄 API Context available:", !!apiContext);
    console.log("🔄 API Context type:", typeof apiContext);

    // Push-Token generieren
    console.log("🔄 Calling registerForPushNotificationsAsync...");
    const token = await registerForPushNotificationsAsync();

    if (!token) {
      console.log("❌ No push token available");
      console.log("Error: No push token available");
      return { success: false, error: "No token available" };
    }

    console.log("✅ Token received, proceeding with backend registration...");

    // Device-Informationen sammeln
    const deviceId =
      Constants.deviceId || Device.osInternalBuildId || "unknown";
    const platform = Platform.OS;

    console.log("📱 Device info collected:", {
      deviceId,
      platform,
      token: `${token.substring(0, 30)}...`,
    });

    console.log("🔄 Calling apiContext.registerPushToken...");
    console.log("🔄 Parameters:", {
      token: `${token.substring(0, 30)}...`,
      companyId,
      platform,
      deviceId,
    });

    // Backend API aufrufen
    const result = await apiContext.registerPushToken(
      token,
      companyId,
      platform,
      deviceId
    );

    console.log("📥 Backend response:", result);

    if (result && result.success) {
      console.log("✅ Push token registered with backend successfully");
      console.log("✅ Message:", result.message);
      console.log("✅ Token ID:", result.token_id);

      return {
        success: true,
        tokenId: result.token_id,
        token,
        message: result.message,
      };
    } else {
      console.error("❌ Backend registration failed:", result);
      console.log("Backend Error: Registration failed:", result?.message || "Unknown error");
      return {
        success: false,
        error: result?.message || "Unknown error from backend",
      };
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error in registerPushTokenWithBackend:", error);
    console.log("Critical Error: Error in registerPushTokenWithBackend:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Debug-Funktion für manuellen Test
 */
export async function debugTokenGeneration(apiContext: any, companyId: number) {
  try {
    console.log("Debug Test: Starting manual token generation test...");

    console.log("🧪 === MANUAL DEBUG TEST STARTED ===");
    console.log("🧪 API Context:", !!apiContext);
    console.log("🧪 Company ID:", companyId);

    // Schritt 1: Permissions prüfen
    const permissions = await Notifications.getPermissionsAsync();
    console.log("🧪 Current permissions:", permissions);
    console.log("Step 1: Current permissions:", permissions.status);

    if (permissions.status !== "granted") {
      console.log("Step 2: Requesting permissions...");
      const request = await Notifications.requestPermissionsAsync();
      console.log("🧪 Permission request result:", request);
      console.log("Step 3: Permission result:", request.status);

      if (request.status !== "granted") {
        console.log("Error: Permissions not granted!");
        return;
      }
    }

    // Schritt 2: Token generieren
    console.log("Step 4: Generating token...");
    const token = await registerForPushNotificationsAsync();

    if (!token) {
      console.log("Error: Token generation failed!");
      return;
    }

    // Schritt 3: Backend registrieren
    console.log("Step 5: Registering with backend...");
    const result = await registerPushTokenWithBackend(apiContext, companyId);

    console.log(
      "Final Result:",
      `Success: ${result.success}, Message: ${result.message || result.error}`
    );

    console.log("🧪 === MANUAL DEBUG TEST COMPLETED ===");
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown debug error";
    console.error("🧪 Debug test error:", error);
    console.log("Debug Test Error:", errorMessage);
  }
}

/**
 * Entfernt Push-Token vom Backend
 */
export async function unregisterPushTokenFromBackend(apiContext: any) {
  try {
    console.log("🔄 Unregistering push token from backend...");

    // 🎯 PROJECT ID FIX auch hier anwenden
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      "b1c828e2-9d93-4a09-ad69-b31e8f9b940a";

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });

    if (!tokenData?.data) {
      console.log("✅ No token to unregister");
      return { success: true, message: "No token to unregister" };
    }

    const result = await apiContext.unregisterPushToken(tokenData.data);

    console.log("✅ Push token unregistered:", result);
    return { success: true, message: result.message || "Token unregistered" };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error unregistering push token:", error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Testet Push-Notifications über Backend
 */
export async function testPushNotificationViaBackend(
  apiContext: any,
  companyId: number
) {
  try {
    console.log("🧪 Testing push notification via backend...");
    console.log("🧪 Company ID:", companyId);

    console.log("Test Notification: Sending test notification...");

    const result = await apiContext.testPushNotification(companyId);

    if (result && result.success) {
      console.log("✅ Test notification sent successfully:", result);
      console.log(
        "Test Success:",
        `Test notification sent! Count: ${result.sent_count || 0}`
      );
      return {
        success: true,
        message: result.message || "Test notification sent",
        sentCount: result.sent_count || 0,
      };
    } else {
      console.error("❌ Test notification failed:", result);
      console.log(
        "Test Failed:",
        `Test failed: ${result?.message || "Unknown error"}`
      );
      return {
        success: false,
        error: result?.message || "Test notification failed",
      };
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error sending test notification:", error);
    console.log("Test Error:", errorMessage);
    return { success: false, error: errorMessage };
  }
}