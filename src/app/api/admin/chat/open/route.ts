import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

// POST /api/admin/chat/open — quản trị mở đoạn chat với một khách
// hàng từ trang /admin/khach-hang: tìm đoạn chat đã có theo email
// khách (mới nhất), nếu chưa có thì tạo đoạn chat trống mới (không
// bịa tin nhắn của khách — quản trị sẽ là người nhắn đầu tiên).
// Chỉ tài khoản quản trị (bảng admins) mới gọi được.
export async function POST(req: Request) {
  let body: { adminEmail?: string; name?: string; email?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const adminEmail = (body.adminEmail ?? "").trim();
  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();

  if (!(await isAdminEmail(adminEmail))) {
    return NextResponse.json(
      { ok: false, error: "Bạn chưa đăng nhập quản trị." },
      { status: 401 },
    );
  }
  if (!email || !name) {
    return NextResponse.json(
      { ok: false, error: "Thiếu tên hoặc email khách hàng." },
      { status: 400 },
    );
  }

  try {
    const existing = await query<{ id: number }>(
      "SELECT id FROM chat_threads WHERE customer_email = ? ORDER BY updated_at DESC LIMIT 1",
      [email],
    );
    if (existing.length > 0) {
      return NextResponse.json({
        ok: true,
        threadId: String(existing[0].id),
        created: false,
      });
    }
    const result = await execute(
      "INSERT INTO chat_threads (customer_name, customer_email, subject, unread_admin, unread_customer) VALUES (?, ?, ?, 0, 0)",
      [name, email, "Trò chuyện với shop"],
    );
    return NextResponse.json({
      ok: true,
      threadId: String(result.insertId),
      created: true,
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
