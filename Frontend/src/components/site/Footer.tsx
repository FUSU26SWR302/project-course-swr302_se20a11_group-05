import { useI18n } from "@/lib/i18n";
import logoUrl from "@/assets/logo.png";
import { MapPin, Mail, Phone } from "lucide-react";

export function Footer() {
  const { locale, t } = useI18n();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#082A61] text-white/80 pt-12 pb-6 px-6 md:px-8 mt-12 border-t border-white/10">
      <div className="max-w-[1360px] mx-auto">
        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Column 1: Brand & Intro */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={logoUrl}
                alt="Logo Đà Nẵng Kết Nối"
                className="h-10 w-auto object-contain brightness-0 invert opacity-90"
              />
              <div>
                <h3 className="text-base font-extrabold text-white tracking-wider font-sans">
                  {t("footer.brand")}
                </h3>
                <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider font-sans">
                  {t("footer.brandSub")}
                </p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-white/70 max-w-sm font-sans">
              {t("footer.intro")}
            </p>
          </div>

          {/* Column 2: Navigation */}
          <div className="flex flex-col space-y-3 md:pl-10">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
              {t("footer.nav")}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/", label: t("footer.navHome") },
                { href: "/feedback-search", label: t("footer.navMyReports") },
                { href: "/feedback-search", label: t("footer.navSearch") },
                { href: "/notifications", label: t("footer.navNotif") },
                { href: "/feedback-search", label: t("footer.navGuide") },
                { href: "/", label: t("footer.navAbout") },
              ].map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  className="text-xs text-white/70 hover:text-white transition hover:underline font-sans"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Column 3: Contact */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white font-sans">
              {t("footer.contact")}
            </h4>

            <div className="space-y-2.5 text-xs text-white/70">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-white/60 mt-0.5 shrink-0" />
                <span className="font-sans">24 Trần Phú, Hải Châu, Đà Nẵng</span>
              </div>
              <a
                href="mailto:gopy@danang.gov.vn"
                className="flex items-center gap-2.5 hover:text-white transition"
              >
                <Mail size={16} className="text-white/60 shrink-0" />
                <span className="font-sans hover:underline">gopy@danang.gov.vn</span>
              </a>
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="text-[#F5C542] shrink-0" />
                <span className="font-sans">
                  {t("footer.hotlineLabel")} <span className="text-[#F5C542] font-bold font-sans">1022</span>
                </span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href="tel:1022"
                className="inline-flex items-center gap-2 px-4 py-2 bg-transparent border border-[#F5C542] text-[#F5C542] hover:bg-[#F5C542]/10 transition-all rounded-lg text-xs font-bold font-sans"
              >
                <Phone size={14} />
                {t("footer.callNow")}
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-4" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between text-[11px] text-white/50 pt-2 gap-3">
          <p className="font-sans">{t("footer.copyright")}</p>
          <p className="font-sans text-right md:text-left">
            Trung tâm Chuyển đổi số · SWP391 SE20A11
          </p>
        </div>
      </div>
    </footer>
  );
}
