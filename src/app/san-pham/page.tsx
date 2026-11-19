import type { Metadata } from "next";
import Products from "@/components/Products";

export const metadata: Metadata = {
  title: "Sản phẩm — Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "8 mẫu sofa thật của Xưởng Sofa Duy Ngọc: sofa da chữ L, sofa vải chữ L, sofa cổ điển nút bấm. Ảnh thật sản phẩm, báo giá theo mẫu.",
};

export default function SanPhamPage() {
  return (
    <main>
      <Products />
    </main>
  );
}
