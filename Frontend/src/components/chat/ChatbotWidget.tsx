import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Mic,
  MapPin,
  Trash2,
  Maximize2,
  Minimize2,
  User,
  Camera,
  ArrowRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useChatbot } from "@/hooks/useChatbot";
import { AiTracePanel } from "./AiTracePanel";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import logoUrl from "@/assets/logo.png";

const SUGGESTED_QUESTIONS = [
  "Báo cáo kẹt xe ở cầu Rồng",
  "Làm thủ tục cấp Căn cước công dân ở đâu?",
  "Tra cứu tiến độ phản ánh FB-1234",
  "Hướng dẫn nộp phạt vi phạm giao thông",
];

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechRecognitionLike = {
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  start: () => void;
};

type SpeechRecognitionResultEventLike = {
  results: ArrayLike<{
    [index: number]: {
      transcript: string;
    };
  }>;
};

type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState("");
  const { messages, isLoading, petState, sendMessage, setMessages, isMuted, setIsMuted } =
    useChatbot();
  const [isListening, setIsListening] = useState(false);
  const [showTrace, setShowTrace] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Tự động co giãn textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleSubmit = (e?: React.FormEvent, textOverride?: string) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() || isLoading) return;
    sendMessage(textToSend);
    if (!textOverride) {
      setInputText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSpeechToText = () => {
    const speechWindow = window as SpeechRecognitionWindow;
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => prev + (prev ? " " : "") + transcript);
    };

    recognition.start();
  };

  // Xác định màu sắc khung chat dựa trên cảm xúc của tin nhắn AI gần nhất
  let chatBgColor = "bg-white/95";
  let headerBgColor = "bg-gradient-to-r from-gov-blue to-gov-blue-deep";
  let headerShadow = "shadow-lg shadow-gov-blue/20";

  if (messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === "assistant" && lastMsg.intent?.emotion) {
      const emotion = lastMsg.intent.emotion;
      if (emotion === "NEGATIVE") {
        chatBgColor = "bg-orange-50/95";
        headerBgColor = "bg-gradient-to-r from-amber-600 to-orange-500";
        headerShadow = "shadow-lg shadow-orange-500/20";
      } else if (emotion === "POSITIVE") {
        chatBgColor = "bg-emerald-50/95";
        headerBgColor = "bg-gradient-to-r from-emerald-600 to-teal-500";
        headerShadow = "shadow-lg shadow-emerald-500/20";
      } else if (emotion === "NEUTRAL") {
        chatBgColor = "bg-white/95";
        headerBgColor = "bg-gradient-to-r from-gov-blue to-gov-blue-deep";
        headerShadow = "shadow-lg shadow-gov-blue/20";
      }
    }
  }

  return (
    <>
      {/* Nút bấm nổi */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 text-white rounded-full flex items-center justify-center transition-all duration-300 z-50 hover:scale-110 active:scale-95 ${headerBgColor} ${!isOpen ? "animate-civic-pulse shadow-xl" : "shadow-lg"}`}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform rotate-90" />
        ) : (
          <MessageSquare className="w-6 h-6" />
        )}
      </button>

      {/* Dragon Pet */}
      {isOpen && (
        <div
          className={`dragon-pet ${petState} flex flex-col items-center pointer-events-none drop-shadow-2xl`}
        >
          <div className="text-6xl filter drop-shadow-lg">🐉</div>
          {petState === "speaking" && (
            <div className="absolute -top-4 -right-2 text-2xl animate-bounce drop-shadow-md">
              🎵
            </div>
          )}
          {petState === "typing" && (
            <div className="absolute -top-4 -right-2 text-xl animate-pulse">💭</div>
          )}
        </div>
      )}

      {/* Cửa sổ Chat */}
      {isOpen && (
        <div
          className={`fixed right-6 bottom-24 rounded-2xl flex flex-col overflow-hidden z-50 animate-fade-in-up border border-white/20 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 ${
            isExpanded ? "w-[600px] h-[80vh]" : "w-[400px] h-[600px]"
          }`}
        >
          {/* Header */}
          <div
            className={`${headerBgColor} ${headerShadow} text-white p-4 flex justify-between items-center transition-all duration-500 relative overflow-hidden flex-shrink-0`}
          >
            {/* Hiệu ứng tia sáng chéo */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[slideProgress_3s_infinite_linear]" />

            <div className="flex items-center gap-3 relative z-10">
              <div
                className="relative w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer select-none border border-white/30 shadow-inner overflow-hidden"
                onDoubleClick={() => setShowTrace(!showTrace)}
                title="Nhấp đúp để xem AI Trace"
              >
                <img src={logoUrl} alt="Logo" className="w-9 h-9 object-contain" />
                {/* Dấu chấm Online */}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-lg tracking-tight drop-shadow-md">Bé Rồng</h3>
                <p className="text-xs text-blue-50/90 font-medium">Trợ lý ảo Thông minh Đà Nẵng</p>
              </div>
            </div>

            {/* Header Tools */}
            <div className="flex items-center gap-1 relative z-10">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title={isMuted ? "Bật phát âm" : "Tắt phát âm"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setMessages([])}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Xóa lịch sử chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title={isExpanded ? "Thu nhỏ" : "Phóng to"}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Tin nhắn */}
          <div
            className={`flex-1 p-4 overflow-y-auto ${chatBgColor} space-y-6 transition-colors duration-500 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent`}
          >
            {messages.length === 0 && (
              <div className="animate-scale-in flex flex-col items-center mt-6">
                <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mb-4 p-3 relative">
                  <div className="absolute inset-0 bg-gov-gold/20 rounded-full animate-ping opacity-75"></div>
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain relative z-10"
                  />
                </div>
                <div className="text-center text-slate-600 text-sm bg-white/70 px-5 py-3 rounded-2xl backdrop-blur-md border border-white shadow-sm max-w-[85%] leading-relaxed">
                  Dạ em chào cô chú! Em là <b>Bé Rồng</b>. <br />
                  Cô chú cần tra cứu thủ tục, pháp luật hay báo cáo sự cố gì hôm nay ạ?
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col animate-slide-in-right ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div className="flex gap-2 max-w-[90%] items-end">
                  {/* Avatar Bot */}
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0 mb-1 overflow-hidden">
                      <img src={logoUrl} alt="Bot" className="w-6 h-6 object-contain" />
                    </div>
                  )}

                  <div className="flex flex-col">
                    <div
                      className={`p-3.5 rounded-2xl shadow-sm ${
                        msg.role === "user"
                          ? `bg-gradient-to-tr from-gov-blue to-blue-500 text-white rounded-br-sm transition-all duration-300 hover:shadow-md`
                          : msg.isError
                            ? "bg-red-50 text-red-600 border border-red-100 rounded-bl-sm"
                            : "bg-white text-slate-800 border border-slate-100 rounded-bl-sm"
                      }`}
                    >
                      {msg.role === "assistant" && !msg.isError ? (
                        <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-headings:text-gov-blue prose-a:text-blue-600">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span
                      className={`text-[10px] text-slate-400 mt-1 px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}
                    >
                      {new Date(parseInt(msg.id) || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Avatar User */}
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 mb-1">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                </div>

                {/* Generative UI Components (Mini Cards) */}
                {msg.intent?.intent === "CREATE_FEEDBACK" && (
                  <div className="mt-2 ml-10 w-full max-w-[85%] bg-white rounded-xl border border-slate-100 shadow-sm p-3 flex flex-col gap-2">
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                      📋 Thông tin Phản ánh
                    </div>
                    {msg.intent.category && (
                      <div className="text-sm flex items-center gap-2">
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                          Lĩnh vực
                        </span>
                        <span className="text-slate-800">{msg.intent.category}</span>
                      </div>
                    )}
                    {msg.intent.location && (
                      <div className="text-sm flex items-start gap-2 bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-100">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="flex-1">{msg.intent.location}</span>
                      </div>
                    )}

                    {/* Hành động tiếp theo */}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.intent.needsMoreInfo?.includes("LOCATION") && (
                        <button className="text-xs bg-gov-blue/5 text-gov-blue px-3 py-1.5 rounded-lg border border-gov-blue/20 hover:bg-gov-blue hover:text-white transition-colors flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5" /> Thêm Địa chỉ
                        </button>
                      )}
                      {msg.intent.needsMoreInfo?.includes("IMAGE") && (
                        <button className="text-xs bg-gov-blue/5 text-gov-blue px-3 py-1.5 rounded-lg border border-gov-blue/20 hover:bg-gov-blue hover:text-white transition-colors flex items-center gap-1 font-medium">
                          <Camera className="w-3.5 h-3.5" /> Tải ảnh lên
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Chế độ minh bạch AI */}
                {showTrace && msg.intent && (
                  <div className="mt-2 ml-10 w-full max-w-[85%]">
                    <AiTracePanel intent={msg.intent} latency={msg.latency} />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={logoUrl} alt="Bot" className="w-6 h-6 object-contain opacity-50" />
                </div>
                <div className="bg-white/90 backdrop-blur-md border border-slate-100 p-3.5 rounded-2xl rounded-bl-sm flex items-center space-x-1.5 shadow-sm">
                  <div className="w-2 h-2 bg-gov-blue/60 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gov-blue/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gov-blue/60 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  ></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions Carousel (Chỉ hiện khi chưa chat hoặc bot hỏi) */}
          {!isLoading &&
            (messages.length === 0 ||
              (messages.length > 0 &&
                messages[messages.length - 1].role === "assistant" &&
                messages[messages.length - 1].intent?.intent === "SMALLTALK")) && (
              <div className="px-3 pb-2 pt-1 flex gap-2 overflow-x-auto scrollbar-none snap-x bg-white/50 backdrop-blur-sm border-t border-slate-50">
                {SUGGESTED_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSubmit(undefined, q)}
                    className="snap-start flex-shrink-0 text-xs bg-white text-slate-600 border border-slate-200 px-3 py-2 rounded-xl hover:border-gov-blue hover:text-gov-blue transition-colors flex items-center gap-1 shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

          {/* Ô nhập liệu */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="p-3 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-end gap-2 relative z-10"
          >
            <button
              type="button"
              onClick={handleSpeechToText}
              className={`p-2.5 rounded-full transition-all duration-300 flex-shrink-0 mb-1 ${
                isListening
                  ? "bg-red-50 text-red-500 animate-pulse ring-2 ring-red-200"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-gov-blue"
              }`}
              title="Nhập bằng giọng nói"
            >
              <Mic className="w-5 h-5" />
            </button>
            <div className="flex-1 relative group bg-slate-50/50 border border-slate-200 rounded-2xl transition-all focus-within:bg-white focus-within:border-gov-gold/50 focus-within:ring-2 focus-within:ring-gov-gold/20 shadow-inner">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi Bé Rồng bất cứ điều gì..."
                className="w-full bg-transparent outline-none resize-none px-4 py-3 text-sm min-h-[44px] max-h-[120px] scrollbar-thin scrollbar-thumb-slate-200"
                rows={1}
                disabled={isLoading || isListening}
              />
            </div>
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-3 text-white rounded-xl flex-shrink-0 disabled:opacity-50 disabled:scale-100 transition-all duration-300 hover:scale-105 active:scale-95 shadow-md mb-1 ${
                inputText.trim() ? headerBgColor : "bg-slate-200"
              }`}
            >
              <Send className={`w-5 h-5 ${!inputText.trim() && "text-slate-400"}`} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
