import { Stack } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    // App initialization - no offline storage or sync needed
    // All data is saved directly to Firebase
    console.log("App initialized - using direct Firebase connection");
  }, []);

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
