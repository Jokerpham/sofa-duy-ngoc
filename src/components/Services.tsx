const SERVICES = [
  {
    title: "Đóng sofa theo yêu cầu",
    desc: "Đóng mới sofa văng, sofa góc L, sofa giường… theo đúng kích thước và kiểu dáng phòng khách của bạn.",
  },
  {
    title: "Bọc lại ghế cũ",
    desc: "Thay vải, thay da, thay mút cho ghế sofa cũ — ghế như mới mà tiết kiệm hơn mua ghế mới.",
  },
  {
    title: "Sửa chữa ghế sofa",
    desc: "Sửa khung gãy, lò xo xẹp, mút lún, chân ghế, tay vịn — khắc phục triệt để, dùng lại bền lâu.",
  },
  {
    title: "Sofa văn phòng",
    desc: "Sofa tiếp khách, sofa phòng chờ, ghế sofa văn phòng — lịch sự, chắc chắn, phù hợp không gian làm việc.",
  },
  {
    title: "Thiết kế phòng khách",
    desc: "Tư vấn bố trí sofa, bàn trà, kệ tivi hài hòa với diện tích và phong cách nội thất của gia đình.",
  },
  {
    title: "Đo đạc tận nhà",
    desc: "Thợ đến tận nhà đo kích thước, tư vấn mẫu và báo giá trực tiếp — không mất công mang ghế đi xa.",
  },
];

export default function Services() {
  return (
    <section id="dich-vu" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="section-kicker text-center text-xs font-bold uppercase text-gold-dark">
          Dịch vụ của chúng tôi
        </p>
        <h2 className="mt-2 text-center text-3xl font-black text-coffee-deep sm:text-4xl">
          Sản xuất — Bọc — Sửa lại ghế cũ
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-coffee-deep/70">
          Xưởng làm trực tiếp, không qua trung gian. Bạn chỉ cần mô tả nhu cầu,
          phần còn lại để thợ của Duy Ngọc lo.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => (
            <article
              key={s.title}
              className="rounded-2xl border border-coffee/10 bg-sand p-7 transition hover:border-coffee/30 hover:shadow-md"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-coffee text-lg font-black text-white">
                {i + 1}
              </span>
              <h3 className="mt-4 text-xl font-extrabold text-coffee-deep">
                {s.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-coffee-deep/70">
                {s.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
