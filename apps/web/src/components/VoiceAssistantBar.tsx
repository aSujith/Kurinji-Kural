import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, X, Check, AlertCircle, Sparkles, Send, Info } from "lucide-react";
import { api, VoiceTurnResult } from "../services/api";

interface VoiceProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export const VoiceAssistantBar: React.FC<VoiceProps> = ({ isOpen, onClose, onProductAdded }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [language, setLanguage] = useState<"ta-IN" | "en-IN">("ta-IN");
  const [turnResult, setTurnResult] = useState<VoiceTurnResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [micError, setMicError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);

  // Check browser support on mount
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      setMicError("Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge for live microphone speech.");
    }
  }, []);

  // Text to Speech playback
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startListening = async () => {
    setMicError(null);
    setInterimTranscript("");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      // First explicitly verify mic access
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        setMicError(null);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          setTranscript(final);
          setInterimTranscript("");
          // Automatically trigger turn when speech ends
          handleSend(final);
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setMicError("Microphone permission denied. Please click the lock or camera icon in your browser URL bar and allow microphone access.");
        } else if (event.error === "no-speech") {
          setMicError("No speech detected. Please speak closer to your microphone or try again.");
        } else if (event.error === "audio-capture") {
          setMicError("No microphone was detected. Please verify your microphone is plugged in and enabled in Windows Settings.");
        } else if (event.error === "network") {
          setMicError("Network error with speech recognition service. Please check your internet connection.");
        } else {
          setMicError(`Speech recognition issue: ${event.error}. You can also type or use the test buttons below.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error("Microphone getUserMedia error:", err);
      setIsListening(false);
      setMicError("Could not access microphone. Please ensure microphone permissions are granted in browser settings.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || transcript).trim();
    if (!query) return;

    setIsLoading(true);
    try {
      const res = await api.sendVoiceTurn(query, language, conversationId);
      setTurnResult(res);
      if (res.conversationId) setConversationId(res.conversationId);

      speakText(res.spokenResponseEnglish);

      if (res.state === "SAVED") {
        onProductAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDecision = async (decision: "YES" | "NO") => {
    if (!turnResult?.pendingAction) return;

    setIsLoading(true);
    try {
      const res = await api.confirmPendingAction(turnResult.pendingAction.id, decision, conversationId);
      setTurnResult(res);
      speakText(res.spokenResponseEnglish);

      if (res.state === "SAVED") {
        onProductAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Voice Multi-Agent Assistant</h3>
              <p className="text-xs text-green-200">Tamil & English Speech | Automatic English Inventory Updates</p>
            </div>
          </div>
          <button
            onClick={() => { stopListening(); onClose(); }}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Microphone Diagnostics / Alert Banner */}
          {micError && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-3 flex items-start space-x-2 text-xs text-red-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Microphone Notice:</span>
                <span>{micError}</span>
              </div>
            </div>
          )}

          {!isSupported && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start space-x-2 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Browser Compatibility:</span>
                <span>Web Speech API works natively in Google Chrome and Microsoft Edge. You can also type or use the quick buttons below.</span>
              </div>
            </div>
          )}

          {/* Language selector & Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                1. Select Language You Want to Speak
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setLanguage("ta-IN")}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                    language === "ta-IN" ? "bg-green-700 text-white font-bold" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  தமிழ் (Tamil)
                </button>
                <button
                  onClick={() => setLanguage("en-IN")}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                    language === "en-IN" ? "bg-green-700 text-white font-bold" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Quick Testing Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs text-stone-500 font-medium">Quick Speech Simulation (One-Click Testing):</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setTranscript("20 கிலோ மலைத்தேன் விலை 500 ரூபாய்"); handleSend("20 கிலோ மலைத்தேன் விலை 500 ரூபாய்"); }}
                  className="text-xs bg-stone-100 hover:bg-green-50 hover:text-green-800 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 transition"
                >
                  🎤 "20 கிலோ மலைத்தேன் விலை 500"
                </button>
                <button
                  onClick={() => { setTranscript("மலை மஞ்சள் 50 கிலோ விலை 170"); handleSend("மலை மஞ்சள் 50 கிலோ விலை 170"); }}
                  className="text-xs bg-stone-100 hover:bg-green-50 hover:text-green-800 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 transition"
                >
                  🎤 "மலை மஞ்சள் 50 கிலோ விலை 170"
                </button>
                <button
                  onClick={() => { setTranscript("மஞ்சள் சந்தை விலை என்ன?"); handleSend("மஞ்சள் சந்தை விலை என்ன?"); }}
                  className="text-xs bg-stone-100 hover:bg-green-50 hover:text-green-800 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 transition"
                >
                  📊 "மஞ்சள் சந்தை விலை என்ன?"
                </button>
                <button
                  onClick={() => { setTranscript("வாங்குபவர்கள் யார் இருக்கிறார்கள்?"); handleSend("வாங்குபவர்கள் யார் இருக்கிறார்கள்?"); }}
                  className="text-xs bg-stone-100 hover:bg-green-50 hover:text-green-800 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-700 transition"
                >
                  🤝 "வாங்குபவர்கள் யார்?"
                </button>
              </div>
            </div>
          </div>

          {/* Voice Input & Active Waveform Visualizer */}
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex flex-col items-center justify-center space-y-4">
            <button
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
                isListening
                  ? "bg-red-500 text-white animate-pulse ring-8 ring-red-200 scale-105"
                  : "bg-green-700 hover:bg-green-800 text-white"
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>

            {/* Audio Wave Visualizer Animation */}
            {isListening && (
              <div className="flex items-center space-x-1.5 h-6">
                <span className="w-1.5 h-3 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-5 bg-green-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-6 bg-green-600 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-4 bg-green-600 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                <span className="w-1.5 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.4s]"></span>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs font-bold text-stone-700">
                {isListening
                  ? `Listening in ${language === "ta-IN" ? "தமிழ் (Tamil)" : "English"}... Speak now!`
                  : "Tap microphone to speak or type in Tamil/English below"}
              </p>
              {interimTranscript && (
                <p className="text-xs text-green-700 font-semibold italic mt-1">
                  Hearing: "{interimTranscript}"
                </p>
              )}
            </div>

            {/* Text Input Fallback / Live View */}
            <div className="w-full flex space-x-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Spoken words appear here (or type in Tamil/English)..."
                className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !transcript.trim()}
                className="bg-green-700 disabled:opacity-50 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-1"
              >
                <Send className="w-4 h-4" />
                <span>Process</span>
              </button>
            </div>
          </div>

          {/* Turn Result & Agent Response */}
          {turnResult && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-stone-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-green-100 text-green-800 border border-green-200">
                    Agent: {turnResult.agent} ({turnResult.detectedIntent})
                  </span>
                  <button
                    onClick={() => speakText(turnResult.spokenResponseEnglish)}
                    className="text-stone-500 hover:text-green-700 flex items-center space-x-1 text-xs font-semibold"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Hear English Audio</span>
                  </button>
                </div>

                <p className="text-stone-900 font-semibold text-base mb-1">
                  {turnResult.spokenResponseEnglish}
                </p>
                {turnResult.spokenResponseTamil && (
                  <p className="text-xs text-stone-500 border-t border-stone-100 pt-2 mt-2">
                    தமிழ் வடிவம்: {turnResult.spokenResponseTamil}
                  </p>
                )}
              </div>

              {/* Strict Propose -> Confirm -> Commit Banner (Rule R1) */}
              {turnResult.state === "CONFIRMATION_REQUIRED" && turnResult.pendingAction && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">
                        Confirmation Required (Rule R1: Confirm Before Commit)
                      </h4>
                      <p className="text-xs text-amber-800 mt-1">
                        The AI translated your Tamil input into English inventory fields. Please confirm to commit to the database.
                      </p>
                    </div>
                  </div>

                  {/* Converted Item Summary Box */}
                  <div className="bg-white border border-amber-200 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-500">English Item Name:</span>
                      <span className="font-bold text-stone-900">{turnResult.pendingAction.payload.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Quantity:</span>
                      <span className="font-bold text-stone-900">
                        {turnResult.pendingAction.payload.quantity} {turnResult.pendingAction.payload.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Expected Unit Price:</span>
                      <span className="font-bold text-green-700">₹{turnResult.pendingAction.payload.expectedPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Category:</span>
                      <span className="font-bold text-stone-900">{turnResult.pendingAction.payload.category}</span>
                    </div>
                  </div>

                  {/* Yes / No Action Buttons */}
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => handleConfirmDecision("YES")}
                      disabled={isLoading}
                      className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md transition active:scale-95"
                    >
                      <Check className="w-5 h-5" />
                      <span>Confirm & Save / ஆம் உறுதி</span>
                    </button>
                    <button
                      onClick={() => handleConfirmDecision("NO")}
                      disabled={isLoading}
                      className="bg-stone-200 hover:bg-red-100 hover:text-red-700 text-stone-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center space-x-2 transition"
                    >
                      <X className="w-5 h-5" />
                      <span>Cancel / வேண்டாம்</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
