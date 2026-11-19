import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type QuoteRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  product_name: string | null;
  message: string | null;
  status: string | null;
  created_at: Date | string;
};

// GET /api/admin/quotes?email=...&status=moi — danh sách yêu cầu
// báo giá cho trang quản trị /admin/bao-gia, mới nhất trước.
// Không truyền status (hoặc status=all) thì trả tất cả.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") ?? "";
  const status = (url.searchParams.get("status") ?? "").trim();
  if (!(await isAdminEmail(email))) {
    return NextResponse.json(
      { ok: false, error: "Bạn chưa đăng nhập quản trị." },
      { status: 401 },
    );
  }
  try {
    const rows =
      status && status !== "all"
        ? await query<QuoteRow>(
            "SELECT id, name, email, phone, product_name, message, status, created_at FROM quote_requests WHERE status = ? ORDER BY created_at DESC, id DESC",
            [status],
          )
        : await query<QuoteRow>(
            "SELECT id, name, email, phone, product_name, message, status, created_at FROM quote_requests ORDER BY created_at DESC, id DESC",
          );
    return NextResponse.json({
      ok: true,
      quotes: rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        product_name: r.product_name,
        message: r.message,
        status: r.status ?? "moi",
        created_at:
          r.created_at instanceof Date
            ? r.created_at.toISOString()
            : String(r.created_at),
      })),
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
