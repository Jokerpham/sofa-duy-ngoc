import { NextResponse } from "next/server";
import { execute } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json(
      { ok: false, error: "Không tìm thấy đoạn chat." },
      { status: 404 },
    );
  }

  let body: { by?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    if (body.by === "admin") {
      await execute("UPDATE chat_threads SET unread_admin = 0 WHERE id = ?", [
        id,
      ]);
    } else if (body.by === "customer") {
      await execute(
        "UPDATE chat_threads SET unread_customer = 0 WHERE id = ?",
        [id],
      );
    } else {
      return NextResponse.json(
        { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
