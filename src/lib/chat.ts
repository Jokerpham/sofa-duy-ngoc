// Chat khách hàng ↔ quản trị — tin nhắn lưu trong MySQL qua API
// (xem src/app/api/chat/*), nên khách và quản trị thấy tin nhắn của
// nhau dù dùng máy / trình duyệt khác nhau. Chỉ email khách dùng để
// tra lại đoạn chat của mình vẫn lưu trong localStorage (CHAT_EMAIL_KEY).
export type ChatSender = "customer" | "admin";

export type ChatMessage = {
  sender: ChatSender;
  body: string;
  createdAt: string;
};

export type ChatThread = {
  id: string;
  name: string;
  email: string;
  subject: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  /** Có tin nhắn mới của khách mà quản trị chưa mở xem. */
  unreadAdmin: boolean;
  /** Có tin nhắn mới của quản trị mà khách chưa xem. */
  unreadCustomer: boolean;
};

export const CHAT_EMAIL_KEY = "sdn-chat-email";

export async function loadThreads(email?: string): Promise<ChatThread[]> {
  try {
    const url = email
      ? `/api/chat/threads?email=${encodeURIComponent(email)}`
      : "/api/chat/threads";
    const res = await fetch(url);
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      threads?: ChatThread[];
    };
    if (!data.ok || !Array.isArray(data.threads)) return [];
    return data.threads;
  } catch {
    return [];
  }
}

export async function createThread(
  name: string,
  email: string,
  subject: string,
  firstBody: string,
): Promise<ChatThread | null> {
  if (!name.trim() || !email.trim() || !firstBody.trim()) return null;
  try {
    const res = await fetch("/api/chat/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || "Trò chuyện với shop",
        firstBody: firstBody.trim(),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      thread?: ChatThread;
    };
    if (!data.ok || !data.thread) return null;
    return data.thread;
  } catch {
    return null;
  }
}

export async function addMessage(
  threadId: string,
  sender: ChatSender,
  body: string,
): Promise<ChatThread | null> {
  const text = body.trim();
  if (!text) return null;
  try {
    const res = await fetch(
      `/api/chat/threads/${encodeURIComponent(threadId)}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sender, body: text }),
      },
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      thread?: ChatThread;
    };
    if (!data.ok || !data.thread) return null;
    return data.thread;
  } catch {
    return null;
  }
}

export async function markAdminRead(threadId: string): Promise<void> {
  try {
    await fetch(`/api/chat/threads/${encodeURIComponent(threadId)}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ by: "admin" }),
    });
  } catch {
    // Gửi lặng lẽ (fire-and-forget) — lỗi thì bỏ qua.
  }
}

export async function markCustomerRead(threadId: string): Promise<void> {
  try {
    await fetch(`/api/chat/threads/${encodeURIComponent(threadId)}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ by: "customer" }),
    });
  } catch {
    // Gửi lặng lẽ (fire-and-forget) — lỗi thì bỏ qua.
  }
}

/** Số đoạn chat có tin nhắn mới của khách mà quản trị chưa xem. */
export async function unreadAdminCount(): Promise<number> {
  try {
    const res = await fetch("/api/chat/unread");
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      unreadAdmin?: number;
    };
    if (!data.ok || typeof data.unreadAdmin !== "number") return 0;
    return data.unreadAdmin;
  } catch {
    return 0;
  }
}

export function formatChatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "";
  }
}
