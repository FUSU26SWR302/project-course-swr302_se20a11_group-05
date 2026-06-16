/**
 * _auth.police.tsx — Police & Traffic Agency Dashboard Route Wrapper
 *
 * Optimized to be a thin TanStack Router wrapper.
 * All layouts, OCR tracking sparklines, daily statistics, and priority incident cards
 * are cleanly managed inside "@/features/police/PoliceDashboard".
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { Role } from "@/lib/roles";
import { PoliceDashboard } from "@/features/police/PoliceDashboard";

export const Route = createFileRoute("/_auth/police")({
  beforeLoad: ({ context }) => {
    const { currentUser } = context as { currentUser: { role: string } };

    // SECURITY check: Ensure that only the POLICE role is allowed to access the dashboard.
    if (currentUser.role !== Role.POLICE) {
      throw redirect({ to: "/login", search: { error: "forbidden" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Cổng Công an & CSGT — Đà Nẵng Kết Nối" },
      { name: "description", content: "Cổng dành cho lực lượng Công an, CSGT, PCCC — giám sát giao thông và an ninh." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PoliceDashboard,
});
