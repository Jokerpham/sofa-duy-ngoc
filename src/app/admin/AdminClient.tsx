"use client";

import { useEffect, useState } from "react";
import PasswordField from "@/components/PasswordField";
import AdminNav from "./AdminNav";
import { SITE } from "@/lib/site";
import { useSitePhones } from "@/lib/site-settings";
import {
  getSession,
  login,
  logout,
  type AdminUser,
} from "@/lib/admin-auth";
import { unreadAdminCount } from "@/lib/chat";

// Trang /admin: chưa đăng nhập thì hiện form đăng nhập,
// đăng nhập rồi thì hiện trang tổng quan quản trị (dạng bảng
// điều khiển: thẻ số liệu + bảng yêu cầu báo giá mới nhất).

type QuoteStatus = "moi" | "da_lien_he" | "da_bao_gia" | "da_chot" | "da_huy";

type Quote = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  product_name: string | null;
  message: string | null;
  status: QuoteStatus;
  created_at: string;
};

const STATUS_LABELS: Record<QuoteStatus, string> = {
  moi: "Mới",
  da_lien_he: "Đã liên hệ",
  da_bao_gia: "Đã báo giá",
  da_chot: "Đã chốt",
  da_huy: "Đã hủy",
};

const STATUS_STYLES: Record<QuoteStatus, string> = {
  moi: "bg-red-500 text-white",
  da_lien_he: "bg-amber-400 text-[#241208]",
  da_bao_gia: "bg-sky-400 text-[#241208]",
  da_chot: "bg-green-500 text-white",
  da_huy: "bg-neutral-500 text-white",
};

