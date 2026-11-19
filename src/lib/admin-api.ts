// Kiểm tra nhanh một email có phải tài khoản quản trị trong MySQL
// không — dùng chung cho các API route /api/admin/*. Mức bảo mật
// giống các route admin hiện có (phiên đăng nhập lưu trong
// localStorage, API xác thực lại bằng email trong bảng admins).
import { query } from "@/lib/db";

export async function isAdminEmail(email: string): Promise<boolean> {
  const clean = (email ?? "").trim().toLowerCase();
  if (!clean) return false;
  try {
    const rows = await query<{ id: number }>(
      "SELECT id FROM admins WHERE email = ?",
      [clean],
    );
    return rows.length > 0;
  } catch {
    return false;
  }
}
