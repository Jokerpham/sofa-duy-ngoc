"use client";

import { useState } from "react";

const FAQS = [
  {
    q: "Đóng một bộ sofa mới mất bao lâu?",
    a: "Tùy mẫu và kích thước, thường từ vài ngày đến khoảng 1–2 tuần kể từ khi chốt mẫu và chất liệu. Xưởng sẽ báo thời gian cụ thể khi tư vấn, và giao đúng hẹn đã thỏa thuận.",
  },
  {
    q: "Ghế cũ bọc lại có bền không?",
    a: "Bền, nếu khung ghế còn chắc. Xưởng kiểm tra khung, lò xo và mút trước khi bọc; phần nào yếu sẽ sửa luôn rồi mới bọc vải hoặc da mới, nên ghế dùng lại lâu dài.",
  },
  {
    q: "Xưởng có đến tận nhà đo đạc không?",
    a: "Có. Thợ đến tận nhà đo kích thước phòng và ghế, tư vấn mẫu, chất liệu và báo giá trực tiếp. Bạn chỉ cần gọi điện hoặc nhắn Zalo để hẹn lịch.",
  },
  {
    q: "Báo giá tính như thế nào?",
    a: "Giá tùy kích thước ghế, kiểu dáng và chất liệu vải/da bạn chọn. Gửi kích thước và ảnh ghế (hoặc ảnh mẫu ưng ý) qua Zalo hoặc form báo giá bên dưới, xưởng báo giá cụ thể cho bạn.",
  },
  {
    q: "Sofa có được bảo hành không?",
    a: "Có bảo hành khung và đường may theo thỏa thuận khi bàn giao. Trong thời gian bảo hành, ghế có vấn đề cứ gọi xưởng để được kiểm tra và xử lý.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="hoi-dap" className="scroll-mt-20 bg-cream">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="section-kicker text-center text-xs font-bold uppercase text-gold-dark">
          Hỏi đáp
        </p>
        <h2 className="mt-2 text-center text-3xl font-black text-coffee-deep sm:text-4xl">
          Câu hỏi thường gặp
        </h2>

        <div className="mt-10 space-y-3">
          {FAQS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-xl border border-coffee/10 bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-base font-extrabold text-coffee-deep">
                    {item.q}
                  </span>
                  <span className="shrink-0 text-xl font-black text-coffee">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>
                {isOpen && (
                  <p className="border-t border-coffee/10 px-5 py-4 text-base leading-relaxed text-coffee-deep/75">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
