import type { Metadata } from "next";
import Hero from "@/components/Hero";
import SecondaryBanner from "@/components/SecondaryBanner";
import Features from "@/components/Features";
import BestSellers from "@/components/BestSellers";

export const metadata: Metadata = {
  title: "Sofa Duy Ngọc — Thiết Kế Nội Thất | DN HOME Hải Phòng",
  description:
    "Sofa Duy Ngọc (DN HOME) — Thiết kế nội thất, sản xuất sofa theo yêu cầu, bọc lại và sửa chữa ghế cũ tại Hải Phòng. Sofa chất lượng, thiết kế hiện đại, bền đẹp lâu dài.",
};

// Trang chủ: Hero + 3 điểm mạnh + giới thiệu nhanh các trang còn lại.
const PAGES = [
  {
    href: "/dich-vu",
    title: "Dịch vụ",
    desc: "Đóng sofa theo yêu cầu, bọc lại ghế cũ, sửa chữa — thợ xưởng làm trực tiếp.",
  },
  {
    href: "/san-pham",
    title: "Sản phẩm",
    desc: "8 mẫu sofa thật của xưởng — ảnh thật, bấm Báo giá để hỏi giá từng mẫu.",
  },
  {
    href: "/quy-trinh",
    title: "Quy trình",
    desc: "5 bước rõ ràng: tư vấn & đo đạc, thiết kế & báo giá, thi công, giao hàng, bảo hành.",
  },
  {
    href: "/xuong-san-xuat",
    title: "Xưởng sản xuất",
    desc: "Giới thiệu xưởng Sofa Duy Ngọc — làm việc trực tiếp tại Hải Phòng.",
  },
  {
    href: "/hoi-dap",
    title: "Hỏi đáp",
    desc: "Thời gian làm, độ bền khi bọc lại, cách tính giá và bảo hành.",
  },
  {
    href: "/lien-he",
    title: "Liên hệ",
    desc: "Gọi điện, nhắn Zalo hoặc gửi yêu cầu báo giá — xưởng liên hệ lại tư vấn.",
  },
];

export default function Home() {
  return (
    <main>
      <Hero />
      {/* Banner phụ: slider 8 ảnh sofa, ngay dưới khối chữ THIẾT KẾ NỘI THẤT,
          tách riêng với banner chính tĩnh ở trên cùng. */}
      <SecondaryBanner />
      <Features />

      {/* Giới thiệu nhanh các trang */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker text-center text-xs font-bold uppercase text-gold-dark">
            Khám phá xưởng
          </p>
          <h2 className="mt-2 text-center text-3xl font-black text-coffee-deep sm:text-4xl">
            Sofa Duy Ngọc có gì?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-coffee-deep/70">
            Xưởng nhận đóng sofa theo yêu cầu, bọc lại và sửa chữa ghế cũ tại
            Hải Phòng. Chọn mục bên dưới để xem chi tiết.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PAGES.map((p) => (
              <a
                key={p.href}
                href={p.href}
                className="group rounded-2xl border border-coffee/10 bg-sand p-6 transition hover:border-coffee hover:shadow-md"
              >
                <p className="text-lg font-extrabold text-coffee-deep group-hover:text-coffee">
                  {p.title}
                </p>
                <p className="mt-2 text-base leading-relaxed text-coffee-deep/70">
                  {p.desc}
                </p>
                <p className="mt-4 text-sm font-bold text-coffee">
                  Xem thêm →
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Bảng xếp hạng sofa bán chạy nhất — sau mục Khám phá xưởng,
          trước chân trang, kiểu danh sách thứ hạng như mục Hottest. */}
      <BestSellers />
    </main>
  );
}
