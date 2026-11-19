import { NextResponse } from "next/server";
import { execute } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

// Trạng thái yêu cầu báo giá (khớp cột status của bảng quote_requests).
// Không export — file route của Next.js chỉ được export handler.
const QUOTE_STATUSES = [
  "moi",
  "da_lien_he",
  "da_bao_gia",
  "da_chot",
  "da_huy",
] as const;

// PATCH /api/admin/quotes/[id] — quản trị đổi trạng thái một yêu
// cầu báo giá. Body: { email, status }.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { ok: false, error: "Yêu cầu báo giá không hợp lệ." },
      { status: 400 },
    );
  }

  let body: { email?: string; status?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  if (!(await isAdminEmail(body.email ?? ""))) {
    return NextResponse.json(
      { ok: false, error: "Bạn chưa đăng nhập quản trị." },
      { status: 401 },
    );
  }

  const status = (body.status ?? "").trim();
  if (!(QUOTE_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { ok: false, error: "Trạng thái không hợp lệ." },
      { status: 400 },
    );
  }

  try {
    const result = await execute(
      "UPDATE quote_requests SET status = ? WHERE id = ?",
      [status, id],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy yêu cầu báo giá." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
