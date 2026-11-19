import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type CustomerRow = {
  id: number;
};

// Quên mật khẩu (tài khoản khách): đặt lại mật khẩu mới bằng email.
// TẠM THỜI chỉ kiểm tra email có tồn tại rồi cho đặt lại luôn,
// CHƯA gửi email xác minh (web chưa có dịch vụ gửi mail) —
// giống phần quên mật khẩu demo của admin MONA. Trước khi cho
// khách thật dùng, cần thêm bước gửi mã/link xác minh qua email.
export async function POST(req: Request) {
  let body: { email?: string; password?: string; confirm?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const confirm = body.confirm ?? "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Email không đúng định dạng. Hãy kiểm tra lại." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." },
      { status: 400 },
    );
  }
  if (password !== confirm) {
    return NextResponse.json(
      { ok: false, error: "Mật khẩu mới nhập lại không khớp." },
      { status: 400 },
    );
  }

  try {
    const rows = await query<CustomerRow>(
      "SELECT id FROM customers WHERE email = ?",
      [email],
    );
    if (!rows[0]) {
      return NextResponse.json(
        { ok: false, error: "Email này chưa đăng ký tài khoản." },
        { status: 404 },
      );
    }
    const passwordHash = await hashPassword(password);
    await execute("UPDATE customers SET password_hash = ? WHERE email = ?", [
      passwordHash,
      email,
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
