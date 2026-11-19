import type { Metadata } from "next";
import Services from "@/components/Services";

export const metadata: Metadata = {
  title: "Dịch vụ — Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Đóng sofa theo yêu cầu, bọc lại ghế cũ, sửa chữa ghế sofa, sofa văn phòng, thiết kế phòng khách, đo đạc tận nhà — Xưởng Sofa Duy Ngọc, Hải Phòng.",
};

export default function DichVuPage() {
  return (
    <main>
      <Services />
    </main>
  );
}
