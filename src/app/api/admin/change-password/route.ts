import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type AdminRow = {
  id: number;
  password_hash: string;
};

export async function POST(req: Request) {
  let body: { email?: string; current?: string; next?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const current = body.current ?? "";
  const next = body.next ?? "";

  try {
    const rows = await query<AdminRow>(
      "SELECT id, password_hash FROM admins WHERE email = ?",
      [email],
    );
    const admin = rows[0];
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy tài khoản." },
        { status: 404 },
      );
    }
    const ok = await verifyPassword(current, admin.password_hash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Mật khẩu hiện tại không đúng." },
        { status: 400 },
      );
    }
    if (next.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." },
        { status: 400 },
      );
    }
    const passwordHash = await hashPassword(next);
    await execute("UPDATE admins SET password_hash = ? WHERE email = ?", [
      passwordHash,
      email,
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
