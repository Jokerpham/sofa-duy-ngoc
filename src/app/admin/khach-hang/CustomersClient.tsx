"use client";

import { useEffect, useMemo, useState } from "react";
import AdminNav from "../AdminNav";
import { getSession, type AdminUser } from "@/lib/admin-auth";

// Site dùng trang web Gmail, không dùng mailto.
const GMAIL_URL = "https://mail.google.com";

type Customer = {
  name: string;
  email: string;
  phone: string;
  registered_at: string | null;
  order_count: number;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

// Trang /admin/khach-hang: quản trị xem thông tin liên hệ của khách
// hàng — gộp khách đã đăng ký tài khoản (bảng customers) và khách
// chỉ đặt yêu cầu báo giá (bảng quote_requests). Tìm kiếm theo tên,
// số điện thoại hoặc email; mỗi khách có nút Gọi / Nhắn tin (chat
// ngay trong web với khách, không cần sang Messenger) / Gửi email.
export default function CustomersClient() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [openingEmail, setOpeningEmail] = useState("");

  // Mở đoạn chat với khách trong web: tìm đoạn chat đã có theo email,
  // chưa có thì tạo đoạn mới, rồi sang trang Tin nhắn mở đúng đoạn đó.
  async function openChat(c: Customer) {
    if (!user || !c.email || openingEmail) return;
    setOpeningEmail(c.email);
    setError("");
    try {
      const res = await fetch("/api/admin/chat/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: user.email,
          name: c.name,
          email: c.email,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        threadId?: string;
        error?: string;
      };
      if (!data.ok || !data.threadId) {
        setError(data.error ?? "Không mở được đoạn chat với khách hàng.");
        return;
      }
      window.location.href = `/admin/tin-nhan?thread=${encodeURIComponent(data.threadId)}`;
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setOpeningEmail("");
    }
  }

  useEffect(() => {
    void (async () => {
      const u = await getSession();
      setUser(u);
      if (u) await loadCustomers(u.email);
      else setLoading(false);
    })();
  }, []);

  async function loadCustomers(email: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/customers?email=${encodeURIComponent(email)}`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        customers?: Customer[];
        error?: string;
      };
      if (!data.ok || !Array.isArray(data.customers)) {
        setError(data.error ?? "Không tải được danh sách khách hàng.");
        return;
      }
      setCustomers(data.customers);
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setLoading(false);
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ||
        c.phone.toLowerCase().includes(q),
    );
  }, [customers, search]);

  if (!user) {
    return (
      <main className="bg-[#241208] py-14">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-6 sm:p-8">
            <h1 className="text-2xl font-black text-[#EADBC6]">
              Bạn chưa đăng nhập
            </h1>
            <p className="mt-3 leading-relaxed text-[#EADBC6]/70">
              Hãy đăng nhập tài khoản quản trị để xem thông tin khách hàng.
            </p>
            <a
              href="/admin"
              className="mt-6 inline-block rounded-full bg-[#FFD9A0] px-6 py-3 text-sm font-bold text-[#241208] transition hover:opacity-90"
            >
              Đi tới trang đăng nhập →
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
          Khách hàng
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#EADBC6]/70">
          Thông tin liên hệ của khách hàng: người đã đăng ký tài khoản và
          người đã đặt yêu cầu báo giá. Bấm nút liên hệ để gọi điện, nhắn
          tin trò chuyện ngay trong web hoặc gửi email cho khách.
        </p>
        <AdminNav active="khach-hang" />

        <div className="mt-6">
          <label htmlFor="customer-search" className="sr-only">
            Tìm khách hàng theo tên, số điện thoại hoặc email
          </label>
          <input
            id="customer-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, số điện thoại hoặc email…"
            className="w-full max-w-md rounded-full border border-[#EADBC6]/30 bg-white/10 px-5 py-3 text-sm font-semibold text-[#EADBC6] placeholder:text-[#EADBC6]/40 outline-none focus:border-[#FFD9A0]"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-400/50 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-[#EADBC6]/70">Đang tải khách hàng…</p>
        ) : customers.length === 0 ? (
          <p className="mt-8 text-[#EADBC6]/70">Chưa có khách hàng nào.</p>
        ) : visible.length === 0 ? (
          <p className="mt-8 text-[#EADBC6]/70">
            Không tìm thấy khách hàng nào khớp với “{search.trim()}”.
          </p>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-[#EADBC6]/20 bg-white/5">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#EADBC6]/20 text-xs uppercase tracking-wider text-[#FFD9A0]">
                  <th scope="col" className="px-4 py-3">
                    Họ tên
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Số điện thoại
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Email
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Ngày đăng ký
                  </th>
                  <th scope="col" className="px-4 py-3 text-center">
                    Số đơn đã đặt
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Liên hệ
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => (
                  <tr
                    key={`${c.email || c.phone || c.name}`}
                    className="border-b border-[#EADBC6]/10 last:border-b-0"
                  >
                    <td className="px-4 py-3 font-bold text-[#EADBC6]">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-[#EADBC6]/80">
                      {c.phone || "—"}
                    </td>
                    <td className="px-4 py-3 text-[#EADBC6]/80">
                      {c.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-[#EADBC6]/80">
                      {c.registered_at ? formatDate(c.registered_at) : "—"}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-[#EADBC6]">
                      {c.order_count}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {c.phone && (
                          <a
                            href={telHref(c.phone)}
                            className="rounded-full bg-[#FFD9A0] px-3 py-1.5 text-xs font-bold text-[#241208] transition hover:opacity-90"
                          >
                            📞 Gọi
                          </a>
                        )}
                        {c.email && (
                          <button
                            type="button"
                            onClick={() => void openChat(c)}
                            disabled={openingEmail === c.email}
                            className="rounded-full border border-[#1877F2] bg-[#1877F2] px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-60"
                          >
                            {openingEmail === c.email
                              ? "⏳ Đang mở…"
                              : "💬 Nhắn tin"}
                          </button>
                        )}
                        {c.email && (
                          <a
                            href={GMAIL_URL}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#EADBC6]/30 px-3 py-1.5 text-xs font-bold text-[#EADBC6] transition hover:border-[#FFD9A0] hover:text-[#FFD9A0]"
                          >
                            ✉️ Gửi email
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && customers.length > 0 && (
          <p className="mt-4 text-sm text-[#EADBC6]/60">
            Tổng cộng {visible.length} / {customers.length} khách hàng.
          </p>
        )}
      </div>
    </main>
  );
}
