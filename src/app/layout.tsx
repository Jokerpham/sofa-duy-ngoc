import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import Chrome from "@/components/Chrome";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sofa Duy Ngọc — Thiết Kế Nội Thất | DN HOME Hải Phòng",
  description:
    "Sofa Duy Ngọc (DN HOME) — Thiết kế nội thất, sản xuất sofa theo yêu cầu, bọc lại và sửa chữa ghế cũ tại Hải Phòng. Sofa chất lượng, thiết kế hiện đại, bền đẹp lâu dài.",
  keywords: [
    "sofa Hải Phòng",
    "thiết kế nội thất",
    "đóng sofa theo yêu cầu",
    "bọc lại ghế sofa",
    "sửa ghế sofa",
    "Sofa Duy Ngọc",
    "DN HOME",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        id="top"
        className={`${beVietnamPro.variable} font-sans bg-cream text-coffee-deep antialiased`}
      >
        <Chrome>{children}</Chrome>
      </body>
    </html>
  );
}
