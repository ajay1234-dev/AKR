// Import Tts conditionally to handle web compatibility
let Tts;
let isWeb = false;

// Check if we're running in a web environment
if (typeof window !== 'undefined') {
  isWeb = true;
  // Mock Tts object for web
  Tts = {
    setDefaultLanguage: () => {},
    setDefaultRate: () => {},
    setDefaultPitch: () => {},
    speak: (text) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.4;
        utterance.pitch = 1.0;
        speechSynthesis.speak(utterance);
      }
    },
    stop: () => {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    getInitStatus: async () => [],
  };
} else {
  // Native mobile environment
  try {
    Tts = require('react-native-tts');
  } catch (error) {
    console.warn('react-native-tts not available:', error);
    // Mock Tts for fallback
    Tts = {
      setDefaultLanguage: () => {},
      setDefaultRate: () => {},
      setDefaultPitch: () => {},
      speak: (text) => console.log('TTS speak:', text),
      stop: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      getInitStatus: async () => [],
    };
  }
}

// Initialize TTS with default settings (only if not in web)
if (!isWeb) {
  try {
    Tts.setDefaultLanguage("en-GB"); // British English as default
    Tts.setDefaultRate(0.4); // Slower rate for better comprehension
    Tts.setDefaultPitch(1.0);
  } catch (error) {
    console.warn("TTS initialization error:", error);
  }
}

// Available languages
const LANGUAGES = {
  ENGLISH: "en-GB",
  HINDI: "hi-IN",
  TAMIL: "ta-IN",
};

// Set the current language
export const setLanguage = (languageCode) => {
  try {
    if (!isWeb) {
      Tts.setDefaultLanguage(languageCode);
    }
  } catch (error) {
    console.warn("Language not supported:", languageCode, error);
    // Fallback to English if language not supported
    if (!isWeb) {
      try {
        Tts.setDefaultLanguage(LANGUAGES.ENGLISH);
      } catch (fallbackError) {
        console.warn("Fallback language setting failed:", fallbackError);
      }
    }
  }
};

// Speak text with error handling
export const speakText = (text) => {
  return new Promise((resolve, reject) => {
    if (!text) {
      resolve();
      return;
    }

    if (isWeb) {
      // Web implementation using browser speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.4;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          console.log("TTS finished");
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.log("TTS error", event);
          resolve(); // Resolve anyway to prevent hanging
        };
        
        speechSynthesis.speak(utterance);
      } else {
        console.log("TTS not supported in this browser");
        resolve();
      }
    } else {
      // Native mobile implementation
      try {
        Tts.speak(text);

        const finishHandler = () => {
          Tts.removeEventListener("tts-finish", finishHandler);
          Tts.removeEventListener("tts-cancel", cancelHandler);
          resolve();
        };

        const cancelHandler = () => {
          Tts.removeEventListener("tts-finish", finishHandler);
          Tts.removeEventListener("tts-cancel", cancelHandler);
          resolve();
        };

        Tts.addEventListener("tts-finish", finishHandler);
        Tts.addEventListener("tts-cancel", cancelHandler);
      } catch (error) {
        console.error("TTS speak error:", error);
        resolve(); // Resolve anyway to prevent hanging
      }
    }
  });
};

// Stop current speech
export const stopSpeech = () => {
  try {
    Tts.stop();
  } catch (error) {
    console.warn("TTS stop error:", error);
  }
};

// Get available voices (for language selection)
export const getAvailableVoices = async () => {
  try {
    if (isWeb && 'speechSynthesis' in window) {
      // Wait a bit for voices to be loaded in web
      return new Promise((resolve) => {
        const voices = speechSynthesis.getVoices();
        if (voices.length > 0) {
          resolve(voices);
        } else {
          // Wait for voices to load
          setTimeout(() => {
            resolve(speechSynthesis.getVoices());
          }, 100);
        }
      });
    } else {
      const voices = await Tts.getInitStatus();
      return voices || [];
    }
  } catch (error) {
    console.error("Error getting available voices:", error);
    return [];
  }
};

// Speak with language switching
export const speakWithLanguage = async (
  text,
  languageCode = LANGUAGES.ENGLISH
) => {
  setLanguage(languageCode);
  await speakText(text);
};

// Predefined phrases for the app
export const speakPhrases = {
  // Home Screen
  homeWelcome: () =>
    speakText(
      "Welcome to Mechanic Workshop app. Press Create New Bill to start a new bill, or View Previous Bills to see old bills."
    ),
  createNewBill: () => speakText("Press here to create a new bill"),
  viewPreviousBills: () => speakText("Press here to view previous bills"),

  // Create Bill Screen
  customerNameInstruction: () =>
    speakText("Press the voice button to speak the customer name"),
  vehicleNumberInstruction: () =>
    speakText("Press the voice button to speak the vehicle number"),
  workDescriptionInstruction: () =>
    speakText("Press the voice button to speak the work description"),
  sparePartInstruction: () =>
    speakText("Press the voice button to speak the spare part description"),
  amountInstruction: () => speakText("Now type the amount using the keyboard"),
  advanceAmountInstruction: () => speakText("Type the advance amount if any"),
  createBillButton: () => speakText("Press Create Bill to save the bill"),

  // Bill List Screen
  billListInstruction: () =>
    speakText(
      "This is the list of previous bills. Tap on any bill to see details"
    ),

  // Bill Detail Screen
  billDetailInstruction: () =>
    speakText("This is the bill detail. Swipe to see all information"),

  // Success Messages
  billCreatedSuccess: () => speakText("Bill created successfully"),
  billSentSuccess: () => speakText("Bill sent on WhatsApp successfully"),
  voiceRecordingStarted: () => speakText("Recording started, please speak now"),
  voiceRecordingStopped: () => speakText("Recording stopped"),

  // Error Messages
  errorOccurred: () => speakText("An error occurred, please try again"),
  requiredFieldsMissing: () => speakText("Please fill in all required fields"),
};

export default {
  speakText,
  stopSpeech,
  setLanguage,
  speakWithLanguage,
  getAvailableVoices,
  ...speakPhrases,
  LANGUAGES,
};