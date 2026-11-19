"use client";

import { useCallback, useEffect, useState } from "react";
import { SESSION_KEY } from "@/lib/admin-auth";
import {
  NOTIF_CHANGED_EVENT,
  NOTIF_CLEARED_KEY,
  NOTIF_READ_KEY,
  loadIdSet,
} from "@/lib/notifications";

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

// Huy hiệu đỏ đếm thông báo chưa đọc trên mục "Thông báo" của
// thanh điều hướng quản trị. Số chưa đọc = thông báo từ API chưa
// nằm trong danh sách đã đọc / đã xóa ở localStorage. Tự làm mới
// khi quản trị đánh dấu đã đọc ở trang Thông báo.
export default function NotifBadge() {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const email = getSessionEmail();
    if (!email) {
      setCount(0);
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/notifications?email=${encodeURIComponent(email)}`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        notifications?: { id: string }[];
      };
      if (!data.ok || !Array.isArray(data.notifications)) return;
      const read = loadIdSet(NOTIF_READ_KEY);
      const cleared = loadIdSet(NOTIF_CLEARED_KEY);
      const unread = data.notifications.filter(
        (n) => !read.has(n.id) && !cleared.has(n.id),
      ).length;
      setCount(unread);
    } catch {
      // Không tải được thì giữ số cũ (huy hiệu chỉ ẩn khi có lỗi).
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(NOTIF_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(NOTIF_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  if (count <= 0) return null;

  return (
    <span
      aria-label={`${count} thông báo chưa đọc`}
      className="ml-1.5 inline-flex min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-black leading-none text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
