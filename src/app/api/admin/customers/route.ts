import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type CustomerRow = {
  name: string;
  email: string;
  phone: string | null;
  created_at: Date | string;
};

type QuoteRow = {
  name: string;
  email: string | null;
  phone: string | null;
  created_at: Date | string;
};

function normEmail(v: string | null | undefined): string {
  return (v ?? "").trim().toLowerCase();
}

// Chuẩn hoá số điện thoại Việt Nam để so khớp: chỉ giữ chữ số,
// "+84..." / "84..." đổi thành "0...".
function normPhone(v: string | null | undefined): string {
  let d = (v ?? "").replace(/\D/g, "");
  if (d.startsWith("84") && d.length >= 11) d = `0${d.slice(2)}`;
  return d;
}

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

type MergedCustomer = {
  name: string;
  email: string;
  phone: string;
  registered_at: string | null;
  order_count: number;
  last_activity: string;
};

// GET /api/admin/customers?email=... — danh sách khách hàng cho trang
// quản trị /admin/khach-hang: gộp khách đã đăng ký tài khoản (bảng
// customers) với khách chỉ đặt yêu cầu báo giá (bảng quote_requests),
// trùng nhau theo email (hoặc số điện thoại khi không có email).
// Số đơn đã đặt đếm từ quote_requests theo email / số điện thoại.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") ?? "";
  if (!(await isAdminEmail(email))) {
    return NextResponse.json(
      { ok: false, error: "Bạn chưa đăng nhập quản trị." },
      { status: 401 },
    );
  }
  try {
    const [customers, quotes] = await Promise.all([
      query<CustomerRow>(
        "SELECT name, email, phone, created_at FROM customers ORDER BY created_at DESC",
      ),
      query<QuoteRow>(
        "SELECT name, email, phone, created_at FROM quote_requests ORDER BY created_at DESC",
      ),
    ]);

    const merged: MergedCustomer[] = [];
    const byEmail = new Map<string, MergedCustomer>();
    const byPhone = new Map<string, MergedCustomer>();

    const findMatch = (
      qEmail: string,
      qPhone: string,
    ): MergedCustomer | null => {
      if (qEmail && byEmail.has(qEmail)) return byEmail.get(qEmail)!;
      if (qPhone && byPhone.has(qPhone)) return byPhone.get(qPhone)!;
      return null;
    };

    for (const c of customers) {
      const e = normEmail(c.email);
      const p = normPhone(c.phone);
      const item: MergedCustomer = {
        name: c.name,
        email: e,
        phone: (c.phone ?? "").trim(),
        registered_at: toIso(c.created_at),
        order_count: 0,
        last_activity: toIso(c.created_at),
      };
      merged.push(item);
      if (e) byEmail.set(e, item);
      if (p) byPhone.set(p, item);
    }

    for (const q of quotes) {
      const e = normEmail(q.email);
      const p = normPhone(q.phone);
      const qIso = toIso(q.created_at);
      const match = findMatch(e, p);
      if (match) {
        match.order_count += 1;
        if (!match.email && e) {
          match.email = e;
          byEmail.set(e, match);
        }
        if (!match.phone && (q.phone ?? "").trim()) {
          match.phone = (q.phone ?? "").trim();
          if (p) byPhone.set(p, match);
        }
        if (qIso > match.last_activity) match.last_activity = qIso;
      } else {
        const item: MergedCustomer = {
          name: q.name,
          email: e,
          phone: (q.phone ?? "").trim(),
          registered_at: null,
          order_count: 1,
          last_activity: qIso,
        };
        merged.push(item);
        if (e) byEmail.set(e, item);
        if (p) byPhone.set(p, item);
      }
    }

    merged.sort((a, b) => (a.last_activity < b.last_activity ? 1 : -1));

    return NextResponse.json({
      ok: true,
      customers: merged.map(({ name, email, phone, registered_at, order_count }) => ({
        name,
        email,
        phone,
        registered_at,
        order_count,
      })),
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
