import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Cài đặt — Quản trị Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Đổi số điện thoại hiển thị trên web Xưởng Sofa Duy Ngọc (DN HOME) — Hải Phòng. Chỉ tài khoản quản trị mới đổi được.",
};

export default function AdminSettingsPage() {
  return <SettingsClient />;
}
