import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, X, Check, AlertCircle, Sparkles, Send, Radio, Play, Languages } from "lucide-react";
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
  const [voiceReplyLang, setVoiceReplyLang] = useState<"ta-IN" | "en-IN">("ta-IN");
  const [turnResult, setTurnResult] = useState<VoiceTurnResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [micVolume, setMicVolume] = useState<number>(0);
  const [micStatusMessage, setMicStatusMessage] = useState<string>("பேசுவதற்கு தயாராக உள்ளது (Ready to listen)");

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Tamil & English Speech Synthesis Playback
  const speakText = (text: string, lang = "ta-IN") => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.92;
      // If browser has Tamil voices, select the best matching voice
      const voices = window.speechSynthesis.getVoices();
      if (lang.startsWith("ta")) {
        const tamilVoice = voices.find((v) => v.lang.startsWith("ta") || v.name.toLowerCase().includes("tamil"));
        if (tamilVoice) utterance.voice = tamilVoice;
      }
      window.speechSynthesis.speak(utterance);
    }
  };

  // Real-time Audio Visualizer using Web Audio API
  const startAudioMeter = async (stream: MediaStream) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 64;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (e) {
      console.error("AudioContext metering error:", e);
    }
  };

  const stopAudioMeter = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setMicVolume(0);
  };

  const startListening = async () => {
    setMicStatusMessage("மைக் அனுமதி கேட்கப்படுகிறது (Requesting microphone)...");
    setInterimTranscript("");

    try {
      let stream: MediaStream | null = null;
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        startAudioMeter(stream);
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onstart = () => {
          setIsListening(true);
          setMicStatusMessage("மைக் இயக்கத்தில் உள்ளது! தமிழில் அல்லது ஆங்கிலத்தில் பேசவும்...");
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
            handleSend(final);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          stopAudioMeter();

          if (event.error === "no-speech") {
            setMicStatusMessage("குரல் கேட்கவில்லை. மைக் அருகில் பேசவும் அல்லது கீழுள்ள பொத்தானை அழுத்தவும்.");
          } else if (event.error === "not-allowed") {
            setMicStatusMessage("மைக் அனுமதி மறுக்கப்பட்டுள்ளது. Browser settings-ல் Microphone அனுமதிக்கவும்.");
          } else {
            setMicStatusMessage(`அறிவிப்பு: ${event.error}. நீங்கள் தட்டச்சு செய்யவும் பயன்படுத்தலாம்.`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
          stopAudioMeter();
        };

        recognition.start();
      } else {
        setIsListening(true);
        setMicStatusMessage("மைக் ஒலி பதிவு செய்யப்படுகிறது. (Browser-ல் கீழேயுள்ள உடனடி பொத்தான்களையும் பயன்படுத்தலாம்)");
      }
    } catch (err: any) {
      console.error("Microphone error:", err);
      setIsListening(false);
      stopAudioMeter();
      setMicStatusMessage("மைக் இயக்க முடியவில்லை. Browser settings-ல் Microphone அனுமதிக்கவும்.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
    stopAudioMeter();
    setMicStatusMessage("பேசுவது நிறுத்தப்பட்டது");
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || transcript).trim();
    if (!query) return;

    setIsLoading(true);
    try {
      const res = await api.sendVoiceTurn(query, language, conversationId);
      setTurnResult(res);
      if (res.conversationId) setConversationId(res.conversationId);

      // Reply in Tamil by default!
      const replyToSpeak = voiceReplyLang === "ta-IN" ? res.spokenResponseTamil : res.spokenResponseEnglish;
      speakText(replyToSpeak, voiceReplyLang);

      if (res.state === "SAVED") {
        onProductAdded();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerVoicePreset = (tamilAudioSpoken: string, queryText: string) => {
    setTranscript(queryText);
    speakText(tamilAudioSpoken, "ta-IN");
    handleSend(queryText);
  };

  const handleConfirmDecision = async (decision: "YES" | "NO") => {
    if (!turnResult?.pendingAction) return;

    setIsLoading(true);
    try {
      const res = await api.confirmPendingAction(turnResult.pendingAction.id, decision, conversationId);
      setTurnResult(res);

      // Reply in Tamil upon confirmation!
      const replyToSpeak = voiceReplyLang === "ta-IN" ? res.spokenResponseTamil : res.spokenResponseEnglish;
      speakText(replyToSpeak, voiceReplyLang);

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
      <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-800 to-green-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-green-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-lg">குரல் வழி உதவியாளர்</h3>
                <span className="text-xs bg-green-700 text-green-100 px-2 py-0.5 rounded-md font-semibold">
                  தமிழில் குரல் பதில்
                </span>
              </div>
              <p className="text-xs text-green-200">Speaks in Tamil | Updates English Inventory Automatically</p>
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
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Voice Response Language Switcher */}
          <div className="flex items-center justify-between bg-green-50/70 border border-green-200 p-3 rounded-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-green-900">
              <Volume2 className="w-4 h-4 text-green-700" />
              <span>உதவியாளர் பேசும் மொழி (Voice Reply Language):</span>
            </div>
            <div className="flex space-x-1.5">
              <button
                onClick={() => setVoiceReplyLang("ta-IN")}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                  voiceReplyLang === "ta-IN" ? "bg-green-700 text-white shadow-sm" : "bg-white text-stone-700 border border-stone-200"
                }`}
              >
                தமிழ் (Tamil Reply)
              </button>
              <button
                onClick={() => setVoiceReplyLang("en-IN")}
                className={`text-xs px-3 py-1 rounded-lg font-bold transition-all ${
                  voiceReplyLang === "en-IN" ? "bg-green-700 text-white shadow-sm" : "bg-white text-stone-700 border border-stone-200"
                }`}
              >
                English Reply
              </button>
            </div>
          </div>

          {/* Microphone Live Control & Audio Meter */}
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 flex flex-col items-center justify-center space-y-4 shadow-inner">
            <button
              onClick={() => isListening ? stopListening() : startListening()}
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all transform active:scale-95 ${
                isListening
                  ? "bg-red-500 text-white animate-pulse ring-8 ring-red-200 scale-105"
                  : "bg-green-700 hover:bg-green-800 text-white"
              }`}
            >
              {isListening ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
            </button>

            {/* Real Web Audio Volume Level Indicator */}
            <div className="w-full max-w-xs space-y-1">
              <div className="flex justify-between text-[11px] font-bold text-stone-500 uppercase">
                <span>மைக் ஒலி அளவு (Audio Signal)</span>
                <span className={micVolume > 15 ? "text-green-600 font-bold" : "text-stone-400"}>
                  {micVolume > 0 ? `${micVolume}% dB` : "அமைதியாக உள்ளது"}
                </span>
              </div>
              <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-75 rounded-full ${
                    micVolume > 50 ? "bg-amber-500" : micVolume > 15 ? "bg-green-600" : "bg-stone-300"
                  }`}
                  style={{ width: `${Math.max(5, micVolume)}%` }}
                />
              </div>
            </div>

            <p className="text-xs font-bold text-stone-700 text-center max-w-md">
              {micStatusMessage}
            </p>

            {interimTranscript && (
              <div className="bg-white border border-green-300 px-3 py-1.5 rounded-lg text-xs text-green-800 font-semibold animate-pulse">
                கேட்டது: "{interimTranscript}"
              </div>
            )}

            {/* Text input with language toggle */}
            <div className="w-full flex space-x-2 pt-2">
              <input
                type="text"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="நீங்கள் பேசிய வார்த்தைகள் இங்கே தோன்றும் (அல்லது தமிழில் தட்டச்சு செய்யவும்)..."
                className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={() => handleSend()}
                disabled={isLoading || !transcript.trim()}
                className="bg-green-700 disabled:opacity-50 hover:bg-green-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center space-x-1"
              >
                <Send className="w-4 h-4" />
                <span>அனுப்பு</span>
              </button>
            </div>
          </div>

          {/* Instant Voice Testing Cards (Plays Tamil Audio & Answers in Tamil) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center space-x-1">
              <Radio className="w-3.5 h-3.5 text-green-600 animate-pulse" />
              <span>குரல் வழி மாதிரி வாக்கியங்கள் (தட்டினால் தமிழில் பேசும் & பதிலளிக்கும்):</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => triggerVoicePreset("இருபது கிலோ மலைத்தேன் விலை ஐந்நூறு ரூபாய் சேர்க்க", "20 கிலோ மலைத்தேன் விலை 500 ரூபாய் சேர்க்க")}
                className="text-left bg-white hover:bg-green-50/80 border border-stone-200 hover:border-green-300 p-3 rounded-xl transition group shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">🍯</span>
                    <span className="text-xs font-bold text-stone-900 group-hover:text-green-800">
                      "20 கிலோ மலைத்தேன் விலை 500"
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block mt-0.5">20 kg Wild Honey சேர்க்கும்</span>
                </div>
                <Play className="w-4 h-4 text-stone-400 group-hover:text-green-700" />
              </button>

              <button
                onClick={() => triggerVoicePreset("ஐம்பது கிலோ மலை மஞ்சள் விலை நூற்று எழுபது ரூபாய் சேர்க்க", "மலை மஞ்சள் 50 கிலோ விலை 170")}
                className="text-left bg-white hover:bg-green-50/80 border border-stone-200 hover:border-green-300 p-3 rounded-xl transition group shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">🌿</span>
                    <span className="text-xs font-bold text-stone-900 group-hover:text-green-800">
                      "மலை மஞ்சள் 50 கிலோ விலை 170"
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block mt-0.5">50 kg Hill Turmeric சேர்க்கும்</span>
                </div>
                <Play className="w-4 h-4 text-stone-400 group-hover:text-green-700" />
              </button>

              <button
                onClick={() => triggerVoicePreset("மஞ்சள் சந்தை விலை என்ன", "மஞ்சள் சந்தை விலை என்ன?")}
                className="text-left bg-white hover:bg-green-50/80 border border-stone-200 hover:border-green-300 p-3 rounded-xl transition group shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">📊</span>
                    <span className="text-xs font-bold text-stone-900 group-hover:text-green-800">
                      "மஞ்சள் சந்தை விலை என்ன?"
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block mt-0.5">மண்டி சந்தை நிலவரம்</span>
                </div>
                <Play className="w-4 h-4 text-stone-400 group-hover:text-green-700" />
              </button>

              <button
                onClick={() => triggerVoicePreset("வாங்குபவர்கள் யார் இருக்கிறார்கள்", "வாங்குபவர்கள் யார் இருக்கிறார்கள்?")}
                className="text-left bg-white hover:bg-green-50/80 border border-stone-200 hover:border-green-300 p-3 rounded-xl transition group shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-sm">🤝</span>
                    <span className="text-xs font-bold text-stone-900 group-hover:text-green-800">
                      "வாங்குபவர்கள் யார்?"
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500 block mt-0.5">மொத்த வியாபாரிகளை காட்டும்</span>
                </div>
                <Play className="w-4 h-4 text-stone-400 group-hover:text-green-700" />
              </button>
            </div>
          </div>

          {/* Turn Result & Tamil Agent Response */}
          {turnResult && (
            <div className="space-y-4">
              <div className="bg-white border-2 border-stone-200 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-green-100 text-green-800 border border-green-200">
                    பிரிவு: {turnResult.agent} ({turnResult.detectedIntent})
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => speakText(turnResult.spokenResponseTamil, "ta-IN")}
                      className="bg-green-50 hover:bg-green-100 text-green-800 border border-green-300 px-3 py-1 rounded-lg text-xs font-bold flex items-center space-x-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>தமிழில் கேட்கவும்</span>
                    </button>
                    <button
                      onClick={() => speakText(turnResult.spokenResponseEnglish, "en-US")}
                      className="bg-stone-50 hover:bg-stone-100 text-stone-600 border border-stone-200 px-2.5 py-1 rounded-lg text-xs font-medium"
                    >
                      <span>English</span>
                    </button>
                  </div>
                </div>

                {/* Primary Tamil Response */}
                <div>
                  <span className="text-[11px] font-bold text-stone-400 block uppercase">உதவியாளரின் குரல் பதில் (Tamil Reply):</span>
                  <p className="text-stone-900 font-bold text-base leading-relaxed mt-0.5">
                    {turnResult.spokenResponseTamil}
                  </p>
                </div>

                {/* English Translation */}
                <div className="bg-stone-50 rounded-lg p-2.5 text-xs text-stone-600 border border-stone-100">
                  <span className="font-semibold text-stone-700 block">English Converted Inventory Record:</span>
                  <p className="italic mt-0.5">{turnResult.spokenResponseEnglish}</p>
                </div>
              </div>

              {/* Strict Propose -> Confirm -> Commit Banner (Rule R1) */}
              {turnResult.state === "CONFIRMATION_REQUIRED" && turnResult.pendingAction && (
                <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-900 text-sm">
                        உறுதிப்படுத்துதல் தேவை (Rule R1: Confirm Before Commit)
                      </h4>
                      <p className="text-xs text-amber-800 mt-1">
                        நீங்கள் கூறிய விவரங்கள் ஆங்கில சரக்கு பட்டியலில் சேர்க்க தயாராக உள்ளன. உறுதிப்படுத்த "ஆம் உறுதி" என கூறவும் அல்லது கீழேயுள்ள பொத்தானை அழுத்தவும்.
                      </p>
                    </div>
                  </div>

                  {/* Converted Item Summary Box */}
                  <div className="bg-white border border-amber-200 rounded-lg p-3 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-stone-500">ஆங்கில பொருள் பெயர் (English Item):</span>
                      <span className="font-bold text-stone-900">{turnResult.pendingAction.payload.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">அளவு (Quantity):</span>
                      <span className="font-bold text-stone-900">
                        {turnResult.pendingAction.payload.quantity} {turnResult.pendingAction.payload.unit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">எதிர்பார்க்கும் விலை (Price):</span>
                      <span className="font-bold text-green-700 text-sm">₹{turnResult.pendingAction.payload.expectedPrice} / {turnResult.pendingAction.payload.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">வகை (Category):</span>
                      <span className="font-bold text-stone-900">{turnResult.pendingAction.payload.category}</span>
                    </div>
                  </div>

                  {/* Yes / No Action Buttons */}
                  <div className="flex space-x-3 pt-2">
                    <button
                      onClick={() => handleConfirmDecision("YES")}
                      disabled={isLoading}
                      className="flex-1 bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-md transition active:scale-95 text-sm"
                    >
                      <Check className="w-5 h-5" />
                      <span>ஆம் உறுதி (Confirm & Save)</span>
                    </button>
                    <button
                      onClick={() => handleConfirmDecision("NO")}
                      disabled={isLoading}
                      className="bg-stone-200 hover:bg-red-100 hover:text-red-700 text-stone-700 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 transition text-sm"
                    >
                      <X className="w-5 h-5" />
                      <span>வேண்டாம் (Cancel)</span>
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
