import type { Metadata } from "next";
import ChangePasswordClient from "./ChangePasswordClient";

export const metadata: Metadata = {
  title: "Đổi mật khẩu — Quản trị Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Đổi mật khẩu tài khoản quản trị Xưởng Sofa Duy Ngọc (DN HOME) — Hải Phòng.",
};

export default function DoiMatKhauPage() {
  return <ChangePasswordClient />;
}
