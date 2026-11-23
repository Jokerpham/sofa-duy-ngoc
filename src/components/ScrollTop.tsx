"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Nút tròn nổi cuộn về đầu trang — hình tròn nền nâu đậm #241208,
// mũi tên ↑ màu vàng kem #FFD9A0 ở giữa. DÍNH THEO khung nhìn bằng
// position: fixed ở góc dưới bên phải (phía trên nút chat xanh), luôn nằm
// yên trong khung nhìn khi cuộn trang. Chỉ hiện khi đã cuộn xuống ~300px.
// Không hiện trên các trang /admin.
// Cỡ nút 56×56 (h-14 w-14), chung với nút chat, nút Messenger, nút
// Facebook và nút Zalo; 5 nút xếp thành 1 cột dọc với khoảng cách đều nhau 16px.
export default function ScrollTop() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Cuộn về đầu trang"
      title="Về đầu trang"
      className={`fixed bottom-60 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#241208] text-[#FFD9A0] shadow-xl transition-all duration-300 hover:scale-105 hover:bg-[#4A2718] ${
        show ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <svg
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
