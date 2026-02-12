import { useState, useRef, useEffect } from "react";

interface VoiceToTextOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

interface VoiceToTextHook {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export const useVoiceToText = (
  options: VoiceToTextOptions = {}
): VoiceToTextHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  useEffect(() => {
    // Check browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();

      // Configure recognition
      recognitionRef.current.continuous = options.continuous ?? false;
      recognitionRef.current.interimResults = options.interimResults ?? true;
      recognitionRef.current.lang = options.lang ?? "en-IN";

      // Event handlers
      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
        finalTranscriptRef.current = "";
      };

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscriptRef.current += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscriptRef.current + interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setError(event.error);
        setIsListening(false);

        // Handle specific errors
        switch (event.error) {
          case "no-speech":
            setError("No speech detected. Please try again.");
            break;
          case "audio-capture":
            setError("Audio capture failed. Please check your microphone.");
            break;
          case "not-allowed":
            setError(
              "Microphone access denied. Please allow microphone permissions."
            );
            break;
          case "service-not-allowed":
            setError("Speech service not allowed.");
            break;
          default:
            setError("Speech recognition error occurred.");
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setTranscript(finalTranscriptRef.current);
      };
    } else {
      setIsSupported(false);
      setError("Speech recognition not supported in this browser.");
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [options.continuous, options.interimResults, options.lang]);

  const startListening = () => {
    if (!isSupported) {
      setError("Speech recognition not supported");
      return;
    }

    if (recognitionRef.current) {
      try {
        finalTranscriptRef.current = "";
        setTranscript("");
        recognitionRef.current.start();
      } catch (err) {
        console.error("Error starting speech recognition:", err);
        setError("Failed to start speech recognition");
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const resetTranscript = () => {
    setTranscript("");
    finalTranscriptRef.current = "";
    setError(null);
  };

  return {
    isListening,
    transcript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
};
