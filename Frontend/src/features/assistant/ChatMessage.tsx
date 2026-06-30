import { User, Bot, Phone, BookOpen } from "lucide-react";
import type { Citation } from "@/types/api";

export interface Msg {
  role: "user" | "bot";
  text: string;
  provider?: string;
  latency?: number;
  hotlines?: { label: string; tel: string }[];
  citations?: Citation[];
  isLoading?: boolean;
}

interface ChatMessageProps {
  msg: Msg;
  locale: "vi" | "en";
}

export function ChatMessage({ msg, locale }: ChatMessageProps) {
  return (
    <div
      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""} ${
        msg.role === "bot" ? "animate-fade-in-up" : "animate-slide-in-right"
      }`}
    >
      <div
        className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${msg.role === "user" ? "bg-gov-gold text-gov-blue-deep" : "bg-gov-blue text-white"}`}
      >
        {msg.role === "user" ? <User size={20} /> : <Bot size={20} />}
      </div>
      <div
        className={`max-w-[80%] p-4 rounded-2xl text-base leading-relaxed ${msg.role === "user" ? "bg-gov-blue text-white rounded-tr-sm" : "bg-slate-100 text-ink rounded-tl-sm"}`}
      >
        {msg.isLoading ? (
          <div className="flex items-center gap-1.5 text-ink-soft">
            <div className="flex gap-1">
              <span
                className="w-2 h-2 rounded-full bg-gov-blue/40 animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-gov-blue/40 animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-gov-blue/40 animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
            <span className="text-sm">
              {locale === "vi" ? "AI đang xử lý..." : "AI is thinking..."}
            </span>
          </div>
        ) : (
          <>
            <p className="whitespace-pre-wrap">{msg.text}</p>
            {msg.provider && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="bg-gov-blue/10 text-gov-blue-dark px-2 py-0.5 rounded font-medium dark:bg-gov-blue/20 dark:text-blue-300">
                  {msg.provider}
                </span>
                {msg.latency && <span className="text-ink-soft/60">{msg.latency}ms</span>}
              </div>
            )}
            {/* Citations */}
            {msg.citations && msg.citations.length > 0 && (
              <div className="mt-3">
                <details className="group">
                  <summary className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft cursor-pointer hover:text-gov-blue transition-colors">
                    <BookOpen size={14} />
                    {msg.citations.length} {locale === "vi" ? "nguồn tham khảo" : "citations"}
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {msg.citations.map((c, ci) => (
                      <li
                        key={ci}
                        className="text-xs text-ink-soft bg-white/50 rounded p-2 border border-slate-100"
                      >
                        <span className="font-medium text-gov-blue">{c.source}</span>
                        <p className="mt-0.5 line-clamp-2">{c.content}</p>
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
            {/* Hotline buttons */}
            {msg.hotlines && (
              <div className="mt-3 flex flex-wrap gap-2">
                {msg.hotlines.map((h: { label: string; tel: string }) => (
                  <a
                    key={h.tel}
                    href={`tel:${h.tel}`}
                    className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-md bg-[var(--status-danger)] text-white font-bold text-sm hover:brightness-110"
                  >
                    <Phone size={16} /> {h.label} — {h.tel}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
