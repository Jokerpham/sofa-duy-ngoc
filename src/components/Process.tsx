const STEPS = [
  {
    title: "Tư vấn & đo đạc",
    desc: "Nghe nhu cầu của bạn, thợ đến tận nhà đo kích thước phòng và ghế cần làm.",
  },
  {
    title: "Thiết kế & báo giá",
    desc: "Tư vấn mẫu, chất liệu vải/da, màu sắc và báo giá rõ ràng trước khi làm.",
  },
  {
    title: "Sản xuất / Bọc / Sửa",
    desc: "Thợ xưởng thi công trực tiếp: đóng mới, bọc lại hoặc sửa chữa theo yêu cầu.",
  },
  {
    title: "Giao hàng & lắp đặt",
    desc: "Giao ghế tận nhà, lắp đặt gọn gàng, kiểm tra cùng bạn trước khi bàn giao.",
  },
  {
    title: "Bảo hành",
    desc: "Bảo hành khung và đường may theo thỏa thuận — có vấn đề cứ gọi xưởng.",
  },
];

export default function Process() {
  return (
    <section id="quy-trinh" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="section-kicker text-center text-xs font-bold uppercase text-gold-dark">
          Quy trình làm việc
        </p>
        <h2 className="mt-2 text-center text-3xl font-black text-coffee-deep sm:text-4xl">
          5 bước — rõ ràng, gọn gàng
        </h2>

        <ol className="mt-10 grid gap-6 md:grid-cols-3 lg:grid-cols-5">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-coffee/10 bg-cream p-6"
            >
              <span className="text-4xl font-black text-gold">{i + 1}</span>
              <h3 className="mt-3 text-lg font-extrabold leading-snug text-coffee-deep">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-coffee-deep/70">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