export default function AdminClient() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [unreadChat, setUnreadChat] = useState(0);
  // Danh sách yêu cầu báo giá (mới nhất trước) — dùng cho cả thẻ
  // số liệu (tổng số + số mới) và bảng "mới nhất" bên dưới.
  const [quotes, setQuotes] = useState<Quote[] | null>(null);
  // Số khách hàng (đã đăng ký + chỉ gửi yêu cầu báo giá) — đếm từ
  // API /api/admin/customers mà trang Khách hàng vẫn dùng.
  const [customerCount, setCustomerCount] = useState<number | null>(null);
  // Số điện thoại hiển thị trên trang tổng quan (quản trị đổi trong
  // /admin/cai-dat).
  const phones = useSitePhones();

  // Phiên đăng nhập chỉ kiểm tra sau khi trang đã tải ở trình duyệt
  // (localStorage không có lúc build tĩnh). Mặc định hiện form đăng nhập
  // để form có sẵn trong HTML tĩnh; có phiên thì đổi sang trang tổng quan.
  useEffect(() => {
    void (async () => {
      const u = await getSession();
      setUser(u);
      setUnreadChat(await unreadAdminCount());
      if (u) {
        try {
          const res = await fetch(
            `/api/admin/quotes?email=${encodeURIComponent(u.email)}`,
          );
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            quotes?: Quote[];
          };
          if (data.ok && Array.isArray(data.quotes)) {
            setQuotes(data.quotes);
          }
        } catch {
          // Không đếm được thì thôi, trang tổng quan vẫn hiện bình thường.
        }
        try {
          const res = await fetch(
            `/api/admin/customers?email=${encodeURIComponent(u.email)}`,
          );
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            customers?: unknown[];
          };
          if (data.ok && Array.isArray(data.customers)) {
            setCustomerCount(data.customers.length);
          }
        } catch {
          // Không đếm được thì thôi, trang tổng quan vẫn hiện bình thường.
        }
      }
    })();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const found = await login(email, password);
    if (!found) {
      setError("Email hoặc mật khẩu không đúng. Hãy kiểm tra lại.");
      return;
    }
    setError("");
    setPassword("");
    setUser(found);
  }

  function handleLogout() {
    logout();
    setUser(null);
    setEmail("");
    setPassword("");
  }

  if (user) {
    const newQuotes =
      quotes === null
        ? null
        : quotes.filter((q) => q.status === "moi").length;
    const latestQuotes = (quotes ?? []).slice(0, 5);

    const stats: {
      href: string;
      value: string;
      label: string;
    }[] = [
      {
        href: "/admin/bao-gia",
        value: quotes === null ? "—" : String(quotes.length),
        label: "Tổng yêu cầu báo giá",
      },
      {
        href: "/admin/bao-gia",
        value: newQuotes === null ? "—" : String(newQuotes),
        label: "Yêu cầu mới",
      },
      {
        href: "/admin/san-pham",
        value: "8",
        label: "Sản phẩm đang bán",
      },
      {
        href: "/admin/tin-nhan",
        value: String(unreadChat),
        label: "Tin nhắn chưa đọc",
      },
      {
        href: "/admin/khach-hang",
        value: customerCount === null ? "—" : String(customerCount),
        label: "Khách hàng",
      },
    ];

    return (
      <>
        <AdminNav active="tong-quan" />
        <main className="min-h-screen bg-cream pb-10 pt-[88px] md:pl-[232px]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-black text-[#241208]">Tổng quan</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-[#241208]/60">
              Xin chào, {user.name} — số liệu lấy từ database của shop.
            </p>

            {/* Thẻ số liệu */}
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {stats.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  className="block rounded-xl border border-[#241208]/10 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <p className="text-3xl font-black text-[#241208]">
                    {s.value}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-[#241208]/60">
                    {s.label}
                  </p>
                </a>
              ))}
            </div>

            {/* Yêu cầu báo giá mới nhất */}
            <div className="mt-8 overflow-hidden rounded-xl border border-[#241208]/10 bg-white shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-[#241208]/10 px-5 py-4">
                <h2 className="text-lg font-bold text-[#241208]">
                  Yêu cầu báo giá mới nhất
                </h2>
                <a
                  href="/admin/bao-gia"
                  className="shrink-0 text-sm font-bold text-[#241208] underline underline-offset-2 transition hover:text-[#A9861F]"
                >
                  Xem tất cả
                </a>
              </div>

              {quotes === null ? (
                <p className="px-5 py-8 text-sm text-[#241208]/60">
                  Đang tải yêu cầu báo giá…
                </p>
              ) : latestQuotes.length === 0 ? (
                <p className="px-5 py-8 text-sm text-[#241208]/60">
                  Chưa có yêu cầu báo giá nào từ khách hàng.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#241208]/10 text-xs uppercase tracking-wider text-[#241208]/50">
                        <th className="px-5 py-3 font-bold">Mã</th>
                        <th className="px-5 py-3 font-bold">Khách hàng</th>
                        <th className="px-5 py-3 font-bold">Sản phẩm</th>
                        <th className="px-5 py-3 font-bold">Trạng thái</th>
                        <th className="px-5 py-3 text-right font-bold">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestQuotes.map((q) => (
                        <tr
                          key={q.id}
                          className="border-b border-[#241208]/5 last:border-0"
                        >
                          <td className="whitespace-nowrap px-5 py-3.5 font-bold text-[#241208]">
                            #{q.id}
                          </td>
                          <td className="px-5 py-3.5 font-medium text-[#241208]">
                            {q.name}
                          </td>
                          <td className="px-5 py-3.5 text-[#241208]/70">
                            {q.product_name ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[q.status]}`}
                            >
                              {STATUS_LABELS[q.status]}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-right">
                            <a
                              href="/admin/bao-gia"
                              className="font-bold text-[#A9861F] hover:underline"
                            >
                              Xem
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Liên hệ xưởng + thao tác nhanh */}
            <div className="mt-8 grid gap-5 lg:grid-cols-2">
              <div className="rounded-xl border border-[#241208]/10 bg-white p-6 shadow-sm">
                <p className="text-sm font-bold uppercase tracking-wider text-[#241208]/50">
                  Liên hệ xưởng
                </p>
                <p className="mt-3 space-y-1.5 text-base font-bold text-[#241208]">
                  <a
                    href={`tel:${phones.mainTel}`}
                    className="block hover:text-[#A9861F]"
                  >
                    {phones.main}
                  </a>
                  <a
                    href={`tel:${phones.secondaryTel}`}
                    className="block hover:text-[#A9861F]"
                  >
                    {phones.secondary}
                  </a>
                </p>
                <p className="mt-2 break-all text-sm text-[#241208]/60">
                  {SITE.email}
                </p>
                <p className="mt-1 text-sm text-[#241208]/60">
                  {SITE.addressShort}
                </p>
                <a
                  href="/lien-he"
                  className="mt-4 inline-block font-bold text-[#A9861F] hover:underline"
                >
                  Xem trang Liên hệ →
                </a>
              </div>

              <div className="flex flex-col justify-center gap-3 rounded-xl border border-[#241208]/10 bg-white p-6 shadow-sm">
                <a
                  href="/admin/doi-mat-khau"
                  className="rounded-full bg-[#FFD9A0] px-6 py-3 text-center text-sm font-bold text-[#241208] shadow transition hover:opacity-90"
                >
                  Đổi mật khẩu
                </a>
                <a
                  href="/"
                  className="rounded-full border-2 border-[#241208]/20 px-6 py-3 text-center text-sm font-bold text-[#241208] transition hover:border-[#FFD9A0] hover:text-[#A9861F]"
                >
                  Xem giao diện shop
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border-2 border-red-400/60 px-6 py-3 text-sm font-bold text-red-500 transition hover:bg-red-400/10"
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // ---------- CHƯA ĐĂNG NHẬP: form đăng nhập ----------
  return (
    <main className="bg-[#241208] py-14">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <a
          href="/"
          className="font-bold text-[#FFD9A0] hover:underline"
        >
          ← Về trang chủ shop
        </a>

        <div className="mt-6 rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EADBC6] px-1">
              <img
                src="/images/logo-dn-home.png"
                alt="DN HOME — Sofa Duy Ngọc"
                className="h-9 w-auto"
              />
            </span>
            <div>
              <h1 className="text-2xl font-black text-[#EADBC6]">
                Đăng nhập quản trị
              </h1>
              <p className="text-sm text-[#EADBC6]/70">
                Sofa Duy Ngọc — DN HOME
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="admin-email"
                className="mb-2 block text-sm font-bold text-[#EADBC6]"
              >
                Email
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="duyngocmanufac@gmail.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-[#EADBC6]/30 bg-white/10 px-4 py-3 text-base text-[#EADBC6] placeholder:text-[#EADBC6]/50 outline-none transition focus:border-[#FFD9A0] focus:ring-2 focus:ring-[#FFD9A0]/40"
              />
            </div>

            <PasswordField
              id="admin-password"
              label="Mật khẩu"
              value={password}
              onChange={setPassword}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/50 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-[#FFD9A0] px-6 py-3.5 text-base font-bold text-[#241208] shadow transition hover:opacity-90"
            >
              ĐĂNG NHẬP
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}
