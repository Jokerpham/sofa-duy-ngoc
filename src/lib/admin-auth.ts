// Xác thực quản trị — tài khoản và mật khẩu kiểm tra qua API MySQL
// (xem src/app/api/admin/*). Phiên đăng nhập vẫn chỉ lưu
// { email, name, role } trong localStorage của trình duyệt;
// KHÔNG lưu mật khẩu ở phía trình duyệt nữa.
export type AdminUser = {
  id?: number;
  name: string;
  email: string;
  role: string;
};

export const SESSION_KEY = "sdn-session";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getSessionEmail(): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { email?: string };
    return session.email ? String(session.email) : null;
  } catch {
    return null;
  }
}

export async function login(
  email: string,
  password: string,
): Promise<AdminUser | null> {
  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      admin?: AdminUser;
    };
    if (!data.ok || !data.admin) return null;
    const user = data.admin;
    if (isBrowser()) {
      window.localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ email: user.email, name: user.name, role: user.role }),
      );
    }
    return user;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AdminUser | null> {
  const email = getSessionEmail();
  if (!email) return null;
  try {
    const res = await fetch(
      `/api/admin/me?email=${encodeURIComponent(email)}`,
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      admin?: AdminUser;
    };
    if (!data.ok || !data.admin) return null;
    return data.admin;
  } catch {
    return null;
  }
}

export function logout(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(SESSION_KEY);
}

export async function changePassword(
  current: string,
  next: string,
): Promise<{ ok: boolean; error?: string }> {
  const email = getSessionEmail();
  if (!email) {
    return { ok: false, error: "Bạn chưa đăng nhập. Hãy đăng nhập lại." };
  }
  if (next.length < 6) {
    return { ok: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
  }
  try {
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, current, next }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
    };
    if (!data.ok) {
      return {
        ok: false,
        error: data.error ?? "Đổi mật khẩu thất bại. Hãy thử lại.",
      };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.",
    };
  }
}
