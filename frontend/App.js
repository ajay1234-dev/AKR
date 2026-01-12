import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./src/screens/HomeScreen";
import CreateBillScreen from "./src/screens/CreateBillScreen";
import BillListScreen from "./src/screens/BillListScreen";
import BillDetailScreen from "./src/screens/BillDetailScreen";
import { syncOfflineBills } from "./src/utils/offline/offlineStorage";
import { billAPI } from "./src/utils/api";

const Stack = createStackNavigator();

export default function App() {
  // Perform background sync when app starts
  useEffect(() => {
    const syncBills = async () => {
      await syncOfflineBills((billData) => billAPI.createBill(billData));
    };

    // Sync bills in the background
    syncBills();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: "🔧 Mechanic Shop",
            headerStyle: { backgroundColor: "#2196F3" },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontSize: 22,
              fontWeight: "bold",
            },
          }}
        />
        <Stack.Screen
          name="CreateBill"
          component={CreateBillScreen}
          options={{
            title: "📝 Create Bill",
            headerStyle: { backgroundColor: "#2196F3" },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: "bold",
            },
          }}
        />
        <Stack.Screen
          name="BillList"
          component={BillListScreen}
          options={{
            title: "📋 Bills",
            headerStyle: { backgroundColor: "#2196F3" },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: "bold",
            },
          }}
        />
        <Stack.Screen
          name="BillDetail"
          component={BillDetailScreen}
          options={{
            title: "Bill Details",
            headerStyle: { backgroundColor: "#2196F3" },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontSize: 20,
              fontWeight: "bold",
            },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
