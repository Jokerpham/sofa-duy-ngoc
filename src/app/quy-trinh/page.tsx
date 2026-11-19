import type { Metadata } from "next";
import Process from "@/components/Process";

export const metadata: Metadata = {
  title: "Quy trình — Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Quy trình 5 bước của Xưởng Sofa Duy Ngọc: tư vấn & đo đạc, thiết kế & báo giá, sản xuất / bọc / sửa, giao hàng & lắp đặt, bảo hành.",
};

export default function QuyTrinhPage() {
  return (
    <main>
      <Process />
    </main>
  );
}
