// Trạng thái đã đọc / đã xóa của thông báo quản trị — lưu ở trình
// duyệt (localStorage), vì thông báo được tạo trực tiếp từ dữ liệu
// MySQL (đơn mới, tin nhắn chưa đọc, khách mới) chứ không có bảng
// thông báo riêng. Đánh dấu đã đọc khi quản trị bấm vào thông báo;
// "Xóa hết" thì ẩn hẳn các thông báo đang hiện (không hiện lại
// khi tải lại trang).
export const NOTIF_READ_KEY = "sdn-notifications-read";
export const NOTIF_CLEARED_KEY = "sdn-notifications-cleared";
export const NOTIF_CHANGED_EVENT = "sdn-notifications-changed";

export function loadIdSet(key: string): Set<string> {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

export function saveIdSet(key: string, ids: Set<string>): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {
    // Không lưu được thì thôi — trạng thái chỉ mất khi tải lại trang.
  }
}

export function notifyChanged(): void {
  try {
    window.dispatchEvent(new Event(NOTIF_CHANGED_EVENT));
  } catch {
    // Không gửi được sự kiện thì huy hiệu tự làm mới khi đổi trang.
  }
}

// Thời gian tương đối tiếng Việt: "Vừa xong", "5 phút trước",
// "2 giờ trước", "Hôm qua", "3 ngày trước", hoặc ngày đầy đủ.
export function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Mới đây";
  const diff = Date.now() - d.getTime();
  if (diff < 0) return "Mới đây";
  const min = Math.floor(diff / 60000);
  if (min < 1) return "Vừa xong";
  if (min < 60) return `${min} phút trước`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} giờ trước`;
  const days = Math.floor(h / 24);
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
