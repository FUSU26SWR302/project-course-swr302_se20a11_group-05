import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import { ApiError, authApi } from "@/lib/api";

export const Route = createFileRoute("/verify-otp")({
  validateSearch: (search: Record<string, unknown>): { phone?: string } => ({
    phone: search.phone as string | undefined,
  }),
  component: VerifyOtpPage,
});

function VerifyOtpPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { phone } = Route.useSearch();
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const otpString = otpArray.join("");

  useEffect(() => {
    if (!phone) {
      navigate({ to: "/register" });
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (otpString.length !== 6) {
      toast.error(locale === "vi" ? "Ma OTP phai gom 6 chu so" : "OTP must be 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      await authApi.registerConfirm(phone!, otpString);
      toast.success(
        locale === "vi" ? "Kich hoat tai khoan thanh cong!" : "Account verified successfully!",
      );
      window.setTimeout(() => {
        navigate({ to: "/login" });
      }, 1500);
    } catch (error) {
      toast.error(
        error instanceof ApiError || error instanceof Error
          ? error.message
          : locale === "vi"
            ? "Ma OTP khong chinh xac"
            : "Invalid OTP",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(60);
    try {
      await authApi.sendSmsOtp(phone!);
      toast.success(locale === "vi" ? "Đã gửi lại mã OTP!" : "OTP resent!");
    } catch {
      toast.error(locale === "vi" ? "Loi khi gui lai ma" : "Error resending OTP");
    }
  };

  if (!phone) return null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 animate-fade-in">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-8 text-center bg-gov-blue/5">
          <div className="mx-auto w-16 h-16 bg-gov-blue/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-gov-blue" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {locale === "vi" ? "Xac thuc so dien thoai" : "Verify Phone Number"}
          </h2>
          <p className="text-sm text-slate-500">
            {locale === "vi"
              ? "Ma OTP 6 so da duoc gui qua SMS den so dien thoai"
              : "A 6-digit OTP has been sent via SMS to"}
            <br />
            <strong className="text-slate-800 text-lg mt-1 block">
              {phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2")}
            </strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="p-8 space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3">
            {otpArray.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, "");
                  const nextOtp = [...otpArray];

                  if (value.length > 1) {
                    value
                      .slice(0, 6)
                      .split("")
                      .forEach((char, charIndex) => {
                        nextOtp[charIndex] = char;
                      });
                    setOtpArray(nextOtp);
                    document.getElementById(`otp-${Math.min(5, value.length - 1)}`)?.focus();
                    return;
                  }

                  nextOtp[index] = value.slice(-1);
                  setOtpArray(nextOtp);
                  if (value && index < 5) {
                    document.getElementById(`otp-${index + 1}`)?.focus();
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Backspace" && !digit && index > 0) {
                    document.getElementById(`otp-${index - 1}`)?.focus();
                  }
                }}
                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 bg-white focus:border-gov-blue focus:ring-2 focus:ring-gov-blue/20 outline-none transition-all placeholder:text-slate-200"
                placeholder="*"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || otpString.length !== 6}
            className="w-full h-14 rounded-xl text-base font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 bg-gov-blue hover:bg-gov-blue/90"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {locale === "vi" ? "Xac nhan va kich hoat" : "Verify & Activate"}
          </button>

          <div className="text-center">
            <p className="text-sm text-slate-500">
              {locale === "vi" ? "Chua nhan duoc ma? " : "Didn't receive code? "}
              <button
                type="button"
                onClick={handleResend}
                disabled={countdown > 0}
                className="font-bold text-gov-blue hover:underline disabled:opacity-50 disabled:no-underline transition-all"
              >
                {countdown > 0
                  ? locale === "vi"
                    ? `Gui lai sau ${countdown}s`
                    : `Resend in ${countdown}s`
                  : locale === "vi"
                    ? "Gui lai ma OTP"
                    : "Resend OTP"}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
