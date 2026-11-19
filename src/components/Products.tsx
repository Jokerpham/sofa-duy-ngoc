"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTS, fetchProducts, formatPrice, type ProductStyle } from "@/lib/products";

type Style = "Tất cả" | ProductStyle;

const STYLES: Style[] = ["Tất cả", "Hiện đại", "Tân cổ điển", "Tối giản"];

export default function Products() {
  const router = useRouter();
  const [style, setStyle] = useState<Style>("Tất cả");
  // Hiển thị ngay bằng danh sách dự phòng, rồi thay bằng dữ liệu
  // từ API MySQL khi tải xong.
  const [products, setProducts] = useState(PRODUCTS);

  useEffect(() => {
    let cancelled = false;
    fetchProducts().then((list) => {
      if (!cancelled) setProducts(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown =
    style === "Tất cả" ? products : products.filter((p) => p.style === style);

  // Bấm vào thẻ sản phẩm (ảnh / tên / nút "Báo giá") thì đi tới trang
  // chi tiết của đúng mẫu đó (/san-pham/<slug>) — trang chi tiết mới
  // là trang bán hàng, nút MUA NGAY / THÊM VÀO GIỎ ở đó dẫn tới trang
  // đặt hàng /dat-hang (qua goToQuote, có chặn đăng nhập trước).
  const openDetail = (slug: string) => router.push(`/san-pham/${slug}`);

  return (
    <section id="san-pham" className="scroll-mt-20 bg-sand">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="section-kicker text-center text-xs font-bold uppercase text-gold-dark">
          Sản phẩm của xưởng
        </p>
        <h2 className="mt-2 text-center text-3xl font-black text-coffee-deep sm:text-4xl">
          Sofa đang bán
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-coffee-deep/70">
          Các mẫu sofa xưởng đang bán — ảnh thật sản phẩm. Ưng mẫu nào, bấm
          vào ảnh hoặc tên mẫu (hoặc nút "Báo giá") để xem chi tiết và đặt
          mua mẫu đó.
        </p>

        {/* Nút lọc theo phong cách */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {STYLES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStyle(s)}
              aria-pressed={style === s}
              className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                style === s
                  ? "bg-coffee text-white shadow"
                  : "border border-coffee/25 bg-white text-coffee-deep hover:border-coffee"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((p) => (
            <article
              key={p.name}
              onClick={() => openDetail(p.slug)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openDetail(p.slug);
                }
              }}
              tabIndex={0}
              aria-label={`Xem chi tiết ${p.name}`}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee"
            >
              <img
                src={p.img}
                alt={`${p.name} — ${p.desc}`}
                loading="lazy"
                className="h-52 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="flex flex-1 flex-col p-5">
                <p className="text-base font-extrabold leading-snug text-coffee-deep transition-colors group-hover:text-coffee">
                  {p.name}
                </p>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-coffee-deep/70">
                  {p.desc}
                </p>
                <p className="mt-3 text-sm text-coffee-deep/60">
                  Phong cách: {p.style}
                </p>
                {/* Giá kiểu MONA: mẫu có giảm thì giá giảm nổi bật +
                    giá gốc gạch ngang + nhãn -10%; mẫu thường chỉ
                    hiện giá thường; chưa có giá thì vẫn báo liên hệ. */}
                {p.sale_price && p.price ? (
                  <p className="mt-1 flex flex-wrap items-baseline gap-2">
                    <span className="text-xl font-black text-coffee">
                      {formatPrice(p.sale_price)}
                    </span>
                    <span className="text-sm font-semibold text-coffee-deep/50 line-through">
                      {formatPrice(p.price)}
                    </span>
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      -{Math.round((1 - p.sale_price / p.price) * 100)}%
                    </span>
                  </p>
                ) : (
                  <p className="mt-1 text-xl font-black text-coffee">
                    {p.price ? formatPrice(p.price) : "Giá: liên hệ báo giá"}
                  </p>
                )}
                {/* Nút Báo giá: đi tới trang chi tiết của mẫu này,
                    nút mua ở trang chi tiết dẫn tới trang đặt hàng. */}
                <button
                  type="button"
                  onClick={(e) => {
                    // Ngăn bấm nút kích hoạt thêm onClick của cả thẻ
                    // (cả hai đều đi tới cùng trang chi tiết).
                    e.stopPropagation();
                    openDetail(p.slug);
                  }}
                  className="mt-3 rounded-full bg-coffee py-2.5 text-center text-sm font-bold text-white transition hover:bg-coffee-dark"
                >
                  Báo giá
                </button>
              </div>
            </article>
          ))}
        </div>

        {shown.length === 0 && (
          <p className="mt-8 text-center text-base text-coffee-deep/70">
            Chưa có mẫu nào trong phong cách này — gọi cho xưởng để được tư vấn thêm.
          </p>
        )}
      </div>
    </section>
  );
}
