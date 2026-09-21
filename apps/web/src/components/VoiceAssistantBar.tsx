import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, X, Check, AlertCircle, Sparkles, Send } from "lucide-react";
import { api, VoiceTurnResult } from "../services/api";

interface VoiceProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export const VoiceAssistantBar: React.FC<VoiceProps> = ({ isOpen, onClose, onProductAdded }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [language, setLanguage] = useState<"ta-IN" | "en-IN">("ta-IN");
  const [turnResult, setTurnResult] = useState<VoiceTurnResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");

  // Speech synthesis audio playback
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Browser Web Speech API setup
  useEffect(() => {
    let recognition: any = null;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition && isListening) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const text = event.results[current][0].transcript;
        setTranscript(text);
      };

      recognition.onerror = (err: any) => {
        console.error("Speech recognition error", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }

    return () => {
      if (recognition) recognition.stop();
    };
  }, [isListening, language]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || transcript;
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.sendVoiceTurn(query, language, conversationId);
      setTurnResult(res);
      if (res.conversationId) setConversationId(res.conversationId);

      // Play audio response in English
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
              <p className="text-xs text-green-200">Speaks Tamil & English | Converts & Updates Inventory in English</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Language selector & Presets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Select Spoken Language
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

            {/* Quick Simulation Presets */}
            <div className="space-y-1.5">
              <span className="text-xs text-stone-500 font-medium">Quick Voice Testing Presets (Tamil & English):</span>
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

          {/* Voice Input & Mic Control */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col items-center justify-center space-y-4">
            <button
              onClick={() => setIsListening(!isListening)}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all transform active:scale-95 ${
                isListening
                  ? "bg-red-500 text-white animate-pulse ring-8 ring-red-200"
                  : "bg-green-700 hover:bg-green-800 text-white"
              }`}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="text-xs font-semibold text-stone-600">
              {isListening ? "Listening... Speak now in Tamil or English" : "Tap microphone to speak or type below"}
            </p>

            {/* Input box */}
            <div className="w-full flex space-x-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Spoken Tamil or English will appear here..."
                className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !transcript.trim()}
                className="bg-green-700 disabled:opacity-50 hover:bg-green-800 text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-1"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
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
                    <span>Read English Audio</span>
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
                        The AI extracted your details and converted them into English inventory fields. Please confirm to commit to the database.
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
