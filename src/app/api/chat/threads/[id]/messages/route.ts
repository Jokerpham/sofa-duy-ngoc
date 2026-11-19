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

function toISO(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : new Date(v).toISOString();
}

async function loadThread(id: number) {
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

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json(
      { ok: false, error: "Không tìm thấy đoạn chat." },
      { status: 404 },
    );
  }

  let body: { sender?: string; body?: string; senderName?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const sender = body.sender;
  const text = (body.body ?? "").trim();
  if ((sender !== "customer" && sender !== "admin") || !text) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng điền đầy đủ thông tin." },
      { status: 400 },
    );
  }

  try {
    const threads = await query<ThreadRow>(
      "SELECT id, customer_name, customer_email, subject, unread_admin, unread_customer, created_at, updated_at FROM chat_threads WHERE id = ?",
      [id],
    );
    const t = threads[0];
    if (!t) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy đoạn chat." },
        { status: 404 },
      );
    }

    const senderName =
      body.senderName?.trim() ||
      (sender === "admin" ? "Sofa Duy Ngọc" : (t.customer_name ?? ""));
    await execute(
      "INSERT INTO chat_messages (thread_id, sender_type, sender_name, content) VALUES (?, ?, ?, ?)",
      [id, sender, senderName, text],
    );
    // Tin khách nhắn thì đánh dấu chưa đọc cho quản trị;
    // tin quản trị trả lời thì đánh dấu chưa đọc cho khách.
    // Không xoá cờ chưa đọc của phía bên kia.
    await execute(
      "UPDATE chat_threads SET updated_at = CURRENT_TIMESTAMP, unread_admin = ?, unread_customer = ? WHERE id = ?",
      [
        sender === "customer" ? 1 : t.unread_admin,
        sender === "admin" ? 1 : t.unread_customer,
        id,
      ],
    );

    const thread = await loadThread(id);
    if (!thread) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy đoạn chat." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, thread });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
