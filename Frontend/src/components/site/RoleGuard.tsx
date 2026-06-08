import { Link } from "@tanstack/react-router";
import { ShieldAlert, LogIn, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL, type Role } from "@/lib/roles";
import { useI18n } from "@/lib/i18n";
import type { ReactNode } from "react";

interface Props {
  roles: Role[];
  children: ReactNode;
}

export function RoleGuard({ roles, children }: Props) {
  const { user } = useAuth();
  const { locale } = useI18n();

  if (user && roles.includes(user.role)) return <>{children}</>;

  const required = roles.map((r) => ROLE_LABEL[r][locale]).join(" · ");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="card-civic max-w-lg w-full p-8 md:p-10 text-center border-t-4 border-gov-gold">
        <div className="mx-auto w-16 h-16 rounded-full bg-gov-blue/10 grid place-items-center mb-5">
          <ShieldAlert className="text-gov-blue" size={32} />
        </div>
        <h1 className="font-heading text-2xl md:text-3xl text-gov-blue mb-2">
          {locale === "vi" ? "Khu vực hạn chế" : "Restricted area"}
        </h1>
        <p className="text-ink-soft mb-1">
          {locale === "vi"
            ? "Trang này chỉ dành cho cán bộ có thẩm quyền."
            : "This portal is restricted to authorized personnel."}
        </p>
        <p className="text-sm text-ink-soft mb-6">
          <span className="font-semibold text-ink">
            {locale === "vi" ? "Vai trò yêu cầu:" : "Required role:"}
          </span>{" "}
          {required}
        </p>
        {user ? (
          <div className="text-sm text-ink-soft mb-6">
            {locale === "vi" ? "Bạn đang đăng nhập như" : "Signed in as"}{" "}
            <span className="font-semibold text-ink">{user.name}</span> ·{" "}
            <span className="uppercase tracking-wider text-xs text-gov-gold font-bold">
              {ROLE_LABEL[user.role][locale]}
            </span>
          </div>
        ) : null}
        <Link to={"/login" as any} className="btn-civic btn-civic-primary w-full">
          <Lock size={18} />
          {locale === "vi" ? "Chuyển đến trang Đăng nhập" : "Go to Login"}
        </Link>
        <Link to="/" className="block mt-3 text-sm text-gov-blue font-semibold hover:underline">
          {locale === "vi" ? "← Về trang chủ" : "← Back to home"}
        </Link>
      </div>
    </div>
  );
}
