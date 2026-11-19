import type { Metadata } from "next";
import Faq from "@/components/Faq";

export const metadata: Metadata = {
  title: "Hỏi đáp — Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Hỏi đáp về đóng sofa mới, bọc lại ghế cũ, đo đạc tận nhà, cách tính giá và bảo hành — Xưởng Sofa Duy Ngọc, Hải Phòng.",
};

export default function HoiDapPage() {
  return (
    <main>
      <Faq />
    </main>
  );
}
