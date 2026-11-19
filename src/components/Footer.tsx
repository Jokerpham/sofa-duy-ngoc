"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PRODUCTS } from "@/lib/products";
import { SITE } from "@/lib/site";
import { useSitePhones } from "@/lib/site-settings";

// Footer kiểu zerofurniture: logo lớn phía trên, các cột liên kết, cột phải là
// Phòng trưng bày + Bản tin — nhưng GIỮ màu nâu đậm / chữ kem / link vàng
// của web Sofa Duy Ngọc, không dùng nền trắng.
const SERVICES = [
  "Đóng sofa theo yêu cầu",
  "Bọc lại ghế cũ",
  "Sửa chữa ghế sofa",
  "Sofa văn phòng",
  "Thiết kế phòng khách",
  "Đo đạc tận nhà",
];

const SUPPORT_LINKS = [
  { label: "Hỏi đáp", href: "/hoi-dap" },
  { label: "Bảo hành", href: "/hoi-dap" },
  { label: "Chính sách", href: "/hoi-dap" },
];

const ABOUT_LINKS = [
  { label: "Giới thiệu xưởng", href: "/xuong-san-xuat" },
  { label: "Quy trình làm việc", href: "/quy-trinh" },
  { label: "Liên hệ", href: "/lien-he" },
  { label: "Tài khoản", href: "/tai-khoan" },
];

