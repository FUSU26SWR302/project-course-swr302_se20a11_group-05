import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ApiError } from "@/lib/api";
import { useRegisterMutation } from "@/lib/hooks";
import {
  UserPlus,
  Loader2,
  AtSign,
  Lock,
  Mail,
  Phone,
  Zap,
  MessageSquare,
  Eye,
  EyeOff,
  Shield,
  User,
} from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logoUrl from "@/assets/logo.png";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Đăng ký — Đà Nẵng Kết Nối" },
      { name: "description", content: "Đăng ký tài khoản công dân để gửi phản ánh." },
    ],
  }),
  component: RegisterPage,
});

const registerSchema = z.object({
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 ký tự"),
  fullName: z.string().min(1, "Họ và tên là bắt buộc"),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/\d/, "Mật khẩu phải có ít nhất 1 chữ số"),
  email: z.string().min(1, "Email là bắt buộc").email("Email không hợp lệ"),
  phone: z
    .string()
    .min(1, "Số điện thoại là bắt buộc")
    .regex(/^(\+84|0)[3-9]\d{8}$/, "Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function PasswordStrengthIndicator({ password }: { password: string }) {
  const { locale } = useI18n();

  const checks = [
    { label: "≥8 ký tự", passed: password.length >= 8 },
    { label: "Chữ hoa", passed: /[A-Z]/.test(password) },
    { label: "Chữ thường", passed: /[a-z]/.test(password) },
    { label: "Chữ số", passed: /\d/.test(password) },
  ];

  const passedCount = checks.filter((c) => c.passed).length;
  const activeSegmentClass =
    passedCount <= 1 ? "bg-red-300" : passedCount === 2 ? "bg-amber-400" : "bg-green-500";

  const strengthLabel =
    password.length === 0
      ? ""
      : passedCount <= 1
        ? locale === "vi"
          ? "Yếu"
          : "Weak"
        : passedCount === 2
          ? locale === "vi"
            ? "Trung bình"
            : "Medium"
          : locale === "vi"
            ? "Mạnh"
            : "Strong";

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1.5">
        {checks.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-200 ${
              password.length === 0
                ? "bg-gray-200"
                : i < passedCount
                  ? activeSegmentClass
                  : "bg-gray-200"
            }`}
          />
        ))}
      </div>
      {password.length > 0 && <p className="text-xs text-muted-foreground">{strengthLabel}</p>}
    </div>
  );
}

function RegisterPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const registerMutation = useRegisterMutation();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      fullName: "",
      password: "",
      email: "",
      phone: "",
    },
  });

  const watchedPassword = form.watch("password");

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      await registerMutation.mutateAsync({
        username: values.username,
        password: values.password,
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phone,
      });
      toast.success(locale === "vi" ? "Đăng ký thành công!" : "Registration successful!", {
        description:
          locale === "vi"
            ? "Đang chuyển hướng đến trang xác thực OTP..."
            : "Redirecting to OTP verification...",
      });
      setTimeout(() => {
        navigate({ to: "/verify-otp", search: { phone: values.phone } });
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error(
          locale === "vi"
            ? "Lỗi kết nối. Backend chưa chạy?"
            : "Connection error. Backend running?",
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row animate-fade-in">
      {/* ══ LEFT — Hero Panel ══════════════════════════════════════ */}
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

      {/* ══ RIGHT — Form Panel ═════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#f4f7fa" }}>
        {/* Mobile logo (shown only on small screens) */}
        <div className="flex lg:hidden items-center gap-3 px-6 pt-8 pb-4">
          <img src={logoUrl} alt="Đà Nẵng Kết Nối" className="h-10 w-auto object-contain" />
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-sm">
            {/* Tabs: Đăng nhập / Đăng ký */}
            <div className="flex gap-6 mb-8 border-b border-slate-200">
              <Link
                to="/login"
                className="pb-3 text-base font-medium border-b-2 border-transparent text-ink-soft hover:text-ink -mb-px transition-colors"
              >
                {locale === "vi" ? "Đăng nhập" : "Sign in"}
              </Link>
              <button
                type="button"
                className="pb-3 text-base font-bold border-b-2 border-gov-blue text-gov-blue -mb-px transition-colors"
              >
                {locale === "vi" ? "Đăng ký" : "Register"}
              </button>
            </div>

            {/* Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                {/* Username field */}
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="relative">
                        <AtSign
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <Input
                          placeholder={locale === "vi" ? "Tên đăng nhập" : "Username"}
                          className="w-full min-h-[52px] pl-10 pr-4 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue focus-visible:ring-0 outline-none transition-colors placeholder:text-slate-400"
                          {...field}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Full Name field */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="relative">
                        <User
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <Input
                          placeholder={locale === "vi" ? "Họ và tên" : "Full name"}
                          className="w-full min-h-[52px] pl-10 pr-4 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue focus-visible:ring-0 outline-none transition-colors placeholder:text-slate-400"
                          {...field}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email field */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="relative">
                        <Mail
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <Input
                          type="email"
                          placeholder={locale === "vi" ? "Email" : "Email"}
                          className="w-full min-h-[52px] pl-10 pr-4 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue focus-visible:ring-0 outline-none transition-colors placeholder:text-slate-400"
                          {...field}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone field */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="relative">
                        <Phone
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <Input
                          type="tel"
                          placeholder={locale === "vi" ? "Số điện thoại" : "Phone number"}
                          className="w-full min-h-[52px] pl-10 pr-4 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue focus-visible:ring-0 outline-none transition-colors placeholder:text-slate-400"
                          {...field}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Password field */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <div className="relative">
                        <Lock
                          size={16}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder={locale === "vi" ? "Mật khẩu" : "Password"}
                          className="w-full min-h-[52px] pl-10 pr-12 rounded-xl border-2 border-slate-200 bg-white text-base focus:border-gov-blue focus-visible:ring-0 outline-none transition-colors placeholder:text-slate-400"
                          {...field}
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
                      <PasswordStrengthIndicator password={watchedPassword} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={registerMutation.isPending}
                  className="w-full min-h-[52px] rounded-xl text-base font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                  style={{ background: "linear-gradient(135deg, #00387b 0%, #00264d 100%)" }}
                >
                  {registerMutation.isPending && <Loader2 size={18} className="animate-spin" />}
                  {locale === "vi" ? "Đăng ký ngay →" : "Register Now →"}
                </button>
              </form>
            </Form>
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
