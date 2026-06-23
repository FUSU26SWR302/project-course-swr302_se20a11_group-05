/**
 * _auth.city-admin.tsx — City Leadership / Super Admin Dashboard Route Wrapper
 *
 * Optimized to be a thin TanStack Router wrapper.
 * All layouts, panels, EVN coordination states, predictive incident lists,
 * and mapping operations are cleanly managed inside "@/features/city-admin/CityAdminDashboard".
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { Role } from "@/lib/roles";
import { CityAdminDashboard } from "@/features/city-admin/CityAdminDashboard";

export const Route = createFileRoute("/_auth/city-admin")({
  beforeLoad: ({ context }) => {
    const { currentUser } = context as { currentUser?: { role: string } };

    if (!currentUser) return;

    // SECURITY check: Ensure that only SUPER_ADMIN is permitted to access the IOC dashboard.
    if (currentUser.role !== Role.SUPER_ADMIN) {
      throw redirect({ to: "/authority-login", search: { redirect: undefined, error: "forbidden" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Bảng điều hành Lãnh đạo Thành phố — Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Bảng điều hành cấp thành phố: KPI, hiệu suất phường, xuất báo cáo.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CityAdminDashboard,
});
