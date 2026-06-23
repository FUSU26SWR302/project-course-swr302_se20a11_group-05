import { Link } from "@tanstack/react-router";
import logoUrl from "@/assets/logo.png";
import { Zap, MessageSquare } from "lucide-react";

interface LoginHeroPanelProps {
  locale: "vi" | "en";
}

export function LoginHeroPanel({ locale }: LoginHeroPanelProps) {
  return (
    <div
      className="hidden lg:flex lg:w-[42%] flex-col relative overflow-hidden"
      style={{
        background: "linear-gradient(155deg, #001028 0%, #001f46 45%, #00387b 100%)",
      }}
    >
      {/* Star particles */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="login-star"
            style={{
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              animationDelay: `${(i * 0.4) % 6}s`,
              animationDuration: `${4 + (i % 4)}s`,
              width: i % 3 === 0 ? "2px" : "1.5px",
              height: i % 3 === 0 ? "2px" : "1.5px",
            }}
          />
        ))}
      </div>

      {/* Radial glow */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(0,56,123,0.5) 0%, transparent 70%)" }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-10 py-10">
        {/* Back to home button */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 border border-white/20 hover:text-white hover:border-white/50 hover:bg-white/10 transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {locale === "vi" ? "Về trang chủ" : "Back to Home"}
          </Link>
        </div>

        {/* Top brand */}
        <div className="flex items-center gap-3 mb-auto">
          <img
            src={logoUrl}
            alt="Đà Nẵng Kết Nối"
            className="h-10 w-auto object-contain brightness-0 invert"
          />
          <span className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase">
            DA NANG DIGITAL CENTER
          </span>
        </div>

        {/* Main heading */}
        <div className="mb-10">
          <h1 className="font-heading text-5xl xl:text-6xl font-bold text-white leading-tight mb-4">
            {locale === "vi" ? (
              <>
                Thành Phố
                <br />
                <span style={{ color: "#d4af37" }}>Kết Nối</span>
              </>
            ) : (
              <>
                A City That
                <br />
                <span style={{ color: "#d4af37" }}>Connect</span>
              </>
            )}
          </h1>
          <p className="text-white/65 text-base leading-relaxed max-w-xs">
            {locale === "vi"
              ? "Hệ thống kết nối trực tuyến giữa chính quyền và người dân Thành phố Đà Nẵng. Vì một thành phố thông minh và bền vững."
              : "Online connection system between the government and citizens of Da Nang City. For a smart and sustainable city."}
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-3 mb-10">
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <Zap size={16} className="text-gov-gold mt-0.5 shrink-0" />
            <div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                {locale === "vi" ? "Tiện ích thông minh" : "Smart Services"}
              </p>
              <p className="text-white/50 text-xs mt-0.5">
                {locale === "vi"
                  ? "Tra cứu dịch vụ công 24/7 tức thì"
                  : "Access public services 24/7 instantly"}
              </p>
            </div>
          </div>
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{ background: "rgba(255,255,255,0.07)" }}
          >
            <MessageSquare size={16} className="text-gov-gold mt-0.5 shrink-0" />
            <div>
              <p className="text-white/80 text-xs font-bold uppercase tracking-wider">
                {locale === "vi" ? "Tương tác trực tiếp" : "Direct Interaction"}
              </p>
              <p className="text-white/50 text-xs mt-0.5">
                {locale === "vi"
                  ? "Gửi phản ánh, nhận phản hồi minh bạch"
                  : "Submit reports, get transparent feedback"}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom watermark */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.15)" }} />
          <span className="text-white/30 text-xs tracking-[0.15em] uppercase">
            DA NANG DIGITAL CENTER
          </span>
          <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>
      </div>
    </div>
  );
}
