import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";

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
};

function toCustomer(r: CustomerRow) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? "",
    address: r.address ?? "",
  };
}

export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email")?.trim().toLowerCase() ?? "";
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng cung cấp email." },
      { status: 400 },
    );
  }
  try {
    const rows = await query<CustomerRow>(
      "SELECT id, name, email, phone, address FROM customers WHERE email = ?",
      [email],
    );
    const customer = rows[0];
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy tài khoản." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, customer: toCustomer(customer) });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  let body: { email?: string; name?: string; phone?: string; address?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const address = (body.address ?? "").trim();

  if (!name || !phone) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng điền họ tên và số điện thoại." },
      { status: 400 },
    );
  }

  try {
    const result = await execute(
      "UPDATE customers SET name = ?, phone = ?, address = ? WHERE email = ?",
      [name, phone, address, email],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy tài khoản." },
        { status: 404 },
      );
    }
    const rows = await query<CustomerRow>(
      "SELECT id, name, email, phone, address FROM customers WHERE email = ?",
      [email],
    );
    const customer = rows[0];
    if (!customer) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy tài khoản." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, customer: toCustomer(customer) });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
