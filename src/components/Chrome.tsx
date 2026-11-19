"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import FloatingChat from "./FloatingChat";
import ScrollTop from "./ScrollTop";

// Khung chung của web: Header + Footer + nút nổi — trừ trang /tai-khoan
// và khu vực /admin. Trang Tài khoản là trang độc lập (kiểu full-screen
// modal / standalone): chỉ hiện khung trắng Đăng nhập / Đăng ký ở chính
// giữa, không có Header, thanh địa chỉ/SĐT, breadcrumb hay Footer.
// Khu vực quản trị cũng độc lập: thanh bên (sidebar) + thanh trên
// (topbar) của AdminNav làm khung riêng, nên không hiện Header/Footer
// của shop ở đó.
export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const standalone =
    pathname === "/tai-khoan" || pathname.startsWith("/admin");
  if (standalone) return <>{children}</>;
  return (
    <>
      <Header />
      {children}
      <Footer />
      <FloatingChat />
      <ScrollTop />
    </>
  );
}
