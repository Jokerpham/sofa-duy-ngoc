import type { Metadata } from "next";
import ProductsClient from "./ProductsClient";

export const metadata: Metadata = {
  title: "Sản phẩm & Giá — Quản trị Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Quản trị xem và sửa giá gốc, giá giảm của 8 mẫu sofa đang bán tại Xưởng Sofa Duy Ngọc (DN HOME) — Hải Phòng.",
};

export default function AdminProductsPage() {
  return <ProductsClient />;
}
