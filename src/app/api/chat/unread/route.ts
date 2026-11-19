import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type CountRow = {
  c: number;
};

export async function GET() {
  try {
    const rows = await query<CountRow>(
      "SELECT COUNT(*) AS c FROM chat_threads WHERE unread_admin = 1",
    );
    return NextResponse.json({ ok: true, unreadAdmin: Number(rows[0]?.c ?? 0) });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
