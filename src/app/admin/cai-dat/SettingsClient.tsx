"use client";

import { useEffect, useState } from "react";
import AdminNav from "../AdminNav";
import {
  getSession,
  type AdminUser,
} from "@/lib/admin-auth";
import {
  formatPhoneDisplay,
  invalidateSitePhonesCache,
  isValidPhone,
  normalizePhone,
} from "@/lib/site-settings";

// Trang /admin/cai-dat: đổi số điện thoại hiển thị trên shop.
// CHỈ quản trị mới vào được trang này và mới lưu được số mới:
// - Giao diện: trang nằm trong khu vực /admin, khách hàng đăng nhập ở
//   /tai-khoan không bao giờ thấy mục Cài đặt hay form đổi số.
// - API: /api/admin/settings kiểm tra email trong bảng admins
//   (isAdminEmail) trước khi đọc/lưu; không phải quản trị thì bị 401.
export default function SettingsClient() {
  const [user, setUser] = useState<AdminUser | null>(null);
  // `checked` = đã kiểm tra phiên ở trình duyệt.
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [phoneMain, setPhoneMain] = useState("");
  const [phoneSecondary, setPhoneSecondary] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void (async () => {
      const u = await getSession();
      setUser(u);
      setChecked(true);
      if (u) {
        try {
          const res = await fetch(
            `/api/admin/settings?email=${encodeURIComponent(u.email)}`,
          );
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            settings?: { phone_main?: string; phone_secondary?: string };
          };
          if (data.ok && data.settings) {
            setPhoneMain(data.settings.phone_main ?? "");
            setPhoneSecondary(data.settings.phone_secondary ?? "");
          }
        } catch {
          // Không tải được số đã lưu thì để trống ô nhập, quản trị nhập
          // lại rồi lưu; số trên shop vẫn hiện số mặc định.
        }
      }
      setLoading(false);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const main = normalizePhone(phoneMain);
    const secondary = normalizePhone(phoneSecondary);
    if (!isValidPhone(main) || !isValidPhone(secondary)) {
      setError("Số điện thoại phải có 9–11 chữ số.");
      return;
    }
    if (!user) {
      setError("Bạn chưa đăng nhập quản trị.");
      return;
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          phone_main: main,
          phone_secondary: secondary,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Lưu số điện thoại thất bại. Hãy thử lại.");
        return;
      }
      setPhoneMain(main);
      setPhoneSecondary(secondary);
      invalidateSitePhonesCache();
      setSuccess(
        `Đã lưu số điện thoại: ${formatPhoneDisplay(main)} và ${formatPhoneDisplay(secondary)}. Số mới sẽ hiện ở chân trang, menu và trang Liên hệ sau khi tải lại trang.`,
      );
    } catch {
      setError("Lưu số điện thoại thất bại. Hãy thử lại.");
    }
  }

  if (!checked) {
    return (
      <main className="bg-[#241208] py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[#EADBC6]/70">Đang tải…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="bg-[#241208] py-14">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-6 text-center sm:p-8">
            <h1 className="text-2xl font-black text-[#EADBC6]">
              Bạn chưa đăng nhập
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[#EADBC6]/70">
              Hãy đăng nhập tài khoản quản trị trước khi đổi số điện thoại.
            </p>
            <a
              href="/admin"
              className="mt-6 inline-block rounded-full bg-[#FFD9A0] px-6 py-3 text-sm font-bold text-[#241208] shadow transition hover:opacity-90"
            >
              Đến trang đăng nhập
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#241208] py-14 md:pl-[232px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mt-2 text-3xl font-black text-[#EADBC6] sm:text-4xl">
          Cài đặt
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#EADBC6]/70">
          Đổi số điện thoại hiển thị trên web (chân trang, nút &ldquo;Gọi
          ngay&rdquo; trên điện thoại và trang Liên hệ). Chỉ tài khoản quản
          trị mới đổi được số này.
        </p>
        <AdminNav active="cai-dat" />

        <div className="mt-8 max-w-xl rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-6 sm:p-8">
          {loading ? (
            <p className="text-[#EADBC6]/70">Đang tải số điện thoại…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="phone-main"
                  className="mb-2 block text-sm font-bold text-[#EADBC6]"
                >
                  Số điện thoại chính
                </label>
                <input
                  id="phone-main"
                  type="tel"
                  inputMode="tel"
                  value={phoneMain}
                  onChange={(e) => setPhoneMain(e.target.value)}
                  placeholder="Ví dụ: 0943625922"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-[#EADBC6]/30 bg-white/10 px-4 py-3 text-base text-[#EADBC6] outline-none placeholder:text-[#EADBC6]/45 focus:border-[#FFD9A0]"
                />
              </div>

              <div>
                <label
                  htmlFor="phone-secondary"
                  className="mb-2 block text-sm font-bold text-[#EADBC6]"
                >
                  Số điện thoại phụ
                </label>
                <input
                  id="phone-secondary"
                  type="tel"
                  inputMode="tel"
                  value={phoneSecondary}
                  onChange={(e) => setPhoneSecondary(e.target.value)}
                  placeholder="Ví dụ: 0398084245"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-[#EADBC6]/30 bg-white/10 px-4 py-3 text-base text-[#EADBC6] outline-none placeholder:text-[#EADBC6]/45 focus:border-[#FFD9A0]"
                />
                <p className="mt-2 text-sm text-[#EADBC6]/60">
                  Chỉ gồm chữ số, dài 9–11 chữ số. Có thể nhập kèm dấu chấm
                  hoặc khoảng trắng, web sẽ tự bỏ.
                </p>
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-400/50 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300"
                >
                  {error}
                </p>
              )}

              {success && (
                <p
                  role="status"
                  className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300"
                >
                  {success}
                </p>
              )}

              <button
                type="submit"
                className="w-full rounded-full bg-[#FFD9A0] px-6 py-3.5 text-base font-bold text-[#241208] shadow transition hover:opacity-90"
              >
                LƯU SỐ ĐIỆN THOẠI
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
