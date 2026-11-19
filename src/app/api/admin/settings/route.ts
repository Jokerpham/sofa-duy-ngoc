import { NextResponse } from "next/server";
import { execute, isD1, query } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin-api";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

// Tự tạo bảng nếu chưa có (phòng khi chưa chạy đoạn migration trong
// database/mysql/schema.sql hoặc database/d1/sofa-duy-ngoc-d1.sql) —
// lưu lần đầu vẫn chạy được. Cú pháp khác nhau giữa MySQL và D1
// (SQLite): MySQL dùng ON UPDATE CURRENT_TIMESTAMP, SQLite thì
// không hiểu câu đó nên dùng DEFAULT CURRENT_TIMESTAMP thôi.
async function ensureTable(): Promise<void> {
  if (isD1()) {
    await execute(
      'CREATE TABLE IF NOT EXISTS site_settings ("key" TEXT NOT NULL PRIMARY KEY, "value" TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)',
    );
  } else {
    await execute(
      "CREATE TABLE IF NOT EXISTS site_settings (`key` VARCHAR(50) NOT NULL PRIMARY KEY, `value` VARCHAR(255) NOT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)",
    );
  }
}

/** Số hợp lệ: chỉ gồm chữ số, dài 9–11 chữ số. Không hợp lệ → null. */
function validDigits(value: unknown): string | null {
  const digits = typeof value === "string" ? value.replace(/\D/g, "") : "";
  return digits.length >= 9 && digits.length <= 11 ? digits : null;
}

// GET /api/admin/settings?email=... — đọc số hiện tại (chỉ quản trị).
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email") ?? "";
  if (!(await isAdminEmail(email))) {
    return NextResponse.json(
      { ok: false, error: "Bạn chưa đăng nhập quản trị." },
      { status: 401 },
    );
  }
  try {
    await ensureTable();
    const rows = await query<{ key: string; value: string }>(
      "SELECT `key`, `value` FROM site_settings WHERE `key` IN ('phone_main', 'phone_secondary')",
    );
    const settings: Record<string, string> = {
      phone_main: SITE.phone1Tel,
      phone_secondary: SITE.phone2Tel,
    };
    for (const r of rows) {
      if (r.key === "phone_main" || r.key === "phone_secondary") {
        settings[r.key] = r.value;
      }
    }
    return NextResponse.json({ ok: true, settings });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}

// POST /api/admin/settings — lưu số mới (chỉ quản trị; khách hàng hay
// người ngoài gọi thẳng API này đều bị từ chối 401 nếu không phải email
// trong bảng admins, kể cả khi biết địa chỉ route).
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: unknown;
    phone_main?: unknown;
    phone_secondary?: unknown;
  };
  const email = typeof body.email === "string" ? body.email : "";
  if (!(await isAdminEmail(email))) {
    return NextResponse.json(
      { ok: false, error: "Bạn chưa đăng nhập quản trị." },
      { status: 401 },
    );
  }
  const main = validDigits(body.phone_main);
  const secondary = validDigits(body.phone_secondary);
  if (!main || !secondary) {
    return NextResponse.json(
      { ok: false, error: "Số điện thoại phải có 9–11 chữ số." },
      { status: 400 },
    );
  }
  try {
    await ensureTable();
    // Ghi đè số cũ nếu đã có: MySQL dùng ON DUPLICATE KEY UPDATE,
    // D1 (SQLite) dùng ON CONFLICT("key") DO UPDATE SET ...
    if (isD1()) {
      await execute(
        'INSERT INTO site_settings ("key", "value") VALUES (\'phone_main\', ?), (\'phone_secondary\', ?) ON CONFLICT("key") DO UPDATE SET "value" = excluded."value"',
        [main, secondary],
      );
    } else {
      await execute(
        "INSERT INTO site_settings (`key`, `value`) VALUES ('phone_main', ?), ('phone_secondary', ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
        [main, secondary],
      );
    }
    return NextResponse.json({
      ok: true,
      settings: { phone_main: main, phone_secondary: secondary },
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
