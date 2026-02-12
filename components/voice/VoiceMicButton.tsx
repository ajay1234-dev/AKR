import React from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { IconButton, Text, useTheme } from "react-native-paper";
import { useVoiceToText } from "./useVoiceToText";
import { autoCorrectText, parseVoiceItem } from "@/utils/autoCorrector";

interface VoiceMicButtonProps {
  onTextUpdate: (text: string) => void;
  field:
    | "customerName"
    | "workDescription"
    | "item"
    | "workDone"
    | "vehicleName";
  itemIndex?: number;
  containerStyle?: object;
  size?: "small" | "medium" | "large";
}

export const VoiceMicButton: React.FC<VoiceMicButtonProps> = ({
  onTextUpdate,
  field,
  itemIndex,
  containerStyle,
  size = "medium",
}) => {
  const theme = useTheme();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const pulseAnimation = React.useRef(new Animated.Value(1)).current;

  const {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceToText({
    continuous: false,
    interimResults: true,
    lang: "en-IN",
  });

  // Pulse animation for active mic
  React.useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnimation.setValue(1);
    }

    return () => {
      pulseAnimation.stopAnimation();
    };
  }, [isListening, pulseAnimation]);

  // Handle transcript updates
  React.useEffect(() => {
    if (transcript && !isListening) {
      processVoiceInput(transcript);
    }
  }, [transcript, isListening]);

  const processVoiceInput = async (text: string) => {
    if (!text.trim()) return;

    setIsProcessing(true);

    try {
      // Apply auto-correction
      let correctedText = autoCorrectText(text);

      // Special handling for item fields
      if (field === "item" && itemIndex !== undefined) {
        const parsedItem = parseVoiceItem(text);
        // For item fields, we might want to split the parsed data
        // For now, we'll use the corrected full text
        correctedText = parsedItem.itemName;
        // You could also update quantity and unit separately if needed
      }

      // Update the parent component
      onTextUpdate(correctedText);

      // Reset for next use
      resetTranscript();
    } catch (error) {
      console.error("Error processing voice input:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getButtonColor = () => {
    if (!isSupported) return theme.colors.disabled;
    if (isListening) return theme.colors.error;
    if (isProcessing) return theme.colors.primary;
    return theme.colors.primary;
  };

  const getIcon = () => {
    if (!isSupported) return "microphone-off";
    if (isListening) return "microphone";
    if (isProcessing) return "loading";
    return "microphone";
  };

  const getSize = () => {
    switch (size) {
      case "small":
        return 20;
      case "large":
        return 32;
      default:
        return 24;
    }
  };

  if (!isSupported) {
    return (
      <View style={[styles.container, containerStyle]}>
        <IconButton
          icon="microphone-off"
          size={getSize()}
          iconColor={theme.colors.disabled}
          disabled
        />
        <Text style={[styles.statusText, { color: theme.colors.disabled }]}>
          Not supported
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View
        style={[
          styles.micButtonContainer,
          {
            transform: [{ scale: pulseAnimation }],
            shadowColor: isListening ? theme.colors.error : "transparent",
          },
        ]}
      >
        <IconButton
          icon={getIcon()}
          size={getSize()}
          iconColor="white"
          containerColor={getButtonColor()}
          onPress={handlePress}
          disabled={isProcessing}
          style={styles.micButton}
        />
      </Animated.View>

      {isListening && (
        <Text style={[styles.statusText, { color: theme.colors.error }]}>
          Listening...
        </Text>
      )}

      {isProcessing && (
        <Text style={[styles.statusText, { color: theme.colors.primary }]}>
          Processing...
        </Text>
      )}

      {error && (
        <Text style={[styles.statusText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {!isListening && !isProcessing && !error && (
        <Text style={[styles.statusText, { color: theme.colors.outline }]}>
          Tap to speak
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonContainer: {
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  micButton: {
    margin: 0,
  },
  statusText: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
    fontWeight: "500",
  },
});
