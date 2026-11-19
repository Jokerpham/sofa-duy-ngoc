import type { Metadata } from "next";
import About from "@/components/About";

export const metadata: Metadata = {
  title: "Xưởng sản xuất — Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Giới thiệu Xưởng Sofa Duy Ngọc (DN HOME) — sản xuất, bọc và sửa ghế sofa trực tiếp tại Hải Phòng.",
};

export default function XuongSanXuatPage() {
  return (
    <main>
      <About />
    </main>
  );
}
