import type { Metadata } from "next";
import { Suspense } from "react";
import OrderClient from "./OrderClient";

export const metadata: Metadata = {
  title: "Đặt hàng — Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Đặt mua sofa của Xưởng Sofa Duy Ngọc: chọn mẫu, điền thông tin liên hệ, xưởng sẽ gọi lại tư vấn và xác nhận đơn hàng.",
};

// Trang đặt hàng riêng (tách khỏi trang liên hệ chung): hiển thị mẫu
// khách vừa chọn, điền sẵn thông tin tài khoản đã đăng nhập, gửi yêu
// cầu về POST /api/quotes để hiện trong mục Yêu cầu báo giá của admin.
// Đọc ?mau=... nên cần Suspense khi xuất tĩnh.
export default function DatHangPage() {
  return (
    <main>
      <Suspense
        fallback={
          <div className="mx-auto max-w-4xl px-4 py-16 text-center text-base text-coffee-deep/70 sm:px-6 lg:px-8">
            Đang tải trang đặt hàng…
          </div>
        }
      >
        <OrderClient />
      </Suspense>
    </main>
  );
}
