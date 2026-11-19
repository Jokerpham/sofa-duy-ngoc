"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PRODUCTS, fetchProducts, formatPrice } from "@/lib/products";

// Bảng xếp hạng "Sofa bán chạy nhất" trên trang chủ — kiểu danh sách
// xếp hạng như mục "Hottest" truyện tranh: mỗi dòng là ảnh nhỏ vuông
// bên trái, số thứ hạng lớn bên cạnh, tên mẫu in đậm, phong cách phía
// dưới và dòng giá. Chưa có số liệu bán hàng thật nên thứ hạng 1–8
// là thứ tự sản phẩm hiện tại. Bấm vào dòng nào thì đi tới trang chi
// tiết của đúng mẫu đó (/san-pham/<slug>) — trang chi tiết là trang
// bán hàng, nút mua ở đó dẫn tới trang đặt hàng /dat-hang.
export default function BestSellers() {
  const router = useRouter();
  // Hiển thị ngay bằng danh sách dự phòng, rồi thay bằng dữ liệu
  // từ API MySQL khi tải xong (giá MySQL được ưu tiên).
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

  const openDetail = (slug: string) => router.push(`/san-pham/${slug}`);

  return (
    <section
      id="sofa-ban-chay"
      aria-label="Sofa bán chạy nhất"
      className="scroll-mt-20 bg-[#241208]"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="section-kicker text-center text-xs font-bold uppercase text-[#FFD9A0]">
          Bảng xếp hạng
        </p>
        <h2 className="mt-2 text-center text-3xl font-black text-[#EADBC6] sm:text-4xl">
          Sofa bán chạy nhất
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-[#EADBC6]/70">
          8 mẫu sofa được khách hỏi nhiều nhất — bấm vào mẫu nào để xem
          chi tiết và đặt mua mẫu đó.
        </p>

        <ol className="mx-auto mt-10 max-w-3xl">
          {products.map((p, i) => (
            <li key={p.name} className="border-b border-white/10 first:border-t">
              <article
                onClick={() => openDetail(p.slug)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDetail(p.slug);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Hạng ${i + 1}: ${p.name} — bấm để xem chi tiết`}
                className="group flex cursor-pointer items-center gap-4 py-4 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD9A0] sm:gap-5 sm:px-3"
              >
                {/* Ảnh nhỏ vuông bên trái */}
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-lg object-cover sm:h-[72px] sm:w-[72px]"
                />
                {/* Số thứ hạng lớn, tông xám nhạt như mục Hottest */}
                <span
                  aria-hidden="true"
                  className="w-10 shrink-0 text-center text-4xl font-black leading-none text-[#EADBC6]/35 transition-colors group-hover:text-[#FFD9A0]/70 sm:text-5xl"
                >
                  {i + 1}
                </span>
                {/* Tên mẫu + phong cách + giá */}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-extrabold leading-snug text-[#FAF6F0] transition-colors group-hover:text-[#FFD9A0] sm:text-lg">
                    {p.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-[#EADBC6]/60">
                    Phong cách: {p.style}
                  </span>
                  {p.sale_price && p.price ? (
                    <span className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="text-base font-black text-[#FFD9A0]">
                        {formatPrice(p.sale_price)}
                      </span>
                      <span className="text-sm font-semibold text-[#EADBC6]/45 line-through">
                        {formatPrice(p.price)}
                      </span>
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        -{Math.round((1 - p.sale_price / p.price) * 100)}%
                      </span>
                    </span>
                  ) : (
                    <span className="mt-1 block text-base font-black text-[#FFD9A0]">
                      {p.price ? formatPrice(p.price) : "Giá: liên hệ báo giá"}
                    </span>
                  )}
                </span>
                {/* Mũi tên sang trang chi tiết */}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl font-bold text-[#EADBC6]/40 transition group-hover:translate-x-1 group-hover:text-[#FFD9A0]"
                >
                  ›
                </span>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
