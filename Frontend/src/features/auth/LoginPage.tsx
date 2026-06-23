import { useEffect, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { AUTHORITY_ROLES, parseBackendRole, Role } from "@/lib/roles";
import { authApi, ApiError } from "@/lib/api";
import { requestCurrentGpsLocation } from "@/lib/location";
import {
  buildLoginLockoutMessage,
  getLoginLockoutSeconds,
} from "@/lib/loginLockout";
import { Loader2, AlertCircle, Eye, EyeOff, AtSign, Lock } from "lucide-react";
import logoUrl from "@/assets/logo.png";
import { LoginHeroPanel } from "./LoginHeroPanel";
import { MfaStep } from "./MfaStep";

/* ── Google icon SVG (inline) ───────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginPage() {
  const { locale } = useI18n();
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect, error: authError } = useSearch({ from: "/login" });

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const citizenPortalError =
    locale === "vi"
      ? "Tai khoan nay khong ton tai."
      : "This account does not exist.";

  const citizenRedirect =
    redirect && !["/ward", "/police", "/city-admin", "/assistant"].some((path) => redirect.startsWith(path))
      ? redirect
      : "/";

  useEffect(() => {
    if (lockoutSeconds === null) return;
    if (lockoutSeconds <= 0) {
      setLockoutSeconds(null);
      setError(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setLockoutSeconds((seconds) => (seconds === null ? null : Math.max(0, seconds - 1)));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [lockoutSeconds]);

  const clearLoginError = () => {
    setError(null);
    setLockoutSeconds(null);
  };

  const visibleError =
    lockoutSeconds !== null && lockoutSeconds > 0
      ? buildLoginLockoutMessage(lockoutSeconds)
      : error;

  // ─── Handlers ────────────────────────────────────────────────

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();
    setLoading(true);

    try {
      const data = await authApi.login(username, password);

      if ("mfaRequired" in data && data.mfaRequired) {
        setMfaRequired(true);
        setLoading(false);
        return;
      }

      if ("token" in data && data.token) {
        const role = parseBackendRole(data.role);
        if (AUTHORITY_ROLES.has(role)) {
          setError(citizenPortalError);
          setLoading(false);
          return;
        }

        login({
          name: data.username,
          role,
          org: data.org || "",
          token: data.token,
        });
        void requestCurrentGpsLocation().catch(() => {
          // Location is optional after login; feedback submission asks again if needed.
        });
        navigate({ to: citizenRedirect });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setLockoutSeconds(getLoginLockoutSeconds(err.message) ?? 60);
          setError(err.message);
          return;
        }

        setError(
          err.status === 401
            ? locale === "vi"
              ? "Số điện thoại hoặc mật khẩu không đúng."
              : "Incorrect phone number or password."
            : err.message,
        );
      } else {
        // Demo fallback when backend is offline
        login({ name: username || "citizen1", role: Role.CITIZEN, org: "", token: "demo-token" });
        navigate({ to: citizenRedirect });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();
    setLoading(true);

    try {
      const data = await authApi.mfaVerify(username, password, mfaCode);
      const role = parseBackendRole(data.role);
      if (AUTHORITY_ROLES.has(role)) {
        setError(citizenPortalError);
        return;
      }

      login({
        name: data.username,
        role,
        org: data.org || "",
        token: data.token,
      });
      void requestCurrentGpsLocation().catch(() => {
        // Location is optional after login; feedback submission asks again if needed.
      });
      navigate({ to: citizenRedirect });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? locale === "vi"
            ? "Mã xác thực không đúng."
            : "Invalid verification code."
          : locale === "vi"
            ? "Lỗi kết nối. Vui lòng thử lại."
            : "Connection error. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Starry Hero Panel */}
      <LoginHeroPanel locale={locale} />

      {/* Form Panel */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#f4f7fa" }}>
        {/* Mobile logo (shown only on small screens) */}
        <div className="flex lg:hidden items-center gap-3 px-6 pt-8 pb-4">
          <img src={logoUrl} alt="Đà Nẵng Kết Nối" className="h-10 w-auto object-contain" />
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm">
            {/* Tabs: Đăng nhập / Đăng ký */}
            {!mfaRequired && (
              <div className="flex gap-6 mb-8 border-b border-slate-200">
                <button
                  type="button"
                  className="pb-3 text-base font-bold border-b-2 border-gov-blue text-gov-blue -mb-px transition-colors"
                >
                  {locale === "vi" ? "Đăng nhập" : "Sign in"}
                </button>
                <Link
                  to="/register"
                  className="pb-3 text-base font-medium border-b-2 border-transparent text-ink-soft hover:text-ink -mb-px transition-colors"
                >
                  {locale === "vi" ? "Đăng ký" : "Register"}
                </Link>
              </div>
            )}

            {/* Access-denied error */}
            {(authError === "forbidden" || authError === "login_required") && !visibleError && (
              <div className="mb-5 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 text-amber-800">
                <AlertCircle size={16} className="shrink-0" />
                <span className="text-sm">
                  {authError === "login_required"
                    ? locale === "vi"
                      ? "Vui lòng đăng nhập để gửi phản ánh sự cố."
                      : "Please log in to submit a feedback report."
                    : locale === "vi"
                      ? "Vui lòng đăng nhập để tiếp tục."
                      : "Please sign in to continue."}
                </span>
              </div>
            )}

            {/* Generic error */}
            {visibleError && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span className="text-sm">{visibleError}</span>
              </div>
            )}

            {/* MFA Verification Form */}
            {mfaRequired ? (
              <MfaStep
                loading={loading}
                mfaCode={mfaCode}
                onChange={setMfaCode}
                onSubmit={handleMfaVerify}
                onCancel={() => {
                  setMfaRequired(false);
                  setMfaCode("");
                  clearLoginError();
                }}
                locale={locale}
              />
            ) : (
              /* Citizen standard login form */
              <form className="space-y-4" onSubmit={handleLogin}>
                {/* Username with icon */}
                <div className="relative">
                  <AtSign
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="login-phone"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      clearLoginError();
                    }}
                    className="w-full min-h-[52px] pl-10 pr-4 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue outline-none transition-colors placeholder:text-slate-400"
                    placeholder={locale === "vi" ? "Email hoặc Tên đăng nhập" : "Email or Username"}
                    autoComplete="username"
                    required
                  />
                </div>

                {/* Password with icon and show/hide toggle */}
                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full min-h-[52px] pl-10 pr-12 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue outline-none transition-colors placeholder:text-slate-400"
                    placeholder={locale === "vi" ? "Mật khẩu" : "Password"}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink p-1 transition-colors"
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Remember me and Forgot password options */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-gov-blue focus:ring-gov-blue accent-gov-blue"
                    />
                    <span className="text-xs text-ink-soft">
                      {locale === "vi" ? "Ghi nhớ đăng nhập" : "Remember me"}
                    </span>
                  </label>
                  <Link to="/login" className="text-xs font-semibold text-gov-blue hover:underline">
                    {locale === "vi" ? "Quên mật khẩu?" : "Forgot password?"}
                  </Link>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="w-full min-h-[52px] rounded-xl text-base font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #00387b 0%, #00264d 100%)" }}
                >
                  {loading && <Loader2 size={18} className="animate-spin" />}
                  {locale === "vi" ? "Tiếp tục →" : "Continue →"}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                    {locale === "vi" ? "Hoặc đăng nhập với" : "Or continue with"}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Google Sign In Option */}
                <button
                  type="button"
                  onClick={() => {
                    // Google OAuth placeholder
                  }}
                  className="w-full min-h-[52px] rounded-xl border-2 border-slate-200 bg-white text-sm font-semibold text-ink hover:border-gov-blue hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  <GoogleIcon />
                  {locale === "vi" ? "Tiếp tục với Google" : "Continue with Google"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 pb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img
              src={logoUrl}
              alt=""
              className="h-6 w-auto object-contain opacity-50"
              aria-hidden="true"
            />
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            © {new Date().getFullYear()}{" "}
            <a
              href="https://danang.gov.vn"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gov-blue hover:underline"
            >
              {locale === "vi" ? "UBND Thành phố Đà Nẵng" : "Da Nang People's Committee"}
            </a>
            {" · "}
            <span className="text-slate-400">
              {locale === "vi" ? "Trung tâm Chuyển đổi số" : "Digital Transformation Center"}
            </span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {locale === "vi"
              ? "Đà Nẵng Kết Nối — Citizen-Staff Connection · SWP391 SE20A11"
              : "Da Nang Connects — Citizen-Staff Connection · SWP391 SE20A11"}
          </p>
        </footer>
      </div>
    </div>
  );
}
