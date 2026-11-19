"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { SITE } from "@/lib/site";

const SERVICES = [
  "Mua sofa có sẵn (đặt theo mẫu)",
  "Đóng sofa theo yêu cầu",
  "Bọc lại ghế cũ",
  "Sửa chữa ghế sofa",
  "Sofa văn phòng",
  "Thiết kế phòng khách",
  "Đo đạc tận nhà",
  "Chưa rõ — cần tư vấn",
];

export default function QuoteForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(SERVICES[0]);
  const [message, setMessage] = useState("");
  const [composed, setComposed] = useState("");
  const [copied, setCopied] = useState(false);
  const prefilledRef = useRef(false);

  // Khi khách bấm "Báo giá" ở một thẻ sản phẩm (/san-pham), trang Liên hệ
  // mở kèm ?mau=Tên mẫu — tự điền sẵn tên mẫu đó vào form.
  useEffect(() => {
    if (prefilledRef.current) return;
    const product = searchParams.get("mau");
    if (!product) return;
    prefilledRef.current = true;
    setService("Mua sofa có sẵn (đặt theo mẫu)");
    setMessage(`Tôi muốn báo giá mẫu: ${product}.`);
  }, [searchParams]);

  const canSubmit = name.trim().length > 0 && phone.trim().length > 0;

  const mailto = useMemo(() => {
    if (!composed) return "";
    const subject = `Báo giá sofa — ${name.trim()} (${service})`;
    return `mailto:${SITE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(composed)}`;
  }, [composed, name, service]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const lines = [
      `Xin chào Sofa Duy Ngọc, tôi là ${name.trim()}.`,
      `Số điện thoại của tôi: ${phone.trim()}.`,
      `Tôi cần: ${service}.`,
      message.trim() ? `Chi tiết: ${message.trim()}` : "",
      `Nhờ xưởng tư vấn và báo giá giúp tôi. Cảm ơn!`,
    ].filter(Boolean);
    setComposed(lines.join("\n"));
    setCopied(false);
    // Lưu yêu cầu vào cơ sở dữ liệu của xưởng để tiện theo dõi —
    // gửi lặng lẽ, không chặn giao diện và không báo lỗi nếu lưu không được.
    const productName = searchParams.get("mau") ?? "";
    const quoteMessage = message.trim()
      ? `${service}: ${message.trim()}`
      : service;
    void fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        phone: phone.trim(),
        product_name: productName,
        message: quoteMessage,
      }),
    }).catch(() => {});
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(composed);
      setCopied(true);
    } catch {
      // Trình duyệt chặn clipboard: người dùng vẫn sao chép tay từ ô nội dung.
      setCopied(false);
    }
  }

  return (
    <section id="bao-gia" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="section-kicker text-center text-xs font-bold uppercase text-gold-dark">
          Nhận báo giá
        </p>
        <h2 className="mt-2 text-center text-3xl font-black text-coffee-deep sm:text-4xl">
          Gửi yêu cầu báo giá
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-coffee-deep/70">
          Điền thông tin bên dưới, xưởng sẽ liên hệ lại tư vấn và báo giá.
          Không cần tài khoản — yêu cầu của bạn được lưu vào cơ sở dữ
          liệu của xưởng để tiện theo dõi, tin nhắn cũng được soạn sẵn để
          bạn gửi qua email hoặc sao chép.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-10 max-w-2xl rounded-2xl border border-coffee/10 bg-sand p-6 sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-coffee-deep">Họ tên *</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tên của bạn"
                className="mt-1.5 w-full rounded-lg border border-coffee/20 bg-white px-4 py-3 text-base text-coffee-deep outline-none focus:border-coffee"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-coffee-deep">Số điện thoại *</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="VD: 0912 345 678"
                className="mt-1.5 w-full rounded-lg border border-coffee/20 bg-white px-4 py-3 text-base text-coffee-deep outline-none focus:border-coffee"
              />
            </label>
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-bold text-coffee-deep">Bạn cần dịch vụ nào?</span>
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-coffee/20 bg-white px-4 py-3 text-base text-coffee-deep outline-none focus:border-coffee"
            >
              {SERVICES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-5 block">
            <span className="text-sm font-bold text-coffee-deep">
              Mô tả thêm (kích thước, mẫu ưng ý, tình trạng ghế…)
            </span>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="VD: Sofa góc L dài 2,4m cho phòng khách chung cư, vải màu be…"
              className="mt-1.5 w-full rounded-lg border border-coffee/20 bg-white px-4 py-3 text-base text-coffee-deep outline-none focus:border-coffee"
            />
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 w-full rounded-full bg-coffee py-3.5 text-base font-bold text-white shadow transition hover:bg-coffee-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Soạn tin nhắn báo giá
          </button>

          {composed && (
            <div className="mt-6 rounded-xl border border-coffee/20 bg-white p-5">
              <p className="text-sm font-bold text-coffee-deep">
                Tin nhắn của bạn:
              </p>
              <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-coffee-deep/80">
                {composed}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={mailto}
                  className="rounded-full bg-coffee px-5 py-2.5 text-sm font-bold text-white transition hover:bg-coffee-dark"
                >
                  Gửi bằng Email
                </a>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-full border-2 border-coffee px-5 py-2.5 text-sm font-bold text-coffee transition hover:bg-coffee hover:text-white"
                >
                  {copied ? "Đã sao chép ✓" : "Sao chép"}
                </button>
                <a
                  href={SITE.zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border-2 border-[#0068FF] px-5 py-2.5 text-sm font-bold text-[#0068FF] transition hover:bg-[#0068FF] hover:text-white"
                >
                  Nhắn Zalo
                </a>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
