// Băm và kiểm tra mật khẩu bằng bcryptjs (10 vòng băm).
// Mật khẩu gốc không bao giờ được lưu vào database — chỉ lưu chuỗi băm.
//
// Dùng bản ĐỒNG BỘ (hashSync / compareSync): bản bất đồng bộ của
// bcryptjs 3.x dùng setImmediate, mà Edge Runtime của Next (và
// worker trên Cloudflare Pages) chặn setImmediate nên đăng nhập /
// đăng ký đều lỗi 401/500. Bản đồng bộ chỉ dùng WebCrypto
// (crypto.getRandomValues, có sẵn trên Edge) và vòng lặp thuần JS
// nên chạy được. Hàm vẫn giữ chữ ký async để các route gọi như cũ.
import bcrypt from "bcryptjs";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hashSync(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}
