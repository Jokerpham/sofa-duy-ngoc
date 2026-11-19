import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

export async function POST(req: Request) {
  let body: {
    name?: string;
    email?: string;
    phone?: string;
    product_name?: string;
    message?: string;
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
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng nhập họ tên." },
      { status: 400 },
    );
  }

  try {
    const result = await execute(
      "INSERT INTO quote_requests (name, email, phone, product_name, message, status) VALUES (?, ?, ?, ?, ?, 'moi')",
      [
        name,
        (body.email ?? "").trim() || null,
        (body.phone ?? "").trim() || null,
        (body.product_name ?? "").trim() || null,
        (body.message ?? "").trim() || null,
      ],
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
