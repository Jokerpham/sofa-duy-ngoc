import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type CustomerRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
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
    const rows = await query<CustomerRow>(
      "SELECT id, name, email, phone, address, password_hash FROM customers WHERE email = ?",
      [email],
    );
    const customer = rows[0];
    if (!customer) {
      return NextResponse.json(
        {
          ok: false,
          error: "Email này chưa đăng ký tài khoản. Hãy đăng ký trước.",
        },
        { status: 401 },
      );
    }
    const ok = await verifyPassword(password, customer.password_hash);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: "Mật khẩu không đúng. Hãy kiểm tra lại." },
        { status: 401 },
      );
    }
    return NextResponse.json({
      ok: true,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? "",
        address: customer.address ?? "",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
