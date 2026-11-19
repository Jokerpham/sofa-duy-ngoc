import type { Metadata } from "next";
import NotificationsClient from "./NotificationsClient";

export const metadata: Metadata = {
  title: "Thông báo — Quản trị Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Trung tâm thông báo của quản trị Sofa Duy Ngọc (DN HOME) — Hải Phòng: đơn đặt hàng mới, tin nhắn mới của khách và khách hàng mới đăng ký.",
};

export default function AdminNotificationsPage() {
  return <NotificationsClient />;
}
