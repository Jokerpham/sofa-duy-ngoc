import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type ThreadRow = {
  id: number;
  customer_name: string | null;
  customer_email: string | null;
  subject: string | null;
  unread_admin: number;
  unread_customer: number;
  created_at: Date | string;
  updated_at: Date | string;
};

type MessageRow = {
  sender_type: "customer" | "admin";
  content: string;
  created_at: Date | string;
};

export type ChatThreadShape = {
  id: string;
  name: string;
  email: string;
  subject: string;
  messages: { sender: "customer" | "admin"; body: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
  unreadAdmin: boolean;
  unreadCustomer: boolean;
};

function toISO(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

async function loadThread(id: number): Promise<ChatThreadShape | null> {
  const threads = await query<ThreadRow>(
    "SELECT id, customer_name, customer_email, subject, unread_admin, unread_customer, created_at, updated_at FROM chat_threads WHERE id = ?",
    [id],
  );
  const t = threads[0];
  if (!t) return null;
  const messages = await query<MessageRow>(
    "SELECT sender_type, content, created_at FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC",
    [id],
  );
  return {
    id: String(t.id),
    name: t.customer_name ?? "",
    email: t.customer_email ?? "",
    subject: t.subject ?? "Trò chuyện với shop",
    messages: messages.map((m) => ({
      sender: m.sender_type,
      body: m.content,
      createdAt: toISO(m.created_at),
    })),
    createdAt: toISO(t.created_at),
    updatedAt: toISO(t.updated_at),
    unreadAdmin: t.unread_admin === 1,
    unreadCustomer: t.unread_customer === 1,
  };
}

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.trim() ?? "";
  try {
    const threads = email
      ? await query<ThreadRow>(
          "SELECT id, customer_name, customer_email, subject, unread_admin, unread_customer, created_at, updated_at FROM chat_threads WHERE customer_email = ? ORDER BY updated_at DESC",
          [email],
        )
      : await query<ThreadRow>(
          "SELECT id, customer_name, customer_email, subject, unread_admin, unread_customer, created_at, updated_at FROM chat_threads ORDER BY updated_at DESC",
        );
    const result: ChatThreadShape[] = [];
    for (const t of threads) {
      const messages = await query<MessageRow>(
        "SELECT sender_type, content, created_at FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC",
        [t.id],
      );
      result.push({
        id: String(t.id),
        name: t.customer_name ?? "",
        email: t.customer_email ?? "",
        subject: t.subject ?? "Trò chuyện với shop",
        messages: messages.map((m) => ({
          sender: m.sender_type,
          body: m.content,
          createdAt: toISO(m.created_at),
        })),
        createdAt: toISO(t.created_at),
        updatedAt: toISO(t.updated_at),
        unreadAdmin: t.unread_admin === 1,
        unreadCustomer: t.unread_customer === 1,
      });
    }
    return NextResponse.json({ ok: true, threads: result });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let body: { name?: string; email?: string; subject?: string; firstBody?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const subject = (body.subject ?? "").trim() || "Trò chuyện với shop";
  const firstBody = (body.firstBody ?? "").trim();

  if (!name || !email || !firstBody) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng điền đầy đủ thông tin." },
      { status: 400 },
    );
  }

  try {
    const result = await execute(
      "INSERT INTO chat_threads (customer_name, customer_email, subject, unread_admin, unread_customer) VALUES (?, ?, ?, 1, 0)",
      [name, email, subject],
    );
    const threadId = result.insertId;
    await execute(
      "INSERT INTO chat_messages (thread_id, sender_type, sender_name, content) VALUES (?, 'customer', ?, ?)",
      [threadId, name, firstBody],
    );
    const thread = await loadThread(threadId);
    if (!thread) {
      return NextResponse.json(
        { ok: false, error: "Không tạo được đoạn chat." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, thread });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
