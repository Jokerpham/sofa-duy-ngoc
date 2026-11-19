import type { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "Quản trị — Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Trang đăng nhập quản trị Xưởng Sofa Duy Ngọc (DN HOME) — Hải Phòng.",
};

export default function AdminPage() {
  return <AdminClient />;
}
