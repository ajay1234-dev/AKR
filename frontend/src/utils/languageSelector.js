import AsyncStorage from "@react-native-async-storage/async-storage";

// Supported languages
export const LANGUAGES = {
  en: { code: "en-US", name: "English", voice: "en-US" },
  hi: { code: "hi-IN", name: "Hindi", voice: "hi-IN" },
  ta: { code: "ta-IN", name: "Tamil", voice: "ta-IN" },
};

// Default language
export const DEFAULT_LANGUAGE = "en";

// Save selected language to AsyncStorage
export const setSelectedLanguage = async (languageCode) => {
  try {
    await AsyncStorage.setItem("selectedLanguage", languageCode);
    return true;
  } catch (error) {
    console.error("Error saving language selection:", error);
    return false;
  }
};

// Get selected language from AsyncStorage
export const getSelectedLanguage = async () => {
  try {
    const languageCode = await AsyncStorage.getItem("selectedLanguage");
    return languageCode || DEFAULT_LANGUAGE;
  } catch (error) {
    console.error("Error getting language selection:", error);
    return DEFAULT_LANGUAGE;
  }
};

// Get language configuration
export const getLanguageConfig = (languageCode) => {
  return LANGUAGES[languageCode] || LANGUAGES[DEFAULT_LANGUAGE];
};

// Initialize language settings
export const initializeLanguage = async () => {
  const savedLanguage = await getSelectedLanguage();
  return getLanguageConfig(savedLanguage);
};

// Get voice language code for speech recognition
export const getVoiceLanguageCode = (languageCode) => {
  const langConfig = LANGUAGES[languageCode];
  return langConfig ? langConfig.voice : LANGUAGES[DEFAULT_LANGUAGE].voice;
};

// Get display name for language
export const getLanguageDisplayName = (languageCode) => {
  const langConfig = LANGUAGES[languageCode];
  return langConfig ? langConfig.name : LANGUAGES[DEFAULT_LANGUAGE].name;
};
