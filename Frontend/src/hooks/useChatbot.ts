import { useState, useCallback } from "react";
import { ChatInputSchema, ChatIntent, IntentSchema } from "@/lib/validations/chat.schema";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: ChatIntent;
  latency?: number;
  isError?: boolean;
}

export function useChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [petState, setPetState] = useState<'idle' | 'typing' | 'speaking'>('idle');
  const [sessionId] = useState(() => crypto.randomUUID());
  
  // Lấy trạng thái âm thanh từ localStorage, mặc định là false (bật tiếng)
  const [isMuted, setIsMutedState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem('chatbot_muted');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const setIsMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
    if (typeof window !== "undefined") {
      localStorage.setItem('chatbot_muted', JSON.stringify(muted));
    }
  }, []);

  const botSpeak = useCallback(async (text: string) => {
    if (isMuted) {
        setPetState('idle');
        return;
    }
    setPetState('speaking');
    const apiKey = import.meta.env.VITE_FPT_TTS_API_KEY;
    
    if (apiKey && apiKey !== "YOUR_FPT_API_KEY" && apiKey !== "") {
        try {
            const response = await fetch('https://api.fpt.ai/hmi/tts/v5', {
                method: 'POST',
                headers: {
                    'api-key': apiKey,
                    'voice': 'banmai',
                    'Content-Type': 'text/plain'
                },
                body: text
            });
            const data = await response.json();
            if (data.async) {
                const audio = new Audio(data.async);
                audio.onended = () => setPetState('idle');
                audio.play();
                return;
            }
        } catch (err) {
            console.error("FPT TTS Error, falling back to Web Speech", err);
        }
    }
    
    // Fallback: Web Speech API
    if ('speechSynthesis' in window) {
        // Hủy bỏ các giọng đang nói (nếu có)
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = "vi-VN";
        msg.onend = () => setPetState('idle');
        msg.onerror = () => setPetState('idle');
        window.speechSynthesis.speak(msg);
    } else {
        setPetState('idle');
    }
  }, [isMuted]);

  const sendMessage = useCallback(async (text: string) => {
    try {
      // 1. Zod Validation (Input)
      const input = ChatInputSchema.parse({
        message: text,
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      
      const requestPayload = {
          ...input,
          sessionId: sessionId
      };

      const newUserMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: input.message,
      };

      setMessages((prev) => [...prev, newUserMsg]);
      setIsLoading(true);
      setPetState('typing');

      const startTime = Date.now();

      // 2. Gọi API Backend (Spring Boot) SSE Stream
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        throw new Error("Lỗi kết nối đến máy chủ AI");
      }

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let fullText = "";
      let finalIntent: any = null;

      const newAssistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        latency: Date.now() - startTime,
      };
      
      setMessages((prev) => [...prev, newAssistantMsg]);
      setIsLoading(false); // Tắt loading, bắt đầu gõ phím

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');
        
        for (const line of lines) {
           if (line.startsWith('data:')) {
               const jsonStr = line.substring(5).trim();
               if (!jsonStr) continue;
               try {
                  const data = JSON.parse(jsonStr);
                  if (data.status === "START") {
                      finalIntent = data;
                  } else if (data.status === "DONE") {
                      // Kết thúc stream -> Bắt đầu đọc (TTS)
                      if (fullText.trim()) {
                          botSpeak(fullText);
                      } else {
                          setPetState('idle');
                      }
                  } else if (data.chunk) {
                      fullText += data.chunk;
                      setMessages((prev) => 
                        prev.map(m => m.id === newAssistantMsg.id 
                            ? { ...m, content: fullText, intent: finalIntent, latency: Date.now() - startTime } 
                            : m
                        )
                      );
                  }
               } catch (e) {
                   // Bỏ qua lỗi parse nếu chunk bị cắt ngang (hiếm khi xảy ra với JSON Object nhỏ)
               }
           }
        }
      }
    } catch (error: any) {
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Ơ mạng nhà mình hơi yếu hoặc em đang đông khách quá. Cô chú thử lại giúp em nhé! 🥺",
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      setPetState('idle');
    } finally {
      setIsLoading(false);
    }
  }, [messages, botSpeak]);

  return {
    messages,
    isLoading,
    petState,
    sendMessage,
    setMessages,
    isMuted,
    setIsMuted
  };
}
