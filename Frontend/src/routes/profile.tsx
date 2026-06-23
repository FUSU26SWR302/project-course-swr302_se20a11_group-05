import { createFileRoute, redirect } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { Loader2, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getToken } from "@/lib/api";
import { useProfile, useUpdateProfileMutation } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/profile")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!getToken() || !localStorage.getItem("dn_auth_user_v2")) {
      throw redirect({ to: "/login", search: { redirect: "/profile", error: undefined } });
    }
  },
  component: ProfilePage,
});

function ProfilePage() {
  const { locale } = useI18n();
  const { user, login } = useAuth();
  const { data, isLoading, isError, refetch } = useProfile();
  const updateProfile = useUpdateProfileMutation();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!data) return;
    setFullName(data.fullName || "");
    setPhoneNumber(data.phoneNumber || "");
    setEmail(data.email || "");
  }, [data]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const updated = await updateProfile.mutateAsync({
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined,
      });
      if (user) {
        login({ ...user, name: updated.fullName || user.name });
      }
      toast.success(locale === "vi" ? "Đã cập nhật hồ sơ" : "Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] grid place-items-center">
        <Loader2 className="animate-spin text-gov-blue" size={40} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-12">
        <div className="card-civic p-8 text-center">
          <h1 className="text-2xl font-heading text-gov-blue mb-3">
            {locale === "vi" ? "Không tải được hồ sơ" : "Could not load profile"}
          </h1>
          <button onClick={() => refetch()} className="btn-civic btn-civic-primary">
            {locale === "vi" ? "Thử lại" : "Try again"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="mb-8">
        <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-2">
          {locale === "vi" ? "Hồ sơ cá nhân" : "Profile"}
        </h1>
        <p className="text-ink-soft">
          {locale === "vi"
            ? "Cập nhật thông tin liên hệ để cơ quan xử lý có thể phản hồi."
            : "Keep your contact information current for case follow-up."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card-civic p-6 md:p-8 space-y-5">
        <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
          <div className="w-14 h-14 rounded-full bg-gov-blue text-white grid place-items-center">
            <UserRound size={28} />
          </div>
          <div>
            <div className="font-bold text-lg text-ink">{data.username}</div>
            <div className="text-sm text-ink-soft">{data.role}</div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold mb-2">
            {locale === "vi" ? "Họ và tên" : "Full name"}
          </label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full min-h-[48px] px-4 rounded-lg border-2 border-slate-200 focus:border-gov-blue outline-none"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">
              {locale === "vi" ? "Số điện thoại" : "Phone number"}
            </label>
            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full min-h-[48px] px-4 rounded-lg border-2 border-slate-200 focus:border-gov-blue outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Email</label>
            <input
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-[48px] px-4 rounded-lg border-2 border-slate-200 focus:border-gov-blue outline-none"
            />
          </div>
        </div>

        <div className="pt-3">
          <button
            type="submit"
            disabled={updateProfile.isPending}
            className="btn-civic btn-civic-primary disabled:opacity-50"
          >
            {updateProfile.isPending ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Save size={20} />
            )}
            {locale === "vi" ? "Lưu thay đổi" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
