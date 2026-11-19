// Khung quản trị chung cho các trang /admin (dạng sidebar như trang
// quản trị MONA, nhưng giữ màu nâu/kem/vàng của Sofa Duy Ngọc):
//  - Thanh bên trái (desktop): logo + tên thương hiệu, khối tài khoản
//    quản trị (AdminAvatar), menu dọc; mục đang mở nổi bật nền vàng.
//  - Thanh trên: chữ "Khu vực quản trị — Sofa Duy Ngọc" + chuông
//    thông báo (NotifBell).
//  - Trên điện thoại: thanh bên ẩn, bấm nút ☰ ở thanh trên để mở
//    menu dạng trượt.
// Truyền active = "tong-quan" | "thong-bao" | "san-pham" | "giam-gia" |
// "bao-gia" | "khach-hang" | "tin-nhan" | "doi-mat-khau" | "cai-dat"
// để tô sáng mục đang mở. Mục "Thông báo" có huy hiệu đỏ đếm thông
// báo chưa đọc (NotifBadge).
"use client";

import { useState } from "react";
import AdminAvatar from "./AdminAvatar";
import NotifBadge from "./NotifBadge";
import NotifBell from "./NotifBell";

type IconProps = { className?: string };

function Icon({
  d,
  className,
}: IconProps & { d: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-[18px] w-[18px] shrink-0"}
    >
      {d}
    </svg>
  );
}

const ICONS: Record<string, React.ReactNode> = {
  shop: (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
  box: (
    <>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  chat: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  bell: (
    <>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </>
  ),
  tag: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </>
  ),
  sliders: (
    <>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </>
  ),
  lock: (
    <>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </>
  ),
};

type LinkItem = {
  href: string;
  label: string;
  key: string;
  icon: string;
  badge?: boolean;
  external?: boolean;
};

const LINKS: LinkItem[] = [
  { href: "/", label: "Xem giao diện Shop", key: "shop", icon: "shop", external: true },
  { href: "/admin", label: "Tổng quan", key: "tong-quan", icon: "grid" },
  { href: "/admin/san-pham", label: "Sản phẩm", key: "san-pham", icon: "box" },
  { href: "/admin/bao-gia", label: "Yêu cầu báo giá", key: "bao-gia", icon: "file" },
  { href: "/admin/khach-hang", label: "Khách hàng", key: "khach-hang", icon: "users" },
  { href: "/admin/tin-nhan", label: "Tin nhắn", key: "tin-nhan", icon: "chat" },
  { href: "/admin/thong-bao", label: "Thông báo", key: "thong-bao", icon: "bell", badge: true },
  { href: "/admin/giam-gia", label: "Giảm giá", key: "giam-gia", icon: "tag" },
  { href: "/admin/cai-dat", label: "Cài đặt", key: "cai-dat", icon: "sliders" },
  { href: "/admin/doi-mat-khau", label: "Đổi mật khẩu", key: "doi-mat-khau", icon: "lock" },
];

function SidebarBody({
  active,
  onNavigate,
}: {
  active?: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Thương hiệu */}
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#EADBC6] px-1">
          <img
            src="/images/logo-dn-home.png"
            alt="DN HOME — Sofa Duy Ngọc"
            className="h-9 w-auto"
          />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-black tracking-[0.14em] text-[#EADBC6]">
            SOFA DUY NGỌC
          </p>
          <p className="mt-0.5 truncate text-[11px] font-bold tracking-[0.22em] text-[#EADBC6]/55">
            DN HOME – QUẢN TRỊ
          </p>
        </div>
      </div>

      {/* Tài khoản quản trị */}
      <div className="border-t border-white/10 px-5 py-4">
        <AdminAvatar />
      </div>

      {/* Menu dọc */}
      <nav
        aria-label="Điều hướng quản trị"
        className="mt-2 flex-1 space-y-1 overflow-y-auto px-3 pb-6"
      >
        {LINKS.map((l) => {
          const isActive = active === l.key;
          return (
            <a
              key={l.key}
              href={l.href}
              aria-current={isActive ? "page" : undefined}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                isActive
                  ? "bg-[#FFD9A0] text-[#241208]"
                  : "text-[#EADBC6]/75 hover:bg-white/5 hover:text-[#EADBC6]"
              }`}
            >
              {l.external && (
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full bg-green-500"
                />
              )}
              <Icon d={ICONS[l.icon]} />
              <span className="min-w-0 flex-1 truncate">{l.label}</span>
              {l.badge ? <NotifBadge /> : null}
              {l.external && (
                <span aria-hidden className="text-xs leading-none">
                  ↗
                </span>
              )}
            </a>
          );
        })}
      </nav>
    </div>
  );
}

export default function AdminNav({ active }: { active?: string }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Thanh bên trái — cố định, hiện từ màn hình vừa trở lên */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] border-r border-white/10 bg-[#241208] md:flex md:flex-col">
        <SidebarBody active={active} />
      </aside>

      {/* Thanh bên trên điện thoại — trượt ra khi bấm ☰ */}
      {mobileOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/50 md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#241208] shadow-2xl md:hidden">
            <SidebarBody
              active={active}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </>
      )}

      {/* Thanh trên — chữ khu vực quản trị + chuông thông báo */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-[#241208]/10 bg-cream px-4 sm:px-6 md:left-[232px]">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Mở menu quản trị"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#241208]/15 bg-white text-lg font-bold text-[#241208] transition hover:border-[#FFD9A0] md:hidden"
          >
            ☰
          </button>
          <p className="truncate text-sm font-medium text-[#241208]/60">
            Khu vực quản trị — Sofa Duy Ngọc
          </p>
        </div>
        <NotifBell />
      </header>
    </>
  );
}
