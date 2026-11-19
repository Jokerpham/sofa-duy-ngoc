"use client";

import { useMemo, useState } from "react";
import { SITE } from "@/lib/site";

// Khối bản đồ + form "Thông tin liên hệ" ở trang /lien-he.
// Bên trái: bản đồ Google Maps nhúng theo đúng địa chỉ xưởng
// (350 Hoàng Quốc Việt, P. Phù Liễn, Hải Phòng — không dùng vị trí mẫu).
// Bên phải: form liên hệ nền nâu đậm #241208, chữ kem #EADBC6, nút GỬI vàng
// #FFD9A0 — cùng tông footer/header, KHÔNG để khối trắng/chữ đen như ảnh mẫu.
// Form này khác form báo giá: chỉ có Họ và Tên, Email, Chủ đề, Nội dung;
// bấm GỬI sẽ soạn email tới duyngocmanufac@gmail.com.
export default function ContactSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [composed, setComposed] = useState("");
  const [copied, setCopied] = useState(false);

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    message.trim().length > 0;

  const mailSubject = subject.trim()
    ? `Liên hệ từ website — ${subject.trim()}`
    : `Liên hệ từ website — ${name.trim()}`;

  const mailto = useMemo(() => {
    if (!composed) return "";
    return `mailto:${SITE.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(composed)}`;
  }, [composed, mailSubject]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    const lines = [
      `Họ và tên: ${name.trim()}`,
      `Email: ${email.trim()}`,
      subject.trim() ? `Chủ đề: ${subject.trim()}` : "",
      "",
      message.trim(),
    ].filter(Boolean);
    const body = lines.join("\n");
    setComposed(body);
    setCopied(false);
    // Lưu liên hệ vào cơ sở dữ liệu của xưởng để tiện theo dõi —
    // gửi lặng lẽ, không chặn giao diện và không báo lỗi nếu lưu không được.
    void fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        phone: "",
        product_name: subject.trim(),
        message: message.trim(),
      }),
    }).catch(() => {});
    // Mở ứng dụng email để gửi ngay tới xưởng.
    const a = document.createElement("a");
    a.href = `mailto:${SITE.email}?subject=${encodeURIComponent(mailSubject)}&body=${encodeURIComponent(body)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(composed);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-[rgba(234,219,198,0.3)] bg-[rgba(234,219,198,0.08)] px-4 py-3 text-base text-[#EADBC6] outline-none placeholder:text-[#EADBC6]/45 focus:border-[#FFD9A0]";

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Bản đồ bên trái */}
          <div className="min-h-[340px] overflow-hidden rounded-2xl shadow-sm">
            <iframe
              title="Bản đồ Xưởng Sofa Duy Ngọc — 350 Hoàng Quốc Việt, P. Phù Liễn, Hải Phòng"
              src={SITE.mapsEmbedUrl}
              className="h-full min-h-[340px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          {/* Form liên hệ bên phải — nền nâu đậm */}
          <div className="rounded-2xl bg-[#241208] p-6 text-[#EADBC6] sm:p-8">
            <h2 className="text-2xl font-black sm:text-3xl">
              Thông tin liên hệ
            </h2>
            <p className="mt-2 text-base leading-relaxed text-[#EADBC6]/75">
              Điền thông tin bên dưới, xưởng sẽ liên hệ lại với bạn sớm nhất.
            </p>

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-[#EADBC6]">
                    Họ và Tên *
                  </span>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tên của bạn"
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[#EADBC6]">
                    Email *
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email của bạn"
                    className={inputCls}
                  />
                </label>
              </div>

              <label className="mt-5 block">
                <span className="text-sm font-bold text-[#EADBC6]">
                  Chủ đề
                </span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="VD: Hỏi giá sofa góc L, bọc lại ghế cũ…"
                  className={inputCls}
                />
              </label>

              <label className="mt-5 block">
                <span className="text-sm font-bold text-[#EADBC6]">
                  Nội dung *
                </span>
                <textarea
                  rows={5}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nội dung bạn muốn gửi tới xưởng…"
                  className={inputCls}
                />
              </label>

              <button
                type="submit"
                disabled={!canSubmit}
                className="mt-6 w-full rounded-full bg-[#FFD9A0] py-3.5 text-base font-bold text-[#241208] shadow transition hover:bg-[#EADBC6] disabled:cursor-not-allowed disabled:opacity-50"
              >
                GỬI
              </button>

              {composed && (
                <div className="mt-6 rounded-xl border border-[rgba(234,219,198,0.25)] bg-[rgba(234,219,198,0.08)] p-5">
                  <p className="text-sm font-bold text-[#EADBC6]">
                    Email của bạn đã được soạn sẵn:
                  </p>
                  <p className="mt-2 whitespace-pre-line text-base leading-relaxed text-[#EADBC6]/85">
                    {composed}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={mailto}
                      className="rounded-full bg-[#FFD9A0] px-5 py-2.5 text-sm font-bold text-[#241208] transition hover:bg-[#EADBC6]"
                    >
                      Gửi bằng Email
                    </a>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="rounded-full border-2 border-[#FFD9A0] px-5 py-2.5 text-sm font-bold text-[#FFD9A0] transition hover:bg-[#FFD9A0] hover:text-[#241208]"
                    >
                      {copied ? "Đã sao chép ✓" : "Sao chép"}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
