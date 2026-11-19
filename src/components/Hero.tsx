"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SITE } from "@/lib/site";
import { goToQuote } from "@/lib/auth-guard";

// Hero Slider: gộp 2 phần banner thành MỘT carousel ở cùng một vị trí
// đầu trang (ngay dưới Header).
//   Slide 1 (mặc định): banner hình ảnh — ảnh banner gốc full-width.
//   Slide 2: banner nội dung chữ — khối THIẾT KẾ NỘI THẤT, nền kem.
// Tự chuyển mỗi 5 giây (hiệu ứng fade), lặp vòng vô hạn; có chấm tròn
// (pagination dots) ở dưới để bấm chuyển tay; tạm dừng tự chuyển khi
// rê chuột / focus vào carousel.
// Banner phụ (SecondaryBanner, 8 ảnh sofa) vẫn là một mục riêng ở dưới
// hero — không gộp vào carousel này, không thay đổi.

const AUTO_MS = 5000;
const SLIDE_COUNT = 2;

// Đo chiều cao bằng layout effect để lần vẽ đầu tiên không bị sập khung
// (tránh cảnh báo useLayoutEffect khi render phía máy chủ).
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const slide0Ref = useRef<HTMLDivElement>(null);
  const slide1Ref = useRef<HTMLDivElement>(null);

  // Tự chuyển slide mỗi 5 giây; dừng khi rê chuột / focus vào.
  // Phụ thuộc cả `index` nên bấm chấm chuyển tay sẽ đặt lại đồng hồ 5s.
  useEffect(() => {
    if (paused) return;
    const t = setInterval(
      () => setIndex((i) => (i + 1) % SLIDE_COUNT),
      AUTO_MS
    );
    return () => clearInterval(t);
  }, [paused, index]);

  // Chiều cao khung = chiều cao slide đang hiện (2 slide cao khác nhau:
  // ảnh banner theo tỉ lệ 1920×819, khối chữ cao hơn, nhất là trên
  // điện thoại). Đo lại mỗi khi đổi slide / đổi cỡ màn hình / ảnh tải
  // xong để khung co giãn mượt mà theo slide.
  useIsomorphicLayoutEffect(() => {
    const el = index === 0 ? slide0Ref.current : slide1Ref.current;
    if (!el) return;
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [index]);

  const go = (i: number) => setIndex(((i % SLIDE_COUNT) + SLIDE_COUNT) % SLIDE_COUNT);

  const slideClass = (active: boolean) =>
    `absolute inset-x-0 top-0 transition-opacity duration-700 ease-in-out ${
      active ? "opacity-100" : "pointer-events-none opacity-0"
    }`;

  return (
    <section
      id="trang-chu"
      aria-roledescription="carousel"
      aria-label="Banner chính"
      className="bg-sand"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="relative overflow-hidden transition-[height] duration-500 ease-in-out"
        style={
          height ? { height } : { aspectRatio: "1920 / 819" }
        }
      >
        {/* Slide 1: banner hình ảnh (mặc định) */}
        <div
          ref={slide0Ref}
          aria-hidden={index !== 0}
          className={slideClass(index === 0)}
        >
          <img
            src="/images/banner-sofa-duy-ngoc.jpg"
            alt="Sofa Duy Ngọc — Thiết kế nội thất, sản xuất / bọc / sửa lại ghế cũ"
            className="block h-auto w-full"
            loading="eager"
          />
        </div>

        {/* Slide 2: banner nội dung chữ */}
        <div
          ref={slide1Ref}
          aria-hidden={index !== 1}
          className={slideClass(index === 1)}
        >
          <div className="mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
            <div>
              <p className="section-kicker text-xs font-bold uppercase text-gold-dark">
                {SITE.brand} • Hải Phòng
              </p>
              <h1 className="mt-3 text-4xl font-black leading-tight text-coffee-deep sm:text-5xl lg:text-[3.4rem]">
                THIẾT KẾ
                <br />
                <span className="text-coffee">NỘI THẤT</span>
              </h1>
              <p className="mt-4 text-lg font-semibold text-coffee-deep/80">
                Sản xuất / Bọc / Sửa lại ghế cũ
              </p>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-coffee-deep/70">
                Xưởng Sofa Duy Ngọc nhận đóng sofa theo yêu cầu, bọc lại và sửa chữa
                ghế sofa cũ — làm mới không gian phòng khách của bạn với chất lượng
                thợ mộc tận tâm, giá xưởng trực tiếp.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {/* Nút Báo giá: chưa đăng nhập thì chuyển sang /tai-khoan
                    để đăng nhập / đăng ký, xong tự quay lại trang báo giá. */}
                <button
                  type="button"
                  tabIndex={index === 1 ? 0 : -1}
                  onClick={() => goToQuote("/lien-he")}
                  className="rounded-full bg-coffee px-7 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-coffee-dark"
                >
                  BOOK NOW — Nhận báo giá
                </button>
                <a
                  href="/san-pham"
                  tabIndex={index === 1 ? 0 : -1}
                  className="rounded-full border-2 border-coffee px-7 py-3.5 text-base font-bold text-coffee transition hover:bg-coffee hover:text-white"
                >
                  Xem sản phẩm
                </a>
              </div>
              <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-semibold text-coffee-deep/75">
                <span>✓ Sofa chất lượng</span>
                <span>✓ Thiết kế hiện đại</span>
                <span>✓ Bền đẹp lâu dài</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chấm tròn chuyển slide (pagination dots) */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-[2px]">
          {[0, 1].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={i === 0 ? "Xem banner hình ảnh" : "Xem banner nội dung chữ"}
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
    </section>
  );
}
