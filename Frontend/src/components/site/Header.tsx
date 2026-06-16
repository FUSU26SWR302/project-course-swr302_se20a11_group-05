import { Link, useRouterState } from "@tanstack/react-router";
import { useI18n, useFontScale } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL, Role } from "@/lib/roles";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import logoUrl from "@/assets/logo.png";

export function Header() {
  const { locale, setLocale, t } = useI18n();
  const { inc, dec } = useFontScale();
  const { user, logout, hasRole } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const navItems = [
    { to: "/", label: t("nav.home") },
    { to: "/report", label: t("nav.report") },
    { to: "/my-reports", label: t("nav.myReports") },
    { to: "/assistant", label: t("nav.assistant") },
  ];

  // Role-aware staff links — only show portals the user can access
  // SECURITY: Uses Role enum constants — never inline role strings
  const staffItemsAll = [
    { to: "/ward",       label: t("nav.ward"),      roles: [Role.WARD_STAFF, Role.SUPER_ADMIN] as const },
    { to: "/police",     label: t("nav.police"),    roles: [Role.POLICE, Role.SUPER_ADMIN] as const },
    { to: "/city-admin", label: t("nav.cityAdmin"), roles: [Role.SUPER_ADMIN] as const },
  ];
  const staffItems = staffItemsAll.filter((i) => hasRole(...i.roles));

  return (
    <header className="sticky top-0 z-50 border-b border-gov-blue-deep/30 shadow-sm">
      {/* Top utility bar */}
      <div className="bg-gov-blue-deep text-white px-4 md:px-8 py-3 flex flex-wrap justify-between items-center gap-3">
        <Link to="/" className="flex items-center gap-3 group">
          <img src={logoUrl} alt="Đà Nẵng Kết Nối" className="h-14 w-auto object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="text-base md:text-lg font-bold tracking-tight uppercase">
              <span className="text-gov-gold">Đà Nẵng</span> Kết Nối
            </span>
            <span className="text-[11px] text-white/60 uppercase tracking-widest">{t("brand.tag")}</span>
          </div>
        </Link>

        <div className="flex items-center gap-3 md:gap-5">
          <div className="flex gap-3 text-sm font-medium" role="group" aria-label="Language">
            <button
              onClick={() => setLocale("vi")}
              className={`min-h-[44px] px-2 py-1 ${locale === "vi" ? "border-b-2 border-gov-gold text-white" : "text-white/60 hover:text-white"}`}
              aria-pressed={locale === "vi"}
            >
              VI
            </button>
            <button
              onClick={() => setLocale("en")}
              className={`min-h-[44px] px-2 py-1 ${locale === "en" ? "border-b-2 border-gov-gold text-white" : "text-white/60 hover:text-white"}`}
              aria-pressed={locale === "en"}
            >
              EN
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-1 border-l border-white/15 pl-4" role="group" aria-label="Text size">
            <button
              onClick={dec}
              aria-label={t("a11y.fontSmaller")}
              className="min-w-[44px] min-h-[44px] px-3 rounded border border-white/20 text-base font-bold hover:bg-white/10"
            >
              A−
            </button>
            <button
              onClick={inc}
              aria-label={t("a11y.fontLarger")}
              className="min-w-[44px] min-h-[44px] px-3 rounded border border-white/20 text-xl font-bold hover:bg-white/10"
            >
              A+
            </button>
          </div>

          {user ? (
            <div className="hidden md:flex items-center gap-3 border-l border-white/15 pl-4">
              <div className="text-right leading-tight">
                <div className="text-sm font-bold text-white">{user.name}</div>
                <div className="text-[10px] uppercase tracking-widest text-gov-gold font-bold">
                  {ROLE_LABEL[user.role][locale]}
                </div>
              </div>
              <button
                onClick={logout}
                className="min-h-[44px] px-3 rounded-md border border-white/20 text-sm font-semibold hover:bg-white/10 inline-flex items-center gap-1.5"
                aria-label={locale === "vi" ? "Đăng xuất" : "Sign out"}
              >
                <LogOut size={16} /> {locale === "vi" ? "Đăng xuất" : "Sign out"}
              </button>
            </div>
          ) : (
            <Link
              to={"/login" as any}
              className="hidden md:inline-flex min-h-[44px] items-center px-4 rounded-md bg-gov-gold text-gov-blue-deep font-bold text-sm hover:brightness-105"
            >
              {t("nav.login")}
            </Link>
          )}
          <button
            className="md:hidden min-w-[44px] min-h-[44px] grid place-items-center text-white"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Navigation row */}
      <nav className="bg-gov-blue text-white hidden md:flex px-8" aria-label="Main">
        <ul className="flex flex-wrap items-stretch w-full">
          {navItems.map((n) => {
            const active = path === n.to;
            return (
              <li key={n.to}>
                <Link
                  to={n.to}
                  className={`inline-flex items-center min-h-[52px] px-5 text-[15px] font-semibold border-b-4 ${
                    active ? "border-gov-gold text-white" : "border-transparent text-white/80 hover:text-white hover:border-white/30"
                  }`}
                >
                  {n.label}
                </Link>
              </li>
            );
          })}
          {staffItems.length > 0 && (
            <li className="ml-auto flex items-center">
              <span className="text-[10px] uppercase tracking-widest text-gov-gold/80 font-bold pr-3 border-r border-white/15 mr-3">
                {locale === "vi" ? "Khu vực cán bộ" : "Staff area"}
              </span>
              {staffItems.map((n) => {
                const active = path === n.to;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`inline-flex items-center min-h-[52px] px-4 text-[13px] uppercase tracking-wider font-bold border-b-4 ${
                      active ? "border-gov-gold text-gov-gold" : "border-transparent text-white/70 hover:text-gov-gold"
                    }`}
                  >
                    {n.label}
                  </Link>
                );
              })}
            </li>
          )}
        </ul>
      </nav>

      {/* Mobile menu with animation */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="bg-gov-blue text-white px-4 py-4 space-y-1" aria-label="Mobile">
          {navItems.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={`block min-h-[48px] px-4 py-3 rounded-md font-semibold transition-all ${
                path === n.to ? "bg-white/15 text-gov-gold" : "hover:bg-white/10"
              }`}
            >
              {n.label}
            </Link>
          ))}
          {staffItems.length > 0 && (
            <>
              <div className="mt-3 px-4 text-[10px] uppercase tracking-widest text-gov-gold font-bold">
                {locale === "vi" ? "Khu vực cán bộ" : "Staff area"}
              </div>
              {staffItems.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={`block min-h-[48px] px-4 py-3 rounded-md font-semibold transition-all ${
                    path === n.to ? "bg-white/15 text-gov-gold" : "hover:bg-white/10"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </>
          )}
          <div className="pt-3 mt-3 border-t border-white/10">
            {user ? (
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="w-full text-left min-h-[48px] px-4 py-3 rounded-md hover:bg-white/10 font-semibold inline-flex items-center gap-2 transition-all"
              >
                <LogOut size={18} /> {locale === "vi" ? "Đăng xuất" : "Sign out"} — {user.name}
              </button>
            ) : (
              <Link
                to={"/login" as any}
                onClick={() => setOpen(false)}
                className="block min-h-[48px] px-4 py-3 rounded-md bg-gov-gold text-gov-blue-deep font-bold text-center"
              >
                {t("nav.login")}
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
