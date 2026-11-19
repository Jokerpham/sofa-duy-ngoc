import type { Metadata } from "next";
import { Suspense } from "react";
import ContactSection from "@/components/ContactSection";
import QuoteForm from "@/components/QuoteForm";
import { ContactPhoneLinks, MainPhoneText } from "@/components/ShopPhones";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Liên hệ — Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Liên hệ Xưởng Sofa Duy Ngọc: 0943.625.922, 0398.084.245, duyngocmanufac@gmail.com, 350 Hoàng Quốc Việt, Phường Phù Liễn, Hải Phòng. Gửi yêu cầu báo giá sofa.",
};

export default function LienHePage() {
  return (
    <main>
      {/* Thông tin liên hệ đầy đủ */}
      <section className="bg-sand">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker text-xs font-bold uppercase text-gold-dark">
            Liên hệ xưởng
          </p>
          <h1 className="mt-2 text-3xl font-black text-coffee-deep sm:text-4xl">
            Liên hệ Sofa Duy Ngọc
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-coffee-deep/70">
            Cần tư vấn mẫu, hỏi giá hay đặt lịch đo đạc tận nhà — gọi điện,
            nhắn Zalo hoặc gửi yêu cầu báo giá bên dưới, xưởng sẽ liên hệ lại.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-coffee/10 bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-gold-dark">
                Điện thoại
              </p>
              <p className="mt-3 space-y-1.5 text-base font-bold text-coffee-deep">
                <ContactPhoneLinks linkClassName="block hover:text-coffee" />
              </p>
            </div>

            <div className="rounded-2xl border border-coffee/10 bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-gold-dark">
                Zalo
              </p>
              <p className="mt-3 text-base leading-relaxed text-coffee-deep/75">
                Nhắn Zalo cho xưởng để gửi ảnh ghế cần bọc / sửa và nhận tư
                vấn nhanh.
              </p>
              <a
                href={SITE.zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-full bg-[#0068FF] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              >
                Nhắn Zalo: <MainPhoneText />
              </a>
            </div>

            <div className="rounded-2xl border border-coffee/10 bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-gold-dark">
                Email
              </p>
              <p className="mt-3 text-base leading-relaxed text-coffee-deep/75">
                Gửi yêu cầu báo giá, hình ảnh mẫu ưng ý qua email.
              </p>
              <a
                href={`mailto:${SITE.email}`}
                className="mt-4 inline-block break-all text-base font-bold text-coffee hover:underline"
              >
                {SITE.email}
              </a>
            </div>

            <div className="rounded-2xl border border-coffee/10 bg-white p-6">
              <p className="text-sm font-bold uppercase tracking-wider text-gold-dark">
                Địa chỉ xưởng
              </p>
              <p className="mt-3 text-base leading-relaxed text-coffee-deep/75">
                {SITE.address}
              </p>
              <p className="mt-2 text-base text-coffee-deep/75">
                Giờ làm việc: {SITE.hours}
              </p>
              <a
                href={SITE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block rounded-full border-2 border-coffee px-5 py-2.5 text-sm font-bold text-coffee transition hover:bg-coffee hover:text-white"
              >
                Chỉ đường Google Maps ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Bản đồ + form liên hệ */}
      <ContactSection />

      {/* Form báo giá — đọc ?mau=... nên cần Suspense khi xuất tĩnh */}
      <Suspense
        fallback={
          <section className="bg-white">
            <div className="mx-auto max-w-4xl px-4 py-16 text-center text-base text-coffee-deep/70 sm:px-6 lg:px-8">
              Đang tải form báo giá…
            </div>
          </section>
        }
      >
        <QuoteForm />
      </Suspense>
    </main>
  );
}
