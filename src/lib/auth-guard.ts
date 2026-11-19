// Kiểm tra đăng nhập trước khi khách bấm nút mua hàng / báo giá
// (Báo giá, BOOK NOW). Phiên khách lưu email trong localStorage,
// tài khoản kiểm tra qua API MySQL (xem src/lib/customer-auth.ts).
//
// Cách dùng: bấm nút hành động thì gọi goToQuote(đích) thay vì mở
// thẳng link — đã đăng nhập thì đi thẳng tới đích, chưa đăng nhập
// thì lưu đích vào "sdn-return-url" rồi chuyển sang /tai-khoan.
// Sau khi đăng nhập / đăng ký xong ở /tai-khoan, trang đó đọc lại
// "sdn-return-url" và tự đưa khách về đúng trang vừa rồi.

import { getCustomerSession } from "./customer-auth";

export const RETURN_URL_KEY = "sdn-return-url";

export async function isCustomerLoggedIn(): Promise<boolean> {
  return (await getCustomerSession()) !== null;
}

// Chỉ cho phép quay về đường dẫn nội bộ của chính web này
// (chống link lạ chèn vào localStorage rồi đá khách ra ngoài).
export function isSafeReturnUrl(url: string): boolean {
  if (!url.startsWith("/") || url.startsWith("//")) return false;
  if (url === "/tai-khoan" || url.startsWith("/tai-khoan?")) return false;
  return true;
}

export function saveReturnUrl(url: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RETURN_URL_KEY, url);
}

// Đọc rồi xóa luôn — chỉ dùng 1 lần sau khi đăng nhập xong.
export function consumeReturnUrl(): string | null {
  if (typeof window === "undefined") return null;
  const url = window.localStorage.getItem(RETURN_URL_KEY);
  if (url) window.localStorage.removeItem(RETURN_URL_KEY);
  return url;
}

// Nút MUA NGAY / THÊM VÀO GIỎ / Báo giá: đã đăng nhập thì đi thẳng tới đích
// (vd: /dat-hang?mau=Tên mẫu), chưa đăng nhập thì lưu đích lại
// rồi chuyển sang /tai-khoan để đăng nhập / đăng ký trước.
export async function goToQuote(destination: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (await isCustomerLoggedIn()) {
    window.location.assign(destination);
  } else {
    saveReturnUrl(destination);
    window.location.assign("/tai-khoan");
  }
}

// Sau khi đăng nhập / đăng ký xong ở /tai-khoan: nếu có trang
// khách định tới trước đó thì đưa về đó, không có thì ở lại.
export function redirectAfterLogin(): boolean {
  const url = consumeReturnUrl();
  if (url && isSafeReturnUrl(url)) {
    window.location.assign(url);
    return true;
  }
  return false;
}
