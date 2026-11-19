"use client";

import { useEffect, useState } from "react";
import AdminNav from "../AdminNav";
import { getSession, type AdminUser } from "@/lib/admin-auth";

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

const FILTERS: { key: "all" | QuoteStatus; label: string }[] = [
  { key: "all", label: "Tất cả" },
  { key: "moi", label: "Mới" },
  { key: "da_lien_he", label: "Đã liên hệ" },
  { key: "da_bao_gia", label: "Đã báo giá" },
  { key: "da_chot", label: "Đã chốt" },
  { key: "da_huy", label: "Đã hủy" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Trang /admin/bao-gia: quản trị xem các yêu cầu báo giá khách gửi
// từ form Liên hệ (bảng quote_requests), lọc theo trạng thái và
// đổi trạng thái từng yêu cầu.
export default function QuotesClient() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | QuoteStatus>("all");
  const [savingId, setSavingId] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const u = await getSession();
      setUser(u);
      if (u) await loadQuotes(u.email);
      else setLoading(false);
    })();
  }, []);

  async function loadQuotes(email: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/quotes?email=${encodeURIComponent(email)}`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        quotes?: Quote[];
        error?: string;
      };
      if (!data.ok || !Array.isArray(data.quotes)) {
        setError(data.error ?? "Không tải được danh sách yêu cầu báo giá.");
        return;
      }
      setQuotes(data.quotes);
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(q: Quote, status: QuoteStatus) {
    if (!user || status === q.status) return;
    setSavingId(q.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/quotes/${q.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, status }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Đổi trạng thái thất bại. Hãy thử lại.");
        return;
      }
      setQuotes((prev) =>
        prev.map((item) =>
          item.id === q.id ? { ...item, status } : item,
        ),
      );
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setSavingId(null);
    }
  }

  const counts = quotes.reduce<Record<string, number>>((acc, q) => {
    acc[q.status] = (acc[q.status] ?? 0) + 1;
    return acc;
  }, {});
  const visible =
    filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

  if (!user) {
    return (
      <main className="bg-[#241208] py-14">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-6 sm:p-8">
            <h1 className="text-2xl font-black text-[#EADBC6]">
              Bạn chưa đăng nhập
            </h1>
            <p className="mt-3 leading-relaxed text-[#EADBC6]/70">
              Hãy đăng nhập tài khoản quản trị để xem yêu cầu báo giá của
              khách hàng.
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
          Yêu cầu báo giá
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#EADBC6]/70">
          Các yêu cầu báo giá khách gửi từ form Liên hệ, mới nhất trước.
          Đổi trạng thái khi đã liên hệ, đã báo giá, đã chốt hoặc đã hủy.
        </p>
        <AdminNav active="bao-gia" />

        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count =
              f.key === "all" ? quotes.length : (counts[f.key] ?? 0);
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  filter === f.key
                    ? "bg-[#FFD9A0] text-[#241208]"
                    : "border border-[#EADBC6]/30 text-[#EADBC6] hover:border-[#FFD9A0] hover:text-[#FFD9A0]"
                }`}
              >
                {f.label} ({count})
              </button>
            );
          })}
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
          <p className="mt-8 text-[#EADBC6]/70">
            Đang tải yêu cầu báo giá…
          </p>
        ) : visible.length === 0 ? (
          <p className="mt-8 text-[#EADBC6]/70">
            {quotes.length === 0
              ? "Chưa có yêu cầu báo giá nào từ khách hàng."
              : "Không có yêu cầu nào ở trạng thái này."}
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {visible.map((q) => (
              <article
                key={q.id}
                className="rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-[#EADBC6]">
                      {q.name}
                    </p>
                    <p className="mt-0.5 text-sm text-[#EADBC6]/60">
                      {formatDate(q.created_at)}
                      {q.product_name ? ` • Mẫu: ${q.product_name}` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[q.status]}`}
                  >
                    {STATUS_LABELS[q.status]}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-[#EADBC6]/80">
                  {q.email && (
                    <p>
                      Email:{" "}
                      <a
                        href={`mailto:${q.email}`}
                        className="font-bold text-[#FFD9A0] hover:underline"
                      >
                        {q.email}
                      </a>
                    </p>
                  )}
                  {q.phone && (
                    <p>
                      Điện thoại:{" "}
                      <a
                        href={`tel:${q.phone.replace(/\s+/g, "")}`}
                        className="font-bold text-[#FFD9A0] hover:underline"
                      >
                        {q.phone}
                      </a>
                    </p>
                  )}
                  {q.message && (
                    <p className="rounded-xl bg-white/5 px-3 py-2 leading-relaxed">
                      “{q.message}”
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <label
                    htmlFor={`status-${q.id}`}
                    className="text-sm font-bold text-[#EADBC6]/70"
                  >
                    Đổi trạng thái:
                  </label>
                  <select
                    id={`status-${q.id}`}
                    value={q.status}
                    disabled={savingId === q.id}
                    onChange={(e) =>
                      void changeStatus(q, e.target.value as QuoteStatus)
                    }
                    className="rounded-full border border-[#EADBC6]/30 bg-white/10 px-4 py-2 text-sm font-bold text-[#EADBC6] outline-none focus:border-[#FFD9A0] disabled:opacity-50 [&>option]:text-neutral-900"
                  >
                    {(Object.keys(STATUS_LABELS) as QuoteStatus[]).map(
                      (s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ),
                    )}
                  </select>
                  {savingId === q.id && (
                    <span className="text-sm text-[#EADBC6]/60">
                      Đang lưu…
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
