import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type OrderRow = {
  id: number;
  name: string;
  product_name: string | null;
  created_at: Date | string;
};

type ChatRow = {
  thread_id: number;
  customer_name: string | null;
  customer_email: string | null;
  content: string;
  created_at: Date | string;
};

type CustomerRow = {
  id: number;
  name: string;
  email: string;
  created_at: Date | string;
};

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

function truncate(text: string, max: number): string {
  const t = (text ?? "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export type NotificationItem = {
  id: string;
  type: "order" | "chat" | "customer";
  title: string;
  detail: string;
  created_at: string;
  link: string;
};

// GET /api/admin/notifications?email=... — trung tâm thông báo cho
// trang quản trị /admin/thong-bao. Thông báo được tạo trực tiếp từ
// dữ liệu MySQL (không bịa thông báo):
// - đơn đặt hàng mới: quote_requests có status 'moi';
// - tin nhắn mới: chat_threads có unread_admin = 1 (kèm tin nhắn
//   mới nhất của khách trong đoạn chat đó);
// - khách hàng mới: các tài khoản customers đăng ký gần nhất.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") ?? "";
  if (!(await isAdminEmail(email))) {
    return NextResponse.json(
      { ok: false, error: "Bạn chưa đăng nhập quản trị." },
      { status: 401 },
    );
  }
  try {
    const [orders, chats, customers] = await Promise.all([
      query<OrderRow>(
        "SELECT id, name, product_name, created_at FROM quote_requests WHERE status = 'moi' ORDER BY created_at DESC LIMIT 20",
      ),
      query<ChatRow>(
        `SELECT t.id AS thread_id, t.customer_name, t.customer_email, m.content, m.created_at
         FROM chat_threads t
         JOIN chat_messages m ON m.thread_id = t.id AND m.sender_type = 'customer'
         WHERE t.unread_admin = 1
           AND m.id = (SELECT MAX(id) FROM chat_messages WHERE thread_id = t.id AND sender_type = 'customer')
         ORDER BY m.created_at DESC
         LIMIT 20`,
      ),
      query<CustomerRow>(
        "SELECT id, name, email, created_at FROM customers ORDER BY created_at DESC LIMIT 20",
      ),
    ]);

    const items: NotificationItem[] = [];

    for (const o of orders) {
      items.push({
        id: `order-${o.id}`,
        type: "order",
        title: o.product_name
          ? `Đơn đặt hàng mới: ${o.name} đã đặt ${o.product_name}`
          : `Đơn đặt hàng mới: ${o.name} đã gửi yêu cầu báo giá`,
        detail: o.product_name ?? "Yêu cầu báo giá",
        created_at: toIso(o.created_at),
        link: "/admin/bao-gia",
      });
    }

    for (const c of chats) {
      items.push({
        id: `chat-${c.thread_id}`,
        type: "chat",
        title: `Tin nhắn mới từ ${c.customer_name || "khách hàng"}`,
        detail: truncate(c.content, 80),
        created_at: toIso(c.created_at),
        // Mở thẳng đoạn chat đó trong trang chat nội bộ của web
        // (/admin/tin-nhan?thread=...) để quản trị và khách trò
        // chuyện liên tục trong web — KHÔNG dùng Messenger.
        link: `/admin/tin-nhan?thread=${c.thread_id}`,
      });
    }

    for (const c of customers) {
      items.push({
        id: `customer-${c.id}`,
        type: "customer",
        title: `Khách hàng mới đăng ký: ${c.name}`,
        detail: c.email,
        created_at: toIso(c.created_at),
        link: "/admin/khach-hang",
      });
    }

    items.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    return NextResponse.json({
      ok: true,
      notifications: items.slice(0, 50),
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
