"use client";

import { useEffect, useState } from "react";
import { PRODUCTS, fetchProducts } from "@/lib/products";

// Banner phụ: slider tự quay qua 8 ảnh sofa thật của xưởng.
// Đặt ngay dưới khối chữ THIẾT KẾ NỘI THẤT (sau banner chính và khối chữ,
// trước mục Sản phẩm). Đây là một mục riêng, tách biệt với banner chính
// tĩnh ở trên cùng — không chứa ảnh banner chính, không nằm trong hero.
// Bấm vào slide nào thì đi tới trang chi tiết của đúng mẫu đó
// (/san-pham/<slug>) — trang chi tiết là trang bán hàng, nút mua ở
// đó dẫn tới trang đặt hàng /dat-hang.
const AUTO_MS = 4000;

export default function SecondaryBanner() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  // Hiển thị ngay bằng danh sách dự phòng, rồi thay bằng dữ liệu
  // từ API MySQL khi tải xong.
  const [products, setProducts] = useState(PRODUCTS);
  const count = products.length;

  useEffect(() => {
    let cancelled = false;
    fetchProducts().then((list) => {
      if (!cancelled) setProducts(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (paused || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTO_MS);
    return () => clearInterval(t);
  }, [paused, count]);

  const go = (i: number) => setIndex(((i % count) + count) % count);

  return (
    <section aria-label="Mẫu sofa nổi bật" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="section-kicker text-center text-xs font-bold uppercase text-gold-dark">
          Bộ sưu tập
        </p>
        <h2 className="mt-2 text-center text-3xl font-black text-coffee-deep sm:text-4xl">
          Mẫu sofa nổi bật
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-coffee-deep/70">
          8 mẫu sofa thật của xưởng — bấm vào ảnh để xem chi tiết mẫu đó,
          xưởng sẽ tư vấn kích thước, chất liệu và báo giá cụ thể cho bạn.
        </p>

        <div
          className="relative mt-8 overflow-hidden rounded-2xl shadow-lg"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative aspect-[16/10] sm:aspect-[16/9] lg:aspect-[21/9]">
            {products.map((p, i) => (
              <a
                key={p.name}
                href={`/san-pham/${p.slug}`}
                aria-hidden={i !== index}
                tabIndex={i === index ? 0 : -1}
                className={`absolute inset-0 cursor-pointer transition-opacity duration-700 ${
                  i === index
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
              >
                <img
                  src={p.img}
                  alt={`${p.name} — ${p.desc}`}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-5 pb-12 pt-16 sm:px-8">
                  <span className="block text-xl font-extrabold text-white sm:text-2xl">
                    {p.name}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-white/85">
                    Phong cách: {p.style} • Bấm để xem chi tiết mẫu này
                  </span>
                </span>
              </a>
            ))}
          </div>

          {/* Mũi tên chuyển slide */}
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Mẫu trước"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-xl font-bold text-white transition hover:bg-black/65"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Mẫu sau"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-xl font-bold text-white transition hover:bg-black/65"
          >
            ›
          </button>

          {/* Chấm chọn slide */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {products.map((p, i) => (
              <button
                key={p.name}
                type="button"
                onClick={() => go(i)}
                aria-label={`Xem ${p.name}`}
                aria-current={i === index}
                className={`h-2.5 rounded-full transition-all ${
                  i === index
                    ? "w-7 bg-white"
                    : "w-2.5 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
