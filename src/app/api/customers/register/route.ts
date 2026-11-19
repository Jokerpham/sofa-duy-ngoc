import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CustomerRow = {
  id: number;
  email: string;
};

export async function POST(req: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirm?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const phone = (body.phone ?? "").trim();
  const password = body.password ?? "";
  const confirm = body.confirm ?? "";

  if (!name || !email || !phone || !password || !confirm) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng điền đầy đủ tất cả các trường." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Email không đúng định dạng. Hãy kiểm tra lại." },
      { status: 400 },
    );
  }
  if (password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Mật khẩu phải có ít nhất 6 ký tự." },
      { status: 400 },
    );
  }
  if (password !== confirm) {
    return NextResponse.json(
      { ok: false, error: "Mật khẩu nhập lại không khớp." },
      { status: 400 },
    );
  }

  try {
    const existing = await query<CustomerRow>(
      "SELECT id, email FROM customers WHERE email = ?",
      [email],
    );
    if (existing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.",
        },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    let insertId: number;
    try {
      const result = await execute(
        "INSERT INTO customers (name, email, phone, address, password_hash) VALUES (?, ?, ?, ?, ?)",
        [name, email, phone, "", passwordHash],
      );
      insertId = result.insertId;
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "ER_DUP_ENTRY") {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.",
          },
          { status: 400 },
        );
      }
      throw err;
    }

    return NextResponse.json({
      ok: true,
      customer: { id: insertId, name, email, phone, address: "" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
