import type { Metadata } from "next";
import TaiKhoanClient from "./TaiKhoanClient";

export const metadata: Metadata = {
  title: "Tài khoản — Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Đăng ký và đăng nhập tài khoản khách hàng của Xưởng Sofa Duy Ngọc (DN HOME) — Hải Phòng, để nhận báo giá và theo dõi yêu cầu của bạn.",
};

export default function TaiKhoanPage() {
  return <TaiKhoanClient />;
}
