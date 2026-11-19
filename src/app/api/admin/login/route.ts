import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type AdminRow = {
  id: number;
  name: string | null;
  email: string;
  role: string | null;
  password_hash: string;
};

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
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

  try {
    const rows = await query<AdminRow>(
      "SELECT id, name, email, role, password_hash FROM admins WHERE email = ?",
      [email],
    );
    const admin = rows[0];
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Email hoặc mật khẩu không đúng. Hãy kiểm tra lại." },
        { status: 401 },
      );
    }
    const ok = await verifyPassword(password, admin.password_hash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Email hoặc mật khẩu không đúng. Hãy kiểm tra lại." },
        { status: 401 },
      );
    }
    return NextResponse.json({
      ok: true,
      admin: {
        id: admin.id,
        name: admin.name ?? "",
        email: admin.email,
        role: admin.role ?? "admin",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
