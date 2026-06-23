/**
 * _auth.ward.tsx — Ward Staff Dashboard Route Wrapper
 *
 * Optimized to be a thin TanStack Router wrapper.
 * All layouts, category selectors, ticket assignment actions, and list panels
 * are cleanly managed inside "@/features/ward/WardDashboard".
 */

import { createFileRoute, redirect } from "@tanstack/react-router";
import { Role } from "@/lib/roles";
import { WardDashboard } from "@/features/ward/WardDashboard";

export const Route = createFileRoute("/_auth/ward")({
  beforeLoad: ({ context }) => {
    const { currentUser } = context as {
      currentUser?: {
        name: string;
        role: string;
        org: string;
        wardName?: string | null;
        wardType?: string | null;
      };
    };

    if (!currentUser) return;

    // SECURITY check: Ensure that only the WARD_STAFF role is permitted to view ward operations.
    if (currentUser.role !== Role.WARD_STAFF) {
      throw redirect({ to: "/authority-login", search: { redirect: undefined, error: "forbidden" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Cổng cán bộ phường — UBND Hải Châu I" },
      {
        name: "description",
        content: "Bảng điều khiển dành cho cán bộ phường: tiếp nhận, xử lý, hoàn thành phản ánh.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: WardDashboard,
});
