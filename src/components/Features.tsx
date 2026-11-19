const ITEMS = [
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
        <path d="M3 11a2 2 0 0 1 4 0v1h10v-1a2 2 0 0 1 4 0v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3z" />
        <path d="M5 16v2M19 16v2" />
      </svg>
    ),
    title: "Sofa chất lượng",
    desc: "Khung gỗ chắc chắn, mút êm, vải bọc và da chọn lọc kỹ — ngồi êm, dùng bền theo năm tháng.",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    title: "Thiết kế hiện đại",
    desc: "Mẫu mã cập nhật theo xu hướng, phù hợp nhiều không gian: chung cư, nhà phố, biệt thự, văn phòng.",
  },
  {
    icon: (
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />
        <path d="M9 11.5l2 2 4-4" />
      </svg>
    ),
    title: "Bền đẹp lâu dài",
    desc: "Thi công tỉ mỉ từng đường kim mũi chỉ, bảo hành rõ ràng — ghế mới hay ghế bọc lại đều đẹp và bền.",
  },
];

export default function Features() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-coffee/10 bg-white p-7 shadow-sm"
            >
              <div className="text-coffee">{item.icon}</div>
              <h3 className="mt-4 text-xl font-extrabold text-coffee-deep">
                {item.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-coffee-deep/70">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
