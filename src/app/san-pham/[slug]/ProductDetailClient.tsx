"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PRODUCTS, fetchProducts, formatPrice } from "@/lib/products";
import { goToQuote } from "@/lib/auth-guard";

type Product = (typeof PRODUCTS)[number];

// Trang chi tiết mẫu sofa, kiểu trang bán sản phẩm của Nhà Xinh:
// ảnh lớn bên trái; bên phải là tên + tem NEW, giá, phong cách,
// kích thước, chất liệu, mã sản phẩm, tình trạng hàng, chọn số
// lượng, nút MUA NGAY / THÊM VÀO GIỎ, tim yêu thích; banner giảm
// 5% cho thành viên; 4 mục mở ra được (Chi tiết, Kích thước,
// Bảo hành, Giao hàng & lắp đặt).
//
// Chưa có giỏ hàng / thanh toán nên cả hai nút mua đều đi tới trang
// đặt hàng /dat-hang qua goToQuote (chưa đăng nhập thì sang /tai-khoan
// trước, xong tự quay lại trang đặt hàng đã điền sẵn mẫu này).
// Kích thước, chất liệu, mã sản phẩm và các mục Bảo hành / Giao hàng
// chưa có số liệu thật nên hiện "Đang cập nhật" — chủ xưởng điền
// trong trang /admin/san-pham (mục Sản phẩm & Giá) thì trang chi
// tiết hiện số liệu đó ngay. Tem NEW hiện cho cả 8 mẫu vì đều là
// sản phẩm mới (chưa có dữ liệu tag riêng từng mẫu).
export default function ProductDetailClient({
  product: initial,
}: {
  product: Product;
}) {
  // Hiển thị ngay bằng dữ liệu dự phòng, rồi thay bằng dữ liệu
  // từ API MySQL khi tải xong (giá MySQL được ưu tiên).
  const [product, setProduct] = useState<Product>(initial);
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(false);
  // Mục "Chi tiết" mở sẵn vì có nội dung thật; 3 mục còn lại đóng.
  const [open, setOpen] = useState<Record<string, boolean>>({
    chitiet: true,
    kichthuoc: false,
    baohanh: false,
    giaohang: false,
  });

  useEffect(() => {
    let cancelled = false;
    fetchProducts().then((list) => {
      if (cancelled) return;
      const found = list.find((p) => p.slug === initial.slug);
      if (found) setProduct(found);
    });
    return () => {
      cancelled = true;
    };
  }, [initial.slug]);

  const orderUrl = `/dat-hang?mau=${encodeURIComponent(product.name)}`;
  const buy = () => goToQuote(orderUrl);

  // Kích thước / chất liệu / mã do quản trị điền trong
  // /admin/san-pham; trống thì vẫn hiện "Đang cập nhật".
  const sizeText = product.size ?? "Đang cập nhật";
  const materialText = product.material ?? "Đang cập nhật";
  const codeText = product.code ?? "Đang cập nhật";

  const sections: {
    key: string;
    title: string;
    body: string;
  }[] = [
    { key: "chitiet", title: "Chi tiết", body: product.desc },
    {
      key: "kichthuoc",
      title: "Kích thước",
      body: product.size
        ? `Kích thước: ${product.size}.`
        : "Đang cập nhật — xưởng sẽ bổ sung kích thước cụ thể của mẫu này sau.",
    },
    {
      key: "baohanh",
      title: "Bảo hành",
      body: "Đang cập nhật — xưởng sẽ bổ sung chính sách bảo hành của mẫu này sau.",
    },
    {
      key: "giaohang",
      title: "Giao hàng & lắp đặt",
      body: "Đang cập nhật — xưởng sẽ bổ sung thông tin giao hàng và lắp đặt của mẫu này sau.",
    },
  ];

  return (
    <div className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Đường dẫn: Trang chủ / Sản phẩm / Tên mẫu */}
        <nav aria-label="Đường dẫn" className="text-sm text-coffee-deep/60">
          <Link href="/" className="hover:text-coffee hover:underline">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <Link href="/san-pham" className="hover:text-coffee hover:underline">
            Sản phẩm
          </Link>
          <span className="mx-2">/</span>
          <span className="font-semibold text-coffee-deep">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          {/* Ảnh lớn bên trái */}
          <div>
            <img
              src={product.img}
              alt={`${product.name} — ${product.desc}`}
              className="w-full rounded-2xl object-cover shadow-lg"
            />
          </div>

          {/* Thông tin bên phải */}
          <div>
            <h1 className="flex flex-wrap items-center gap-3 text-3xl font-black leading-tight text-coffee-deep sm:text-4xl">
              {product.name}
              <span className="rounded bg-red-600 px-2 py-1 text-xs font-bold uppercase tracking-wider text-white">
                New
              </span>
            </h1>

            {/* Giá kiểu MONA: mẫu có giảm thì giá giảm nổi bật +
                giá gốc gạch ngang + nhãn -10%; mẫu thường chỉ
                hiện giá thường; chưa có giá thì vẫn báo liên hệ. */}
            {product.sale_price && product.price ? (
              <p className="mt-4 flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-black text-coffee">
                  {formatPrice(product.sale_price)}
                </span>
                <span className="text-lg font-semibold text-coffee-deep/50 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="rounded-full bg-red-500 px-2.5 py-1 text-sm font-bold text-white">
                  -
                  {Math.round(
                    (1 - product.sale_price / product.price) * 100,
                  )}
                  %
                </span>
              </p>
            ) : (
              <p className="mt-4 text-3xl font-black text-coffee">
                {product.price ? formatPrice(product.price) : "Giá: liên hệ báo giá"}
              </p>
            )}

            {/* Thông tin mẫu */}
            <dl className="mt-6 space-y-2.5 border-t border-coffee/10 pt-6 text-base">
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 font-bold text-coffee-deep/60">
                  Phong cách:
                </dt>
                <dd className="font-semibold text-coffee-deep">{product.style}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 font-bold text-coffee-deep/60">
                  Kích thước:
                </dt>
                <dd className="text-coffee-deep/70">{sizeText}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 font-bold text-coffee-deep/60">
                  Chất liệu:
                </dt>
                <dd className="text-coffee-deep/70">{materialText}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 font-bold text-coffee-deep/60">
                  Mã sản phẩm:
                </dt>
                <dd className="text-coffee-deep/70">{codeText}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-32 shrink-0 font-bold text-coffee-deep/60">
                  Tình trạng:
                </dt>
                <dd className="font-semibold text-coffee-deep">
                  Hàng có sẵn —{" "}
                  <Link href="/lien-he" className="text-coffee underline hover:text-coffee-dark">
                    Xem cửa hàng trưng bày
                  </Link>
                </dd>
              </div>
            </dl>

            {/* Chọn số lượng + nút mua + tim yêu thích */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div
                className="flex items-center rounded-full border border-coffee/25 bg-white"
                aria-label="Chọn số lượng"
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  aria-label="Giảm số lượng"
                  className="flex h-12 w-11 items-center justify-center text-xl font-bold text-coffee-deep transition hover:text-coffee"
                >
                  −
                </button>
                <span
                  className="w-8 text-center text-base font-bold text-coffee-deep"
                  aria-live="polite"
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  aria-label="Tăng số lượng"
                  className="flex h-12 w-11 items-center justify-center text-xl font-bold text-coffee-deep transition hover:text-coffee"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={buy}
                className="flex-1 rounded-full bg-[#241208] px-6 py-3.5 text-base font-bold text-white shadow transition hover:bg-coffee-dark sm:flex-none sm:px-10"
              >
                MUA NGAY
              </button>
              <button
                type="button"
                onClick={buy}
                className="flex-1 rounded-full border-2 border-[#241208] bg-white px-6 py-3 text-base font-bold text-[#241208] transition hover:bg-[#241208] hover:text-white sm:flex-none sm:px-8"
              >
                THÊM VÀO GIỎ
              </button>
              <button
                type="button"
                onClick={() => setSaved((s) => !s)}
                aria-pressed={saved}
                aria-label={saved ? "Bỏ lưu mẫu này" : "Lưu mẫu này vào yêu thích"}
                title={saved ? "Đã lưu vào yêu thích" : "Lưu vào yêu thích"}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-coffee/25 bg-white transition hover:border-coffee"
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`h-6 w-6 ${
                    saved ? "fill-red-500 stroke-red-500" : "fill-none stroke-coffee-deep"
                  }`}
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 21s-7.5-4.7-9.5-9C1 8.5 3 5 6.5 5c2 0 3.5 1 4.5 2.5L12 9l1-1.5C14 6 15.5 5 17.5 5 21 5 23 8.5 21.5 12c-2 4.3-9.5 9-9.5 9z"
                  />
                </svg>
              </button>
            </div>

            {/* Banner giảm 5% cho thành viên */}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#66755a] px-5 py-4">
              <p className="text-base font-bold text-white">
                Giảm 5% khi đăng ký thành viên
              </p>
              <Link
                href="/tai-khoan"
                className="rounded-full border-2 border-white px-5 py-2 text-sm font-bold text-white transition hover:bg-white hover:text-[#66755a]"
              >
                ĐĂNG KÝ NGAY
              </Link>
            </div>
          </div>
        </div>

        {/* 4 mục mở ra được */}
        <div className="mt-12 border-t border-coffee/10">
          {sections.map((s) => (
            <div key={s.key} className="border-b border-coffee/10">
              <button
                type="button"
                onClick={() =>
                  setOpen((o) => ({ ...o, [s.key]: !o[s.key] }))
                }
                aria-expanded={open[s.key]}
                className="flex w-full items-center justify-between py-5 text-left"
              >
                <span className="text-lg font-bold text-coffee-deep">
                  {s.title}
                </span>
                <span
                  aria-hidden="true"
                  className="text-2xl font-bold leading-none text-coffee-deep/70"
                >
                  {open[s.key] ? "−" : "+"}
                </span>
              </button>
              {open[s.key] && (
                <p className="pb-6 text-base leading-relaxed text-coffee-deep/75">
                  {s.body}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8">
          <Link
            href="/san-pham"
            className="text-base font-bold text-coffee hover:underline"
          >
            ← Quay lại danh sách sản phẩm
          </Link>
        </p>
      </div>
    </div>
  );
}
