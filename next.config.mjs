/** @type {import('next').NextConfig} */
const nextConfig = {
  // Web chạy dạng máy chủ Node khi chạy local (API routes nối MySQL:
  // chạy local bằng `npm run dev`; chạy thật bằng `npm run build`
  // rồi `npm start`). Ngoài ra web có thể deploy lên Cloudflare
  // Pages + D1 bằng `npm run pages:build` (xem wrangler.toml).
  images: {
    // Ảnh dùng thẻ <img> thường nên không cần tối ưu qua next/image.
    unoptimized: true,
  },
};

export default nextConfig;

// Chạy local với D1 (CHỈ khi bật USE_D1_DEV=1): nạp các binding
// Cloudflare khai báo trong wrangler.toml — gồm database D1
// "sofa-duy-ngoc" (binding DB) — vào dev server dưới dạng D1 local
// (miniflare, dữ liệu lưu ở .wrangler/state). Nhờ vậy
// getRequestContext().env.DB có giá trị ngay cả khi chạy local, và
// các API route dùng D1 y như trên Pages.
//
// Mặc định (không đặt USE_D1_DEV): KHÔNG gọi setupDevPlatform, nên
// `npm run dev` bình thường của Sơn vẫn dùng MySQL local như trước
// (DATABASE_URL trong .env). Muốn thử D1 local thì chạy:
//   USE_D1_DEV=1 npm run dev
// (trên Windows PowerShell: $env:USE_D1_DEV="1"; npm run dev)
//
// Chỉ chạy ở development; lúc `next build` (NODE_ENV=production)
// thì bỏ qua.
//
// Dùng dynamic import thay vì import tĩnh ở đầu file để `npm run dev`
// bình thường vẫn chạy được ngay cả khi chưa chạy `npm install`
// (gói @cloudflare/next-on-pages chưa có trong node_modules).
if (process.env.NODE_ENV === "development" && process.env.USE_D1_DEV === "1") {
  const { setupDevPlatform } = await import("@cloudflare/next-on-pages/next-dev");
  await setupDevPlatform();
}
