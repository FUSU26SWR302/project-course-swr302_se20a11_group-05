import type { ReactNode } from "react";
import bgStaff from "@/assets/bg-staff.jpg";

interface Props {
  accent: "blue" | "red" | "gold";
  eyebrow: string;
  title: string;
  org: string;
  children: ReactNode;
}

const ACCENT = {
  blue: { bar: "var(--gov-blue)", chip: "bg-gov-blue text-white" },
  red: { bar: "var(--status-danger)", chip: "bg-[var(--status-danger)] text-white" },
  gold: { bar: "var(--gov-gold)", chip: "bg-gov-gold text-gov-blue-deep" },
};

export function StaffShell({ accent, eyebrow, title, org, children }: Props) {
  const a = ACCENT[accent];
  return (
    <div
      className="relative -mx-0"
      style={{
        backgroundImage: `linear-gradient(rgba(0,15,40,0.86), rgba(0,15,40,0.92)), url(${bgStaff})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="h-1.5 w-full" style={{ background: a.bar }} />
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-8 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span
              className={`inline-block text-[11px] uppercase tracking-[0.25em] font-bold px-3 py-1 rounded ${a.chip}`}
            >
              {eyebrow}
            </span>
            <h1 className="font-heading text-3xl md:text-4xl text-white mt-3">{title}</h1>
            <p className="text-white/60 mt-1 text-sm">{org}</p>
          </div>
        </div>
      </div>
      <div className="pb-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="bg-[var(--gov-bg)] rounded-2xl shadow-xl border border-white/10 p-4 md:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