export default function Footer() {
  const pathname = usePathname();
  // Các nút nổi không hiện trên các trang /admin (như các nút nổi còn lại).
  const isAdmin = pathname?.startsWith("/admin");
  const [newsEmail, setNewsEmail] = useState("");
  const [newsSent, setNewsSent] = useState(false);
  // Số điện thoại hiển thị: quản trị đổi trong /admin/cai-dat, lưu trong
  // MySQL; chưa lưu gì thì hiện số mặc định trên banner.
  const phones = useSitePhones();

  function handleNewsletter(e: React.FormEvent) {
    e.preventDefault();
    const email = newsEmail.trim();
    if (!email) return;
    // Mở ứng dụng email để gửi đăng ký về xưởng (không lưu dữ liệu lên máy chủ).
    const subject = "Đăng ký nhận bản tin Sofa Duy Ngọc";
    const body = `Tôi muốn đăng ký nhận bản tin từ Sofa Duy Ngọc.\nEmail của tôi: ${email}`;
    const a = document.createElement("a");
    a.href = `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setNewsSent(true);
  }

  return (
    <footer className="bg-[#241208] text-[#EADBC6]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Hàng trên: logo lớn */}
        <div className="flex items-start justify-between gap-6">
          <a href="/" className="flex items-center gap-3">
            <span className="flex h-12 items-center justify-center rounded-md bg-[#EADBC6] px-2">
              <img
                src="/images/logo-dn-home.png"
                alt="DN HOME — Sofa Duy Ngọc"
                className="h-10 w-auto"
              />
            </span>
            <span className="leading-tight">
              <span className="block text-2xl font-black tracking-wide text-[#EADBC6]">
                SOFA DUY NGỌC
              </span>
              <span className="block text-[11px] font-semibold tracking-[0.28em] text-[#FFD9A0]">
                DN HOME • THIẾT KẾ NỘI THẤT
              </span>
            </span>
          </a>
        </div>

        {/* Các cột liên kết */}
        <div className="mt-12 grid gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* Sản phẩm */}
          <div className="lg:col-span-2">
            <p className="text-sm font-bold uppercase tracking-wider text-[#EADBC6]/55">
              Sản phẩm
            </p>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {PRODUCTS.map((p) => (
                <li key={p.name}>
                  <a
                    href={`/san-pham/${p.slug}`}
                    className="text-[#FFD9A0] transition hover:underline"
                  >
                    {p.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Dịch vụ */}
          <div className="lg:col-span-2">
            <p className="text-sm font-bold uppercase tracking-wider text-[#EADBC6]/55">
              Dịch vụ
            </p>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {SERVICES.map((s) => (
                <li key={s}>
                  <a
                    href="/dich-vu"
                    className="text-[#FFD9A0] transition hover:underline"
                  >
                    {s}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div className="lg:col-span-2">
            <p className="text-sm font-bold uppercase tracking-wider text-[#EADBC6]/55">
              Hỗ trợ
            </p>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {SUPPORT_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-[#FFD9A0] transition hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Về chúng tôi */}
          <div className="lg:col-span-2">
            <p className="text-sm font-bold uppercase tracking-wider text-[#EADBC6]/55">
              Về chúng tôi
            </p>
            <ul className="mt-4 space-y-2.5 text-[15px]">
              {ABOUT_LINKS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-[#FFD9A0] transition hover:underline"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Phòng trưng bày + Bản tin */}
          <div className="lg:col-span-4">
            <p className="text-sm font-bold uppercase tracking-wider text-[#EADBC6]/55">
              Phòng trưng bày
            </p>
            <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-[#EADBC6]/90">
              <li>
                📍{" "}
                <a
                  href={SITE.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FFD9A0] transition hover:underline"
                >
                  {SITE.address}
                </a>
              </li>
              <li>
                ☎{" "}
                <a
                  href={`tel:${phones.mainTel}`}
                  className="font-bold text-[#FFD9A0] transition hover:underline"
                >
                  {phones.main}
                </a>
                {" • "}
                <a
                  href={`tel:${phones.secondaryTel}`}
                  className="font-bold text-[#FFD9A0] transition hover:underline"
                >
                  {phones.secondary}
                </a>
              </li>
              <li>
                ✉{" "}
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-[#FFD9A0] transition hover:underline"
                >
                  {SITE.email}
                </a>
              </li>
              <li>Giờ làm việc: {SITE.hours}</li>
            </ul>

            {/* Bản tin */}
            <p className="mt-8 text-sm font-bold uppercase tracking-wider text-[#EADBC6]/55">
              Bản tin
            </p>
            <form onSubmit={handleNewsletter} className="mt-4">
              <div className="flex overflow-hidden rounded-full border border-[rgba(234,219,198,0.35)]">
                <input
                  type="email"
                  required
                  value={newsEmail}
                  onChange={(e) => {
                    setNewsEmail(e.target.value);
                    setNewsSent(false);
                  }}
                  placeholder="Nhập email của bạn"
                  aria-label="Email nhận bản tin"
                  className="w-full bg-transparent px-4 py-2.5 text-sm text-[#EADBC6] outline-none placeholder:text-[#EADBC6]/45"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-[#EADBC6] px-5 text-sm font-bold text-[#241208] transition hover:bg-[#FFD9A0]"
                >
                  Đăng ký
                </button>
              </div>
              {newsSent && (
                <p className="mt-2 text-sm text-[#FFD9A0]">
                  Đã mở ứng dụng email — cảm ơn bạn đã đăng ký!
                </p>
              )}
            </form>

            {/* Icon liên hệ */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={SITE.zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Nhắn Zalo"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(234,219,198,0.35)] text-sm font-black text-[#EADBC6] transition hover:bg-[#EADBC6] hover:text-[#241208]"
              >
                Z
              </a>
              <a
                href={`tel:${phones.mainTel}`}
                aria-label="Gọi điện"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(234,219,198,0.35)] text-[#EADBC6] transition hover:bg-[#EADBC6] hover:text-[#241208]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </a>
              <a
                href={SITE.gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Mở Gmail"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(234,219,198,0.35)] text-[#EADBC6] transition hover:bg-[#EADBC6] hover:text-[#241208]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </a>
              <a
                href={SITE.mapsPinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chỉ đường"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(234,219,198,0.35)] text-[#EADBC6] transition hover:bg-[#EADBC6] hover:text-[#241208]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </a>
              <a
                href={SITE.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Sofa Duy Ngọc"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1877F2] text-xl font-black text-white transition hover:scale-105"
              >
                f
              </a>
            </div>
          </div>
        </div>

        {/* Dòng bản quyền */}
        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-[rgba(234,219,198,0.16)] pt-6 text-sm text-[#EADBC6]/60 sm:flex-row">
          <p>© 2026 Sofa Duy Ngọc – DN HOME, Hải Phòng</p>
          <p>Thiết kế nội thất • Sản xuất / Bọc / Sửa lại ghế cũ</p>
        </div>
      </div>

      {/* Nút Messenger + Facebook nổi — thay nút Zalo cũ, cùng cỡ 56×56,
          xếp 1 cột dọc với nút chat và nút cuộn đầu trang, khoảng cách đều
          16px. Messenger ở dưới cùng, Facebook ở trên nó. Không hiện ở /admin. */}
      {!isAdmin && (
        <>
          <a
            href={SITE.messengerUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Nhắn Messenger cho Sofa Duy Ngọc"
            title="Nhắn Messenger"
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00C6FF] to-[#0078FF] text-white shadow-xl transition hover:scale-105"
          >
            <svg
              className="h-7 w-7"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 5.94 2 10.89c0 2.87 1.53 5.42 3.91 7.06-.1.82-.5 2.32-1.07 3.4-.13.24 0 .52.26.6.09.03.18.04.27.04.2 0 .4-.09.54-.25.83-.97 1.95-2.06 2.63-2.5.78.19 1.6.29 2.46.29 5.52 0 10-3.94 10-8.89S17.52 2 12 2z"
              />
              <path
                fill="#0084FF"
                d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"
                transform="translate(6.5 5) scale(0.45)"
              />
            </svg>
          </a>
          <a
            href={SITE.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook của Sofa Duy Ngọc"
            title="Facebook"
            className="fixed bottom-24 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1877F2] text-white shadow-xl transition hover:scale-105"
          >
            <span className="text-[30px] font-black leading-none">f</span>
          </a>
        </>
      )}
    </footer>
  );
}
