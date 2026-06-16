/**
 * login.tsx — Citizen Portal Login Wrapper Route
 *
 * This route has been optimized to be a thin configuration wrapper.
 * All UI implementation details, forms, states, and styles are maintained
 * inside "@/features/auth/LoginPage".
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/features/auth/LoginPage";
import { getToken } from "@/lib/api";
import { parseBackendRole, Role } from "@/lib/roles";

type LoginSearch = {
  redirect?: string;
  error?: string;
};

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): LoginSearch => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
    error: typeof s.error === "string" ? s.error : undefined,
  }),
  beforeLoad: async ({ search }) => {
    const token = typeof window !== "undefined" ? getToken() : null;
    const raw = typeof window !== "undefined" ? localStorage.getItem("dn_auth_user_v2") : null;

    if (token && raw) {
      let user: { role: string } | null = null;
      try { user = JSON.parse(raw); } catch { /* ignore */ }
      if (user) {
        const role = parseBackendRole(user.role);
        if (role === Role.CITIZEN) {
          throw redirect({ to: search.redirect || "/" });
        }
      }
    }
  },
  head: () => ({
    meta: [
      { title: "Đăng nhập — Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Đăng nhập để gửi và theo dõi phản ánh đô thị tại Thành phố Đà Nẵng.",
      },
    ],
  }),
  component: LoginPage,
});
