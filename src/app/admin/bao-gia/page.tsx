import type { Metadata } from "next";
import QuotesClient from "./QuotesClient";

export const metadata: Metadata = {
  title: "Yêu cầu báo giá — Quản trị Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Quản trị xem và xử lý các yêu cầu báo giá khách gửi từ form Liên hệ tới Xưởng Sofa Duy Ngọc (DN HOME) — Hải Phòng.",
};

export default function AdminQuotesPage() {
  return <QuotesClient />;
}
