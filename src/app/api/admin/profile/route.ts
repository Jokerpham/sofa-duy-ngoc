import { NextResponse } from "next/server";
import { query, execute } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin-api";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

// Thông báo khi bảng admins chưa có cột avatar (database tạo từ
// schema.sql bản cũ) — admin chạy lệnh ALTER trong MySQL Workbench:
//   ALTER TABLE admins ADD COLUMN avatar LONGTEXT NULL;
const NEEDS_MIGRATION =
  "Chưa có cột avatar trong bảng admins — hãy chạy lệnh ALTER TABLE admins ADD COLUMN avatar LONGTEXT NULL; trong MySQL Workbench rồi thử lại.";

type AdminRow = {
  id: number;
  name: string | null;
  email: string;
  avatar?: string | null;
};

function getEmail(req: Request): string {
  return (
    new URL(req.url).searchParams.get("email")?.trim().toLowerCase() ?? ""
  );
}

// GET /api/admin/profile?email=... — lấy tên, email và logo (avatar)
// hiện tại của tài khoản quản trị. Nếu database chưa có cột avatar
// thì trả avatar = null kèm needsMigration để giao diện tự lưu tạm
// vào localStorage của trình duyệt.
export async function GET(req: Request) {
  const email = getEmail(req);
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng cung cấp email." },
      { status: 400 },
    );
  }
  if (!(await isAdminEmail(email))) {
    return NextResponse.json(
      { ok: false, error: "Bạn không phải tài khoản quản trị." },
      { status: 403 },
    );
  }
  try {
    const rows = await query<AdminRow>(
      "SELECT id, name, email, avatar FROM admins WHERE email = ?",
      [email],
    );
    const admin = rows[0];
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy tài khoản." },
        { status: 404 },
      );
    }
    return NextResponse.json({
      ok: true,
      admin: {
        id: admin.id,
        name: admin.name ?? "",
        email: admin.email,
        avatar: admin.avatar ?? null,
      },
    });
  } catch {
    // Có thể bảng admins chưa có cột avatar (schema bản cũ) — thử
    // đọc lại không có cột avatar để trang quản trị vẫn chạy được.
    try {
      const rows = await query<AdminRow>(
        "SELECT id, name, email FROM admins WHERE email = ?",
        [email],
      );
      const admin = rows[0];
      if (!admin) {
        return NextResponse.json(
          { ok: false, error: "Không tìm thấy tài khoản." },
          { status: 404 },
        );
      }
      return NextResponse.json({
        ok: true,
        needsMigration: true,
        admin: {
          id: admin.id,
          name: admin.name ?? "",
          email: admin.email,
          avatar: null,
        },
      });
    } catch {
      return NextResponse.json(
        { ok: false, error: DB_ERROR },
        { status: 500 },
      );
    }
  }
}

// PATCH /api/admin/profile — đổi (hoặc xóa) logo tài khoản quản trị.
// Body: { email, avatar } — avatar là data URL ảnh (data:image/...)
// hoặc null để xóa logo về mặc định. Ảnh đã được thu nhỏ ở phía
// trình duyệt trước khi gửi nên không lưu ảnh gốc nặng vào database.
export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    avatar?: string | null;
  };
  const email = (body.email ?? "").trim().toLowerCase();
  const avatar = body.avatar ?? null;
  if (!email) {
    return NextResponse.json(
      { ok: false, error: "Vui lòng cung cấp email." },
      { status: 400 },
    );
  }
  if (!(await isAdminEmail(email))) {
    return NextResponse.json(
      { ok: false, error: "Bạn không phải tài khoản quản trị." },
      { status: 403 },
    );
  }
  if (avatar !== null) {
    if (typeof avatar !== "string" || !avatar.startsWith("data:image/")) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng chọn file ảnh." },
        { status: 400 },
      );
    }
    // Giới hạn ~1MB ký tự (ảnh đã thu nhỏ còn tối đa 256px nên chỉ
    // vài chục KB) để tránh lưu chuỗi quá lớn vào database.
    if (avatar.length > 1000000) {
      return NextResponse.json(
        { ok: false, error: "Ảnh quá lớn. Hãy chọn ảnh nhỏ hơn." },
        { status: 400 },
      );
    }
  }
  try {
    const result = await execute(
      "UPDATE admins SET avatar = ? WHERE email = ?",
      [avatar, email],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy tài khoản." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, avatar });
  } catch {
    return NextResponse.json(
      { ok: false, error: NEEDS_MIGRATION, needsMigration: true },
      { status: 500 },
    );
  }
}
