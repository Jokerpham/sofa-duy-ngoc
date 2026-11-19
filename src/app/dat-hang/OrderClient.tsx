"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PRODUCTS, fetchProducts, formatPrice } from "@/lib/products";
import { getCustomerSession } from "@/lib/customer-auth";

type Product = (typeof PRODUCTS)[number];

// Trang đặt hàng riêng (tách khỏi trang liên hệ chung), làm theo
// kiểu trang checkout 2 cột: cột trái là thông tin giao hàng +
// phương thức giao hàng + phương thức thanh toán; cột phải là giỏ
// hàng (1 mẫu, chọn số lượng) + mã khuyến mãi + tóm tắt đơn hàng.
// Khách bấm MUA NGAY / THÊM VÀO GIỎ / Báo giá thì tới đây — đã đăng
// nhập mới vào được (goToQuote chặn ở bước trước). Gửi đơn về
// POST /api/quotes — đơn hiện trong mục Yêu cầu báo giá của admin
// (/admin/bao-gia). Bước thanh toán là TẠM THỜI, chỉ để xem trước:
// chưa xử lý thanh toán thật, chưa gọi API thanh toán. Chuyển khoản
// hiển thị mã VietQR thật của chủ xưởng (Vietcombank, ảnh
// /images/qr-vietcombank.png): mã QR TĨNH — khách quét rồi tự nhập
// số tiền trong app ngân hàng, không tự điền sẵn số tiền hay mã đơn
// như trang VNPay động (muốn thế cần tài khoản merchant VNPay +
// tích hợp API riêng); mã khuyến mãi cũng chưa có hệ thống giảm giá thật.
type PayMethod = "bank" | "momo" | "vnpay" | "paypal";

const PAY_METHODS: { id: PayMethod; label: string }[] = [
  { id: "bank", label: "Chuyển khoản qua ngân hàng" },
  { id: "momo", label: "MoMo / ZaloPay" },
  { id: "vnpay", label: "VNPay" },
  { id: "paypal", label: "PayPal" },
];

