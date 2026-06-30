import { Shield, Loader2 } from "lucide-react";

interface MfaStepProps {
  loading: boolean;
  mfaCode: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  locale: "vi" | "en";
}

export function MfaStep({ loading, mfaCode, onChange, onSubmit, onCancel, locale }: MfaStepProps) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
        <Shield size={24} className="text-gov-blue mx-auto mb-2" />
        <p className="text-gov-blue font-bold text-sm">
          {locale === "vi" ? "Xác thực 2 bước (MFA)" : "Two-factor Authentication"}
        </p>
        <p className="text-xs text-ink-soft mt-1">
          {locale === "vi"
            ? "Nhập mã 6 số từ ứng dụng xác thực của bạn."
            : "Enter the 6-digit code from your authenticator app."}
        </p>
      </div>

      <div>
        <label className="block text-sm font-bold mb-2" htmlFor="mfa-code">
          {locale === "vi" ? "Mã xác thực" : "Verification code"}
        </label>
        <input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          value={mfaCode}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
          maxLength={6}
          className="w-full min-h-[52px] px-4 rounded-xl border-2 border-slate-200 text-base focus:border-gov-blue outline-none text-center text-2xl tracking-[0.5em] font-mono bg-white transition-colors"
          placeholder="000000"
          autoFocus
          autoComplete="one-time-code"
        />
      </div>

      <button
        type="submit"
        disabled={loading || mfaCode.length !== 6}
        className="btn-civic btn-civic-primary w-full text-base min-h-[52px] disabled:opacity-50 rounded-xl"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : null}
        {locale === "vi" ? "Xác nhận" : "Verify"}
      </button>

      <button
        type="button"
        onClick={onCancel}
        className="btn-civic btn-civic-ghost w-full rounded-xl"
      >
        {locale === "vi" ? "← Quay lại" : "← Back"}
      </button>
    </form>
  );
}
