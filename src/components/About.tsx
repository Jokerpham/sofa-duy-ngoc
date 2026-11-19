import { SITE } from "@/lib/site";

export default function About() {
  return (
    <section id="gioi-thieu" className="scroll-mt-20 bg-coffee-deep text-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="section-kicker text-xs font-bold uppercase text-gold">
              Giới thiệu xưởng
            </p>
            <h2 className="mt-2 text-3xl font-black leading-snug sm:text-4xl">
              Xưởng sofa của người Hải Phòng, làm bằng tay nghề và cái tâm
            </h2>
            <p className="mt-4 text-base leading-relaxed text-cream/80">
              Sofa Duy Ngọc (DN HOME) là xưởng thiết kế nội thất và sản xuất sofa
              tại {SITE.addressShort}. Xưởng nhận đóng mới sofa theo yêu cầu, bọc
              lại ghế cũ và sửa chữa ghế sofa — từ khung gỗ, mút, lò xo đến vải
              bọc và da, thợ đều làm trực tiếp tại xưởng.
            </p>
            <p className="mt-3 text-base leading-relaxed text-cream/80">
              Vì làm trực tiếp không qua trung gian, giá cả rõ ràng và bạn được
              xem mẫu vải, mẫu da tận tay trước khi quyết định. Ghế cũ của gia
              đình vẫn dùng tốt khung? Bọc lại là đẹp như mới, tiết kiệm hơn
              nhiều so với mua ghế mới.
            </p>
            <ul className="mt-6 space-y-2 text-base font-semibold text-cream/90">
              <li>✓ Làm trực tiếp tại xưởng — không qua trung gian</li>
              <li>✓ Đo đạc tận nhà, tư vấn mẫu và chất liệu miễn phí</li>
              <li>✓ Bảo hành khung và đường may rõ ràng</li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-xl">
            <img
              src="/images/banner-sofa-duy-ngoc.jpg"
              alt="Sofa Duy Ngọc — Thiết kế nội thất, sản xuất / bọc / sửa lại ghế cũ"
              loading="lazy"
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
