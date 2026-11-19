import type { Metadata } from "next";
import GiamGiaClient from "./GiamGiaClient";

export const metadata: Metadata = {
  title: "Giảm giá — Quản trị Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Quản trị bật/tắt giảm giá và sửa giá giảm của 8 mẫu sofa đang bán tại Xưởng Sofa Duy Ngọc (DN HOME) — Hải Phòng.",
};

export default function AdminGiamGiaPage() {
  return <GiamGiaClient />;
}