export default function OrderClient() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [product, setProduct] = useState<Product | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [message, setMessage] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [payMethod, setPayMethod] = useState<PayMethod>("bank");
  const [promo, setPromo] = useState("");
  const [promoMsg, setPromoMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const prefilledRef = useRef(false);

  // Chọn mẫu từ ?mau=Tên mẫu (đi từ nút mua / báo giá); không có
  // thì mặc định mẫu đầu tiên, khách đổi được bằng ô chọn mẫu.
  useEffect(() => {
    let cancelled = false;
    fetchProducts().then((list) => {
      if (cancelled) return;
      setProducts(list);
      const mau = searchParams.get("mau");
      const found = mau ? list.find((p) => p.name === mau) : undefined;
      setProduct(found ?? list[0] ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  // Điền sẵn thông tin tài khoản khách đã đăng nhập.
  useEffect(() => {
    if (prefilledRef.current) return;
    prefilledRef.current = true;
    getCustomerSession().then((c) => {
      if (!c) return;
      setName(c.name);
      setEmail(c.email);
      setPhone(c.phone);
    });
  }, []);

  // Giá 1 mẫu (giá giảm nếu mẫu đang giảm) và tổng tiền theo số lượng.
  const unitPrice = product ? (product.sale_price ?? product.price) : null;
  const totalPrice = unitPrice ? unitPrice * quantity : null;

  const canSubmit =
    name.trim().length > 0 &&
    phone.trim().length > 0 &&
    address.trim().length > 0 &&
    product !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || sending) return;
    setSending(true);
    setError("");
    // Địa chỉ, số lượng và phương thức thanh toán chưa có cột riêng
    // trong bảng quote_requests nên gộp vào ghi chú để admin đọc được.
    const fullAddress = [address.trim(), ward.trim(), district.trim(), city.trim()]
      .filter(Boolean)
      .join(", ");
    const payLabel =
      PAY_METHODS.find((m) => m.id === payMethod)?.label ?? "";
    const fullMessage = [
      message.trim(),
      fullAddress ? `Địa chỉ giao hàng: ${fullAddress}` : "",
      `Số lượng: ${quantity}`,
      `Phương thức thanh toán: ${payLabel}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          product_name: product?.name ?? "",
          message: fullMessage,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!data.ok) {
        setError(
          data.error ??
            "Gửi yêu cầu không thành công. Hãy thử lại hoặc gọi cho xưởng.",
        );
        return;
      }
      setDone(true);
    } catch {
      setError(
        "Lỗi kết nối cơ sở dữ liệu. Hãy thử lại hoặc gọi cho xưởng.",
      );
    } finally {
      setSending(false);
    }
  }

  function handlePromo() {
    setPromoMsg("Mã khuyến mãi sẽ được kích hoạt sau");
  }

  // Chi tiết của phương thức thanh toán đã chọn (dùng chung cho cả
  // lúc chọn trước khi đặt hàng và lúc xem lại sau khi đặt xong).
  function renderPayDetails() {
    if (payMethod === "bank") {
      return (
        <div className="mt-4 rounded-xl bg-cream p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <div className="flex justify-between gap-4 border-b border-coffee/10 py-2 text-sm">
                <span className="font-bold text-coffee-deep">Ngân hàng</span>
                <span className="text-right text-coffee-deep">
                  Vietcombank — PGD Kiến An
                </span>
              </div>
              <div className="flex justify-between gap-4 border-b border-coffee/10 py-2 text-sm">
                <span className="font-bold text-coffee-deep">
                  Số tài khoản
                </span>
                <span className="text-right font-bold text-coffee-deep">
                  4943625922
                </span>
              </div>
              <div className="flex justify-between gap-4 py-2 text-sm">
                <span className="font-bold text-coffee-deep">
                  Chủ tài khoản
                </span>
                <span className="text-right text-coffee-deep">
                  PHAM THI THANH XUAN
                </span>
              </div>
            </div>
            <div className="shrink-0 text-center">
              <img
                src="/images/qr-vietcombank.png"
                alt="Mã QR Vietcombank nhận tiền — PHAM THI THANH XUAN, 4943625922"
                className="mx-auto w-[150px] rounded-lg border border-coffee/10 bg-white"
              />
              <p className="mt-2 text-xs font-bold text-coffee-deep">
                Quét mã để thanh toán
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-coffee-deep/70">
            Quý khách vui lòng thanh toán trước ít nhất 30% giá trị đơn hàng
            qua phương thức chuyển khoản. Quét mã QR bằng app ngân hàng rồi
            nhập số tiền cần thanh toán. Xưởng sẽ liên hệ xác nhận sau khi
            nhận được đơn hàng.
          </p>
        </div>
      );
    }
    const label =
      PAY_METHODS.find((m) => m.id === payMethod)?.label ?? "";
    return (
      <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-sm leading-relaxed text-coffee-deep/70">
        Thanh toán online qua {label} sẽ được bật sau — xưởng sẽ liên hệ
        hướng dẫn bạn thanh toán.
      </p>
    );
  }

  const inputCls =
    "mt-1.5 w-full rounded-lg border border-coffee/20 bg-white px-4 py-3 text-base text-coffee-deep outline-none focus:border-coffee";
  const labelCls = "text-sm font-bold text-coffee-deep";

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="section-kicker text-center text-xs font-bold uppercase text-gold-dark">
          Đặt hàng
        </p>
        <h1 className="mt-2 text-center text-3xl font-black text-coffee-deep sm:text-4xl">
          Đặt mua sofa
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-coffee-deep/70">
          Điền thông tin bên dưới, xưởng sẽ gọi lại tư vấn kích thước,
          chất liệu và xác nhận đơn hàng cho bạn.
        </p>

        {done ? (
          <>
            <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-coffee/10 bg-white p-8 text-center shadow-sm">
              <p className="text-4xl" aria-hidden="true">
                ✓
              </p>
              <h2 className="mt-3 text-2xl font-black text-coffee-deep">
                Đã gửi yêu cầu đặt hàng!
              </h2>
              <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-coffee-deep/70">
                Xưởng đã nhận yêu cầu đặt mua mẫu{" "}
                <span className="font-bold text-coffee-deep">
                  {product?.name}
                </span>{" "}
                của bạn và sẽ liên hệ lại sớm để tư vấn và xác nhận đơn hàng.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/san-pham"
                  className="rounded-full bg-coffee px-6 py-3 text-sm font-bold text-white transition hover:bg-coffee-dark"
                >
                  Xem thêm sản phẩm
                </Link>
                <Link
                  href="/"
                  className="rounded-full border-2 border-coffee px-6 py-3 text-sm font-bold text-coffee transition hover:bg-coffee hover:text-white"
                >
                  Về trang chủ
                </Link>
              </div>
            </div>

            {/* Thanh toán — hiện sau khi đặt hàng xong (chỉ để xem
                trước cách thanh toán, chưa xử lý thanh toán thật). */}
            <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-coffee/10 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-black text-coffee-deep">
                Thanh toán
              </h2>
              <p className="mt-2 text-base leading-relaxed text-coffee-deep/70">
                Đơn hàng của bạn đã được gửi. Xem lại phương thức thanh toán
                đã chọn bên dưới — xưởng sẽ xác nhận đơn rồi hướng dẫn bạn
                thanh toán.
              </p>
              {product && (
                <div className="mt-5 flex items-center gap-4 rounded-xl bg-cream p-4">
                  <img
                    src={product.img}
                    alt={product.name}
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold text-coffee-deep">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-sm text-coffee-deep/60">
                      Số lượng: {quantity}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold uppercase tracking-wide text-coffee-deep/50">
                      Tổng thanh toán
                    </p>
                    <p className="text-lg font-black text-coffee">
                      {totalPrice
                        ? formatPrice(totalPrice)
                        : "Liên hệ báo giá"}
                    </p>
                  </div>
                </div>
              )}
              <p className="mt-5 text-sm font-bold text-coffee-deep">
                Phương thức thanh toán:{" "}
                {PAY_METHODS.find((m) => m.id === payMethod)?.label}
              </p>
              {renderPayDetails()}
            </div>
          </>
        ) : (
          <>
            {/* Mẫu đã chọn */}
            {product && (
              <div className="mx-auto mt-10 flex max-w-2xl items-center gap-4 rounded-2xl border border-coffee/10 bg-white p-4 shadow-sm sm:p-5">
                <img
                  src={product.img}
                  alt={product.name}
                  className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
                />
                <div className="min-w-0">
                  <p className="truncate text-lg font-extrabold text-coffee-deep">
                    {product.name}
                  </p>
                  <p className="mt-0.5 text-sm text-coffee-deep/60">
                    Phong cách: {product.style}
                  </p>
                  {product.sale_price && product.price ? (
                    <p className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="text-xl font-black text-coffee">
                        {formatPrice(product.sale_price)}
                      </span>
                      <span className="text-sm font-semibold text-coffee-deep/50 line-through">
                        {formatPrice(product.price)}
                      </span>
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                        -
                        {Math.round(
                          (1 - product.sale_price / product.price) * 100,
                        )}
                        %
                      </span>
                    </p>
                  ) : (
                    <p className="mt-1 text-xl font-black text-coffee">
                      {product.price
                        ? formatPrice(product.price)
                        : "Giá: liên hệ báo giá"}
                    </p>
                  )}
                </div>
                <Link
                  href={`/san-pham/${product.slug}`}
                  className="ml-auto hidden shrink-0 text-sm font-bold text-coffee hover:underline sm:block"
                >
                  Xem chi tiết
                </Link>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6">
              <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
                {/* Cột trái */}
                <div className="space-y-6">
                  {/* Thông tin giao hàng */}
                  <div className="rounded-2xl border border-coffee/10 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-black text-coffee-deep">
                      Thông tin giao hàng
                    </h2>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <label className="block">
                        <span className={labelCls}>Họ tên *</span>
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
                        <span className={labelCls}>Số điện thoại *</span>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="VD: 0912 345 678"
                          className={inputCls}
                        />
                      </label>
                    </div>
                    <label className="mt-5 block">
                      <span className={labelCls}>Email</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="VD: ban@email.com"
                        className={inputCls}
                      />
                    </label>
                    <label className="mt-5 block">
                      <span className={labelCls}>Địa chỉ (tên đường) *</span>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="VD: 350 Hoàng Quốc Việt"
                        className={inputCls}
                      />
                    </label>
                    <div className="mt-5 grid gap-5 sm:grid-cols-3">
                      <label className="block">
                        <span className={labelCls}>Tỉnh/TP</span>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="VD: Hải Phòng"
                          className={inputCls}
                        />
                      </label>
                      <label className="block">
                        <span className={labelCls}>Quận/Huyện</span>
                        <input
                          type="text"
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          placeholder="VD: Kiến An"
                          className={inputCls}
                        />
                      </label>
                      <label className="block">
                        <span className={labelCls}>Phường/Xã</span>
                        <input
                          type="text"
                          value={ward}
                          onChange={(e) => setWard(e.target.value)}
                          placeholder="VD: Phù Liễn"
                          className={inputCls}
                        />
                      </label>
                    </div>
                    <label className="mt-5 block">
                      <span className={labelCls}>
                        Ghi chú (kích thước, màu vải, địa chỉ giao hàng…)
                      </span>
                      <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="VD: Sofa góc L dài 2,4m cho phòng khách chung cư, vải màu be…"
                        className={inputCls}
                      />
                    </label>
                  </div>

                  {/* Phương thức giao hàng */}
                  <div className="rounded-2xl border border-coffee/10 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-black text-coffee-deep">
                      Phương thức giao hàng
                    </h2>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream px-4 py-3">
                      <span className="text-sm font-bold text-coffee-deep">
                        Giao hàng tận nơi
                      </span>
                      <span className="text-sm text-coffee-deep/70">
                        Phí vận chuyển: liên hệ báo giá
                      </span>
                    </div>
                  </div>

                  {/* Phương thức thanh toán */}
                  <div className="rounded-2xl border border-coffee/10 bg-white p-6 shadow-sm sm:p-8">
                    <h2 className="text-xl font-black text-coffee-deep">
                      Phương thức thanh toán
                    </h2>
                    <div
                      className="mt-4 space-y-3"
                      role="radiogroup"
                      aria-label="Phương thức thanh toán"
                    >
                      {PAY_METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          role="radio"
                          aria-checked={payMethod === m.id}
                          onClick={() => setPayMethod(m.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-bold transition ${
                            payMethod === m.id
                              ? "border-coffee bg-cream text-coffee-deep"
                              : "border-coffee/20 bg-white text-coffee-deep hover:border-coffee"
                          }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                              payMethod === m.id
                                ? "border-coffee"
                                : "border-coffee/30"
                            }`}
                            aria-hidden="true"
                          >
                            {payMethod === m.id && (
                              <span className="h-2.5 w-2.5 rounded-full bg-[#241208]" />
                            )}
                          </span>
                          {m.label}
                        </button>
                      ))}
                    </div>
                    {renderPayDetails()}
                  </div>
                </div>

                {/* Cột phải */}
                <div className="space-y-6">
                  {/* Giỏ hàng */}
                  <div className="rounded-2xl border border-coffee/10 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-black text-coffee-deep">
                      Giỏ hàng
                    </h2>
                    {product && (
                      <div className="mt-4 flex items-center gap-4">
                        <img
                          src={product.img}
                          alt={product.name}
                          className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-extrabold text-coffee-deep">
                            {product.name}
                          </p>
                          <p className="mt-0.5 text-sm font-bold text-coffee">
                            {unitPrice
                              ? formatPrice(unitPrice)
                              : "Liên hệ báo giá"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center rounded-full border border-coffee/20">
                          <button
                            type="button"
                            aria-label="Giảm số lượng"
                            onClick={() =>
                              setQuantity((q) => Math.max(1, q - 1))
                            }
                            disabled={quantity <= 1}
                            className="px-3 py-1.5 text-lg font-bold text-coffee-deep disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm font-bold text-coffee-deep">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            aria-label="Tăng số lượng"
                            onClick={() =>
                              setQuantity((q) => Math.min(99, q + 1))
                            }
                            className="px-3 py-1.5 text-lg font-bold text-coffee-deep"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                    <label className="mt-4 block">
                      <span className={labelCls}>Đổi mẫu</span>
                      <select
                        value={product?.name ?? ""}
                        onChange={(e) => {
                          const found = products.find(
                            (p) => p.name === e.target.value,
                          );
                          if (found) setProduct(found);
                        }}
                        className={inputCls}
                      >
                        {products.map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Mã khuyến mãi */}
                  <div className="rounded-2xl border border-coffee/10 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-black text-coffee-deep">
                      Mã khuyến mãi
                    </h2>
                    <div className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={promo}
                        onChange={(e) => setPromo(e.target.value)}
                        placeholder="Nhập mã khuyến mãi"
                        className="min-w-0 flex-1 rounded-lg border border-coffee/20 bg-white px-4 py-3 text-sm text-coffee-deep outline-none focus:border-coffee"
                      />
                      <button
                        type="button"
                        onClick={handlePromo}
                        className="shrink-0 rounded-lg bg-[#241208] px-5 py-3 text-sm font-bold text-white transition hover:bg-coffee-dark"
                      >
                        Áp dụng
                      </button>
                    </div>
                    {promoMsg && (
                      <p className="mt-3 text-sm text-coffee-deep/70">
                        {promoMsg}
                      </p>
                    )}
                  </div>

                  {/* Tóm tắt đơn hàng */}
                  <div className="rounded-2xl border border-coffee/10 bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-black text-coffee-deep">
                      Tóm tắt đơn hàng
                    </h2>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-coffee-deep/70">
                          Tổng tiền hàng
                          {unitPrice && quantity > 1
                            ? ` (${formatPrice(unitPrice)} × ${quantity})`
                            : ""}
                        </span>
                        <span className="font-bold text-coffee-deep">
                          {totalPrice
                            ? formatPrice(totalPrice)
                            : "Liên hệ báo giá"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-coffee-deep/70">
                          Phí vận chuyển
                        </span>
                        <span className="font-bold text-coffee-deep">
                          Liên hệ
                        </span>
                      </div>
                      <div className="mt-3 flex justify-between gap-4 border-t border-coffee/10 pt-3">
                        <span className="font-bold text-coffee-deep">
                          Tổng thanh toán
                        </span>
                        <span className="text-lg font-black text-coffee">
                          {totalPrice
                            ? formatPrice(totalPrice)
                            : "Liên hệ báo giá"}
                        </span>
                      </div>
                    </div>
                    {error && (
                      <p
                        role="alert"
                        className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                      >
                        {error}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={!canSubmit || sending}
                      className="mt-5 w-full rounded-full bg-[#241208] py-3.5 text-base font-bold text-white shadow transition hover:bg-coffee-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sending ? "Đang gửi…" : "ĐẶT HÀNG"}
                    </button>
                    <p className="mt-3 text-center text-sm text-coffee-deep/60">
                      Xưởng sẽ gọi lại tư vấn và xác nhận đơn hàng trước khi
                      bạn thanh toán.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}
