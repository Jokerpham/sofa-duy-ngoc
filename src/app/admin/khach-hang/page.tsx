import type { Metadata } from "next";
import CustomersClient from "./CustomersClient";

export const metadata: Metadata = {
  title: "Khách hàng — Quản trị Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Quản trị xem thông tin liên hệ của khách hàng Sofa Duy Ngọc (DN HOME) — Hải Phòng: khách đã đăng ký tài khoản và khách đã đặt yêu cầu báo giá.",
};

export default function AdminCustomersPage() {
  return <CustomersClient />;
}
