"use client";

import { useEffect, useMemo, useState } from "react";
import AdminNav from "../AdminNav";
import { getSession, type AdminUser } from "@/lib/admin-auth";
import {
  NOTIF_CLEARED_KEY,
  NOTIF_READ_KEY,
  loadIdSet,
  notifyChanged,
  relativeTime,
  saveIdSet,
} from "@/lib/notifications";

type NotificationItem = {
  id: string;
  type: "order" | "chat" | "customer";
  title: string;
  detail: string;
  created_at: string;
  link: string;
};

const TYPE_META: Record<
  NotificationItem["type"],
  { icon: string; label: string }
> = {
  order: { icon: "📦", label: "Đơn đặt hàng mới" },
  chat: { icon: "💬", label: "Tin nhắn mới" },
  customer: { icon: "👤", label: "Khách hàng mới" },
};

// Trang /admin/thong-bao: trung tâm thông báo của quản trị — đơn đặt
// hàng mới (status 'moi'), tin nhắn mới chưa đọc của khách và khách
// hàng mới đăng ký, mới nhất lên đầu. Bấm vào một thông báo sẽ đánh
// dấu đã đọc rồi chuyển tới trang liên quan. Trạng thái đã đọc / đã
// xóa lưu ở localStorage của trình duyệt (xem src/lib/notifications).
export default function NotificationsClient() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setReadIds(loadIdSet(NOTIF_READ_KEY));
    setClearedIds(loadIdSet(NOTIF_CLEARED_KEY));
    void (async () => {
      const u = await getSession();
      setUser(u);
      if (u) await loadNotifications(u.email);
      else setLoading(false);
    })();
  }, []);

  async function loadNotifications(email: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/notifications?email=${encodeURIComponent(email)}`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        notifications?: NotificationItem[];
        error?: string;
      };
      if (!data.ok || !Array.isArray(data.notifications)) {
        setError(data.error ?? "Không tải được thông báo.");
        return;
      }
      setItems(data.notifications);
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setLoading(false);
    }
  }

  const visible = useMemo(
    () => items.filter((n) => !clearedIds.has(n.id)),
    [items, clearedIds],
  );

  const unreadCount = useMemo(
    () => visible.filter((n) => !readIds.has(n.id)).length,
    [visible, readIds],
  );

  function markRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveIdSet(NOTIF_READ_KEY, next);
      return next;
    });
    notifyChanged();
  }

  function markAllRead() {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of visible) next.add(n.id);
      saveIdSet(NOTIF_READ_KEY, next);
      return next;
    });
    notifyChanged();
  }

  function clearAll() {
    setClearedIds((prev) => {
      const next = new Set(prev);
      for (const n of visible) next.add(n.id);
      saveIdSet(NOTIF_CLEARED_KEY, next);
      return next;
    });
    notifyChanged();
  }

  function openNotification(n: NotificationItem) {
    markRead(n.id);
    window.location.href = n.link;
  }

  if (!user) {
    return (
      <main className="bg-[#241208] py-14">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-6 sm:p-8">
            <h1 className="text-2xl font-black text-[#EADBC6]">
              Bạn chưa đăng nhập
            </h1>
            <p className="mt-3 leading-relaxed text-[#EADBC6]/70">
              Hãy đăng nhập tài khoản quản trị để xem thông báo.
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h1 className="mt-2 text-3xl font-black text-[#EADBC6] sm:text-4xl">
          Thông báo
          {unreadCount > 0 && (
            <span className="ml-3 inline-flex min-w-[28px] items-center justify-center rounded-full bg-red-500 px-2 py-1 align-middle text-sm font-black leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#EADBC6]/70">
          Đơn đặt hàng mới, tin nhắn mới của khách và khách hàng mới đăng ký
          — mới nhất lên đầu. Bấm vào một thông báo để xem chi tiết.
        </p>
        <AdminNav active="thong-bao" />

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={markAllRead}
            disabled={loading || unreadCount === 0}
            className="rounded-full bg-[#FFD9A0] px-4 py-2 text-sm font-bold text-[#241208] transition hover:opacity-90 disabled:opacity-40"
          >
            ✓ Đánh dấu tất cả đã đọc
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={loading || visible.length === 0}
            className="rounded-full border border-[#EADBC6]/30 px-4 py-2 text-sm font-bold text-[#EADBC6] transition hover:border-[#FFD9A0] hover:text-[#FFD9A0] disabled:opacity-40"
          >
            🗑 Xóa hết
          </button>
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
          <p className="mt-8 text-[#EADBC6]/70">Đang tải thông báo…</p>
        ) : visible.length === 0 ? (
          <p className="mt-8 text-[#EADBC6]/70">Chưa có thông báo nào.</p>
        ) : (
          <ul className="mt-8 space-y-3">
            {visible.map((n) => {
              const unread = !readIds.has(n.id);
              const meta = TYPE_META[n.type];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    className={`flex w-full items-start gap-4 rounded-2xl border px-4 py-4 text-left transition sm:px-5 ${
                      unread
                        ? "border-[#FFD9A0]/60 bg-[#FFD9A0]/10 hover:bg-[#FFD9A0]/15"
                        : "border-[#EADBC6]/20 bg-white/5 opacity-70 hover:opacity-90"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFD9A0]/15 text-xl"
                    >
                      {meta.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm leading-relaxed sm:text-base ${
                          unread
                            ? "font-bold text-[#EADBC6]"
                            : "font-semibold text-[#EADBC6]/80"
                        }`}
                      >
                        {n.title}
                      </span>
                      {n.detail && (
                        <span className="mt-1 block truncate text-sm text-[#EADBC6]/60">
                          {n.detail}
                        </span>
                      )}
                      <span className="mt-1.5 block text-xs font-semibold text-[#FFD9A0]/80">
                        {meta.label} · {relativeTime(n.created_at)}
                      </span>
                    </span>
                    {unread && (
                      <span
                        aria-label="Chưa đọc"
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && visible.length > 0 && (
          <p className="mt-4 text-sm text-[#EADBC6]/60">
            {unreadCount > 0
              ? `${unreadCount} chưa đọc / ${visible.length} thông báo.`
              : `${visible.length} thông báo — đã đọc hết.`}
          </p>
        )}
      </div>
    </main>
  );
}
