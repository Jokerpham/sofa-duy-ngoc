// Tài khoản khách hàng — dữ liệu và mật khẩu kiểm tra qua API MySQL
// (xem src/app/api/customers/*). Phiên đăng nhập vẫn chỉ lưu email
// trong localStorage của trình duyệt (khóa CUSTOMER_SESSION_KEY);
// KHÔNG lưu tài khoản hay mật khẩu ở phía trình duyệt nữa.
export type Customer = {
  id?: number;
  name: string;
  email: string;
  phone: string;
  address: string;
};

export const CUSTOMER_SESSION_KEY = "sdn-customer-session";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getSessionEmail(): string | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { email?: string };
    return session.email ? String(session.email) : null;
  } catch {
    return null;
  }
}

async function postJson<T>(
  url: string,
  body: unknown,
): Promise<{ ok: boolean; error?: string } & T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
  } & T;
  return {
    ...data,
    ok: data.ok === true,
    error: data.error,
  };
}

function notifySessionChange(): void {
  if (!isBrowser()) return;
  // Báo cho header (và các chỗ khác) biết phiên khách đã đổi,
  // để tên người đăng nhập cập nhật ngay mà không cần tải lại trang.
  window.dispatchEvent(new Event("sdn-customer-session-changed"));
}

function setSession(email: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify({ email }));
  notifySessionChange();
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirm: string;
}): Promise<{ ok: boolean; error?: string; customer?: Customer }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const password = input.password;
  const confirm = input.confirm;

  if (!name || !email || !phone || !password || !confirm) {
    return { ok: false, error: "Vui lòng điền đầy đủ tất cả các trường." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Email không đúng định dạng. Hãy kiểm tra lại." };
  }
  if (password.length < 6) {
    return { ok: false, error: "Mật khẩu phải có ít nhất 6 ký tự." };
  }
  if (password !== confirm) {
    return { ok: false, error: "Mật khẩu nhập lại không khớp." };
  }
  try {
    const data = await postJson<{ customer?: Customer }>(
      "/api/customers/register",
      { name, email, phone, password, confirm },
    );
    if (!data.ok || !data.customer) {
      return { ok: false, error: data.error ?? "Đăng ký không thành công." };
    }
    setSession(data.customer.email);
    return { ok: true, customer: data.customer };
  } catch {
    return {
      ok: false,
      error: "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.",
    };
  }
}

export async function loginCustomer(
  email: string,
  password: string,
): Promise<{ ok: boolean; error?: string; customer?: Customer }> {
  const clean = email.trim().toLowerCase();
  if (!clean || !password) {
    return { ok: false, error: "Vui lòng nhập email và mật khẩu." };
  }
  try {
    const data = await postJson<{ customer?: Customer }>(
      "/api/customers/login",
      { email: clean, password },
    );
    if (!data.ok || !data.customer) {
      return { ok: false, error: data.error ?? "Đăng nhập không thành công." };
    }
    setSession(data.customer.email);
    return { ok: true, customer: data.customer };
  } catch {
    return {
      ok: false,
      error: "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.",
    };
  }
}

export async function getCustomerSession(): Promise<Customer | null> {
  const email = getSessionEmail();
  if (!email) return null;
  try {
    const res = await fetch(
      `/api/customers/me?email=${encodeURIComponent(email)}`,
    );
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      customer?: Customer;
    };
    if (!data.ok || !data.customer) return null;
    return data.customer;
  } catch {
    return null;
  }
}

export function logoutCustomer(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(CUSTOMER_SESSION_KEY);
  notifySessionChange();
}

// Sửa thông tin tài khoản (họ tên / số điện thoại / địa chỉ).
// Email là định danh đăng nhập nên không đổi được.
export async function updateCustomer(input: {
  name: string;
  phone: string;
  address: string;
}): Promise<{ ok: boolean; error?: string; customer?: Customer }> {
  const email = getSessionEmail();
  if (!email) {
    return { ok: false, error: "Bạn chưa đăng nhập. Hãy đăng nhập lại." };
  }
  const name = input.name.trim();
  const phone = input.phone.trim();
  const address = input.address.trim();
  if (!name || !phone) {
    return { ok: false, error: "Vui lòng điền họ tên và số điện thoại." };
  }
  try {
    const res = await fetch("/api/customers/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, phone, address }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      customer?: Customer;
    };
    if (!data.ok || !data.customer) {
      return { ok: false, error: data.error ?? "Lưu không thành công." };
    }
    notifySessionChange();
    return { ok: true, customer: data.customer };
  } catch {
    return {
      ok: false,
      error: "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.",
    };
  }
}

export async function changeCustomerPassword(
  current: string,
  next: string,
  confirm: string,
): Promise<{ ok: boolean; error?: string }> {
  const email = getSessionEmail();
  if (!email) {
    return { ok: false, error: "Bạn chưa đăng nhập. Hãy đăng nhập lại." };
  }
  if (next.length < 6) {
    return { ok: false, error: "Mật khẩu mới phải có ít nhất 6 ký tự." };
  }
  if (next !== confirm) {
    return { ok: false, error: "Mật khẩu mới nhập lại không khớp." };
  }
  try {
    const data = await postJson<Record<string, never>>(
      "/api/customers/change-password",
      { email, current, next, confirm },
    );
    if (!data.ok) {
      return {
        ok: false,
        error: data.error ?? "Đổi mật khẩu không thành công.",
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
