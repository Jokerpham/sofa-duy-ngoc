import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json(
      { ok: false, error: "Không tìm thấy đoạn chat." },
      { status: 404 },
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
    const messages = await query<MessageRow>(
      "SELECT sender_type, content, created_at FROM chat_messages WHERE thread_id = ? ORDER BY created_at ASC",
      [id],
    );
    return NextResponse.json({
      ok: true,
      thread: {
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
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
