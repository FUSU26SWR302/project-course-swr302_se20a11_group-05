import { useState, useRef, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { ragApi, ApiError } from "@/lib/api";
import { Bot, Send, Loader2, ChevronDown } from "lucide-react";
import { ChatMessage, type Msg } from "./ChatMessage";

const SUGGESTED_QUESTIONS = [
  { vi: "Số điện thoại khẩn cấp?", en: "Emergency numbers?" },
  { vi: "Làm sao báo ổ gà?", en: "How to report pothole?" },
  { vi: "Quy trình xử lý phản ánh?", en: "Report processing flow?" },
  { vi: "Đường dây nóng 1022", en: "Hotline 1022" },
];

export function AssistantPage() {
  const { t, locale } = useI18n();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "bot",
      text: locale === "vi"
        ? "Xin chào! Tôi là Trợ lý AI nội bộ của Đà Nẵng Kết Nối. Tôi có thể hỗ trợ cán bộ giải đáp thắc mắc về thủ tục hành chính, phản ánh đô thị và tình huống khẩn cấp. Bạn cần hỗ trợ gì hôm nay?"
        : "Hello! I'm Da Nang's internal AI Assistant. I can help staff with civic procedures, urban reports, and emergencies. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // Only the initial greeting — show suggested chips
  const isNewConversation = messages.length === 1 && messages[0].role === "bot" && !messages[0].isLoading;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load saved messages from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("assistant_messages");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch {
        // ignore invalid JSON
      }
    }
  }, []);

  // Persist messages to sessionStorage on each update
  useEffect(() => {
    if (messages.length > 1) {
      sessionStorage.setItem("assistant_messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Track scroll position for scroll-to-bottom button
  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const threshold = 100;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > threshold);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const send = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || sending) return;

    setMessages((m) => [...m, { role: "user", text: userText }]);
    setInput("");
    setSending(true);
    setMessages((m) => [...m, { role: "bot", text: "", isLoading: true }]);

    try {
      const result = await ragApi.chatbot(userText, 1);
      setMessages((m) => {
        const filtered = m.filter((msg) => !msg.isLoading);
        return [
          ...filtered,
          { role: "bot", text: result.answer, provider: result.provider, latency: result.latencyMs },
        ];
      });

      // Fetch citations after stream completes
      try {
        const citationResult = await ragApi.query(userText);
        if (citationResult.citations && citationResult.citations.length > 0) {
          setMessages((m: Msg[]) => {
            const newArr = [...m];
            newArr[newArr.length - 1].citations = citationResult.citations;
            return newArr;
          });
        }
      } catch {
        // citations are optional — silently skip
      }
    } catch (err) {
      setMessages((m) => m.filter((msg) => !msg.isLoading));

      if (err instanceof ApiError) {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: locale === "vi"
              ? `⚠️ Lỗi kết nối tới AI (${err.status}). Vui lòng thử lại sau.`
              : `⚠️ AI connection error (${err.status}). Please try again later.`,
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: locale === "vi"
              ? "⚠️ Backend chưa kết nối. Đây là chế độ demo.\n\nNếu bạn cần hỗ trợ khẩn cấp, vui lòng gọi đường dây nóng 1022."
              : "⚠️ Backend is not connected. This is demo mode.\n\nFor emergencies, please call hotline 1022.",
            hotlines: [
              { label: locale === "vi" ? "Đường dây nóng 1022" : "Hotline 1022", tel: "1022" },
              { label: locale === "vi" ? "PCCC / Cứu hỏa" : "Fire/Rescue", tel: "114" },
            ],
          },
        ]);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="animate-scale-in flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-full bg-gov-blue grid place-items-center text-white">
          <Bot size={28} />
        </div>
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-gov-blue">{t("assistant.title")}</h1>
          <p className="text-ink-soft">{t("assistant.subtitle")}</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="animate-fade-in card-civic p-5 md:p-6 min-h-[400px] max-h-[60vh] overflow-y-auto space-y-4 mb-4 relative"
      >
        {messages.map((m: Msg, i: number) => (
          <ChatMessage key={i} msg={m} locale={locale} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className="animate-fade-in fixed bottom-36 right-8 z-10 w-12 h-12 rounded-full bg-gov-blue text-white shadow-lg grid place-items-center hover:bg-gov-blue-dark transition-colors"
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={24} />
        </button>
      )}

      {/* Suggested questions chips */}
      {isNewConversation && (
        <div className="animate-fade-in-up mb-4 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <button
              key={i}
              onClick={() => send(q[locale as keyof typeof q] || q.en)}
              className="px-4 py-2 rounded-full border border-gov-blue/30 text-sm text-gov-blue bg-white hover:bg-gov-blue/10 hover:border-gov-blue transition-colors"
            >
              {q[locale as keyof typeof q] || q.en}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-3">
        <input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
          placeholder={t("assistant.placeholder")}
          disabled={sending}
          className="flex-1 min-h-[52px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none bg-white disabled:opacity-50"
          aria-label="Message"
        />
        <button type="submit" disabled={sending || !input.trim()} className="btn-civic btn-civic-primary disabled:opacity-50">
          {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          {t("assistant.send")}
        </button>
      </form>
    </div>
  );
}
