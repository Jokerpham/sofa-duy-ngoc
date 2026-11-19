import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

// GET /api/settings — số điện thoại hiển thị trên shop. Chỉ đọc, công khai
// (số điện thoại vốn đã hiện trên web). Không tải được hoặc chưa lưu gì
// thì trả về số mặc định trên banner.
export async function GET() {
  const fallback = {
    phone_main: SITE.phone1Tel,
    phone_secondary: SITE.phone2Tel,
  };
  try {
    const rows = await query<{ key: string; value: string }>(
      "SELECT `key`, `value` FROM site_settings WHERE `key` IN ('phone_main', 'phone_secondary')",
    );
    const settings: Record<string, string> = {
      ...fallback,
    };
    for (const r of rows) {
      if (r.key === "phone_main") settings.phone_main = r.value;
      else if (r.key === "phone_secondary") settings.phone_secondary = r.value;
    }
    return NextResponse.json({ ok: true, settings });
  } catch {
    return NextResponse.json({ ok: true, settings: fallback });
  }
}
