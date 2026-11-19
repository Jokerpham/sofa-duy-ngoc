// Hàm dùng chung cho các API quản trị sản phẩm
// (/api/admin/products và /api/admin/products/[id]):
// làm sạch chuỗi, kiểm tra kiểu dáng và giá VND.

export const PRODUCT_STYLES = ["Hiện đại", "Tân cổ điển", "Tối giản"];

// Chuỗi hợp lệ -> chuỗi đã cắt khoảng trắng; rỗng / không phải
// chuỗi -> null (để trống).
export function cleanText(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

// Kiểu dáng hợp lệ -> đúng 1 trong 3 giá trị; còn lại -> null.
export function cleanStyle(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return (PRODUCT_STYLES as string[]).includes(t) ? t : null;
}

// Số VND hợp lệ -> số nguyên; null -> null (để trống);
// còn lại -> undefined (không hợp lệ).
export function parsePrice(v: unknown): number | null | undefined {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return undefined;
  return Math.round(n);
}
