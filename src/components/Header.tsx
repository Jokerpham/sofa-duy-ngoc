"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE } from "@/lib/site";
import { useSitePhones } from "@/lib/site-settings";
import { getCustomerSession, type Customer } from "@/lib/customer-auth";
import { goToQuote } from "@/lib/auth-guard";

const NAV = [
  { label: "Trang chủ", href: "/" },
  { label: "Dịch vụ", href: "/dich-vu" },
  { label: "Sản phẩm", href: "/san-pham" },
  { label: "Quy trình", href: "/quy-trinh" },
  { label: "Xưởng sản xuất", href: "/xuong-san-xuat" },
  { label: "Hỏi đáp", href: "/hoi-dap" },
  { label: "Liên hệ", href: "/lien-he" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  // Số điện thoại hiển thị: quản trị đổi trong /admin/cai-dat.
  const phones = useSitePhones();
  const pathname = usePathname();
  // Chỉ hiện TÊN KHÁCH HÀNG đã đăng nhập ở /tai-khoan — không bao giờ hiện
  // "Admin" ở header (phiên quản trị không được đọc ở đây).
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Kiểm tra lại phiên khách mỗi lần chuyển trang + khi phiên đổi
  // (đăng nhập / đăng xuất ở trang /tai-khoan thì tên cập nhật ngay).
  useEffect(() => {
    const refresh = async () => setCustomer(await getCustomerSession());
    void refresh();
    window.addEventListener("sdn-customer-session-changed", refresh);
    return () => {
      window.removeEventListener("sdn-customer-session-changed", refresh);
    };
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-cream/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="flex shrink-0 items-center gap-2.5">
          <img
            src="/images/logo-dn-home.png"
            alt="DN HOME — Sofa Duy Ngọc"
            className="h-10 w-auto shrink-0"
          />
          <span className="shrink-0 leading-tight">
            <span className="block whitespace-nowrap text-base font-extrabold tracking-wide text-coffee-deep">
              SOFA DUY NGỌC
            </span>
            <span className="block whitespace-nowrap text-[11px] font-semibold tracking-[0.28em] text-gold-dark">
              DN HOME • HẢI PHÒNG
            </span>
          </span>
        </a>

        {/* Nav desktop */}
        <nav className="hidden items-center gap-5 lg:flex xl:gap-6">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm font-semibold text-coffee-deep/80 transition hover:text-coffee"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Tài khoản khách: icon người + tên người đã đăng nhập
              (chưa đăng nhập thì chỉ hiện icon), bấm vào sang /tai-khoan */}
          <a
            href="/tai-khoan"
            title={customer ? customer.name : "Tài khoản"}
            className="flex items-center gap-2 rounded-full border border-coffee/20 px-3 py-2 text-sm font-bold text-coffee-deep transition hover:bg-sand hover:text-coffee"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {customer ? (
              <span className="hidden max-w-32 truncate sm:inline">
                {customer.name}
              </span>
            ) : null}
          </a>
          {/* Nút BOOK NOW: chưa đăng nhập thì chuyển sang /tai-khoan
              để đăng nhập / đăng ký, xong tự quay lại trang báo giá. */}
          <button
            type="button"
            onClick={() => goToQuote("/lien-he")}
            className="shrink-0 whitespace-nowrap rounded-full bg-coffee px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-coffee-dark"
          >
            BOOK NOW
          </button>
          {/* Nút menu mobile */}
          <button
            type="button"
            aria-label={open ? "Đóng menu" : "Mở menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-coffee/20 text-coffee-deep lg:hidden"
          >
            {open ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <nav className="border-t border-coffee/10 bg-cream px-4 pb-4 pt-2 lg:hidden">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-2 py-3 text-base font-semibold text-coffee-deep hover:bg-sand"
            >
              {item.label}
            </a>
          ))}
          <a
            href={`tel:${phones.mainTel}`}
            className="mt-1 block rounded-md bg-coffee px-4 py-3 text-center text-base font-bold text-white"
          >
            Gọi ngay: {phones.main}
          </a>
        </nav>
      )}
    </header>
  );
}
