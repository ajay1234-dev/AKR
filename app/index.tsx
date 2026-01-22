import { View, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Button, Card, Title, Paragraph } from "react-native-paper";
import * as Speech from "expo-speech";
import { useEffect } from "react";

export default function HomeScreen() {
  const router = useRouter();

  useEffect(() => {
    // Welcome speech when screen loads
    setTimeout(() => {
      speak("Welcome to AKR Workshop");
    }, 1000);
  }, []);

  const speak = (text: string) => {
    Speech.speak(text, {
      language: "en-US",
      pitch: 1.0,
      rate: 0.8,
    });
  };

  const handleCreateBill = () => {
    speak("Create new bill");
    router.push("/create-bill");
  };

  const handleViewBills = () => {
    speak("View all bills");
    router.push("/bills-list");
  };

  const handleReports = () => {
    speak("Reports feature coming soon");
    Alert.alert(
      "Coming Soon",
      "Reports feature will be available in the next update."
    );
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.title}>AKR WORKSHOP</Title>
          <Paragraph style={styles.subtitle}>
            Mechanic Management System
          </Paragraph>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={handleCreateBill}
          style={[styles.mainButton, styles.createButton]}
          labelStyle={styles.buttonText}
          icon="plus-circle"
        >
          CREATE BILL
        </Button>

        <Button
          mode="contained"
          onPress={handleViewBills}
          style={[styles.mainButton, styles.viewButton]}
          labelStyle={styles.buttonText}
          icon="file-document-multiple"
        >
          VIEW BILLS
        </Button>

        <Button
          mode="outlined"
          onPress={handleReports}
          style={[styles.secondaryButton]}
          labelStyle={styles.secondaryButtonText}
          icon="chart-bar"
        >
          REPORTS
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#ecf0f1",
    justifyContent: "center",
  },
  card: {
    marginBottom: 30,
    backgroundColor: "#3498db",
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    opacity: 0.9,
  },
  buttonContainer: {
    gap: 20,
  },
  mainButton: {
    height: 80,
    justifyContent: "center",
    borderRadius: 12,
    elevation: 3,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  createButton: {
    backgroundColor: "#27ae60",
  },
  viewButton: {
    backgroundColor: "#e67e22",
  },
  secondaryButton: {
    height: 60,
    justifyContent: "center",
    borderRadius: 12,
    borderColor: "#7f8c8d",
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 18,
    color: "#7f8c8d",
    fontWeight: "600",
  },
});
