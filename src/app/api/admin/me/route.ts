import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type AdminRow = {
  id: number;
  name: string | null;
  email: string;
  role: string | null;
};

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng cung cấp email." },
      { status: 400 },
    );
  }
  try {
    const rows = await query<AdminRow>(
      "SELECT id, name, email, role FROM admins WHERE email = ?",
      [email],
    );
    const admin = rows[0];
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy tài khoản." },
        { status: 404 },
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
