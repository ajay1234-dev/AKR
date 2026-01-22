import { Stack } from "expo-router";
import { useEffect } from "react";
import { offlineStorage } from "@/services/offlineStorage";
import { syncService } from "@/services/syncService";
import * as Speech from "expo-speech";

export default function RootLayout() {
  useEffect(() => {
    // Initialize offline storage with error handling
    const initServices = async () => {
      try {
        await offlineStorage.init();
        console.log("Offline storage initialized successfully");
      } catch (error) {
        console.warn("Failed to initialize offline storage:", error);
        // Continue anyway - app should work in limited offline mode
      }

      try {
        // Set up periodic sync
        const syncInterval = setInterval(() => {
          syncService.scheduleSync().catch((error) => {
            console.warn("Scheduled sync failed:", error);
          });
        }, 300000); // Every 5 minutes

        return () => clearInterval(syncInterval);
      } catch (error) {
        console.warn("Failed to set up sync service:", error);
      }
    };

    initServices();
  }, []);

  // Text-to-speech helper function
  const speak = (text: string) => {
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.8,
    });
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2c3e50",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 20,
        },
        contentStyle: {
          backgroundColor: "#ecf0f1",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "AKR WORKSHOP",
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name="create-bill"
        options={{
          title: "CREATE BILL",
        }}
      />
      <Stack.Screen
        name="bills-list"
        options={{
          title: "ALL BILLS",
        }}
      />
      <Stack.Screen
        name="bill-detail"
        options={{
          title: "BILL DETAILS",
        }}
      />
    </Stack>
  );
}
