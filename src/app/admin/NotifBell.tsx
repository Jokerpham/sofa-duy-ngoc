"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SESSION_KEY } from "@/lib/admin-auth";
import {
  NOTIF_CHANGED_EVENT,
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

function getSessionEmail(): string | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { email?: string };
    return session.email ? String(session.email) : null;
  } catch {
    return null;
  }
}

// Chuông thông báo ở đầu phải thanh điều hướng quản trị (kiểu
// Facebook): bấm chuông mở bảng thông báo thả xuống; bấm vào một
// thông báo sẽ đánh dấu đã đọc rồi chuyển tới trang liên quan.
// Dùng chung dữ liệu và trạng thái đã đọc với trang Thông báo
// (localStorage sdn-notifications-read / sdn-notifications-cleared)
// nên chuông và trang luôn đồng bộ qua sự kiện
// sdn-notifications-changed.
export default function NotifBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());
  const wrapRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const email = getSessionEmail();
    if (!email) return;
    try {
      const res = await fetch(
        `/api/admin/notifications?email=${encodeURIComponent(email)}`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        notifications?: NotificationItem[];
      };
      if (!data.ok || !Array.isArray(data.notifications)) return;
      setItems(data.notifications);
    } catch {
      // Không tải được thì giữ danh sách cũ.
    }
  }, []);

  useEffect(() => {
    setReadIds(loadIdSet(NOTIF_READ_KEY));
    setClearedIds(loadIdSet(NOTIF_CLEARED_KEY));
    void refresh();
    const onChange = () => {
      setReadIds(loadIdSet(NOTIF_READ_KEY));
      setClearedIds(loadIdSet(NOTIF_CLEARED_KEY));
      void refresh();
    };
    window.addEventListener(NOTIF_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(NOTIF_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  // Đóng bảng khi bấm ra ngoài hoặc bấm Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = items.filter((n) => !clearedIds.has(n.id));
  const unreadCount = visible.filter((n) => !readIds.has(n.id)).length;

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
    setOpen(false);
    window.location.href = n.link;
  }

  function toggle() {
    if (!open) void refresh();
    setOpen((v) => !v);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={
          unreadCount > 0
            ? `Thông báo — ${unreadCount} chưa đọc`
            : "Thông báo"
        }
        aria-expanded={open}
        className={`relative inline-flex h-10 w-10 items-center justify-center rounded-lg border bg-white text-lg shadow-sm transition ${
          open
            ? "border-[#FFD9A0] text-[#241208]"
            : "border-[#241208]/15 text-[#241208] hover:border-[#FFD9A0]"
        }`}
      >
        <span aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-black leading-none text-white"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-[#241208]/10 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#241208]/10 px-4 py-3">
            <p className="text-base font-black text-[#241208]">
              Thông báo
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 align-middle text-[11px] font-black leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng bảng thông báo"
              className="rounded-full px-2 py-1 text-sm font-bold text-[#241208]/60 transition hover:text-[#241208]"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-wrap gap-2 border-b border-[#241208]/10 px-4 py-2.5">
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="rounded-full bg-[#FFD9A0] px-3 py-1.5 text-xs font-bold text-[#241208] transition hover:opacity-90 disabled:opacity-40"
            >
              ✓ Đánh dấu tất cả đã đọc
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={visible.length === 0}
              className="rounded-full border border-[#241208]/20 px-3 py-1.5 text-xs font-bold text-[#241208]/70 transition hover:border-[#FFD9A0] hover:text-[#241208] disabled:opacity-40"
            >
              🗑 Xóa hết
            </button>
          </div>

          {visible.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#241208]/55">
              Chưa có thông báo nào
            </p>
          ) : (
            <ul className="max-h-[min(60vh,440px)] space-y-2 overflow-y-auto p-3">
              {visible.map((n) => {
                const unread = !readIds.has(n.id);
                const meta = TYPE_META[n.type];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        unread
                          ? "border-[#FFD9A0] bg-[#FFD9A0]/15 hover:bg-[#FFD9A0]/25"
                          : "border-[#241208]/10 bg-[#241208]/[0.03] opacity-70 hover:opacity-90"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FFD9A0]/30 text-base"
                      >
                        {meta.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm leading-snug ${
                            unread
                              ? "font-bold text-[#241208]"
                              : "font-semibold text-[#241208]/75"
                          }`}
                        >
                          {n.title}
                        </span>
                        {n.detail && (
                          <span className="mt-0.5 block truncate text-xs text-[#241208]/55">
                            {n.detail}
                          </span>
                        )}
                        <span className="mt-1 block text-xs font-semibold text-[#A9861F]">
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

          <a
            href="/admin/thong-bao"
            className="block border-t border-[#241208]/10 px-4 py-3 text-center text-sm font-bold text-[#241208] transition hover:bg-[#FFD9A0]/15"
          >
            Xem tất cả →
          </a>
        </div>
      )}
    </div>
  );
}
