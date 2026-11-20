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
// chưa xử lý thanh toán thật, chưa gọi API thanh toán. Các phương
// thức để RIÊNG từng mục (không gộp MoMo/ZaloPay): ngân hàng, MoMo,
// ZaloPay, VNPay, PayPal. Khung thanh toán làm theo kiểu trang
// VNPay (đã duyệt theo ảnh ghép 2026-11-20): cột trái là "Thông tin
// đơn hàng" — dòng đầu là tên mẫu đã chọn (số tiền đi theo đúng mẫu
// đó), số tiền thanh toán = cọc 50%, giá trị đơn, phí 0đ — KHÔNG có
// dòng "Nhà cung cấp", và chưa có "Mã đơn hàng" vì đơn chỉ có mã sau
// khi khách bấm ĐẶT HÀNG; mã QR nằm RIÊNG ở cột phải (không chung
// hàng với đoạn văn bên trái). Nút "Hủy thanh toán" quay lại trang
// sản phẩm.
// - Ngân hàng: /images/qr-vietcombank.png là mã QR SẠCH chỉ còn ô
//   mã (cắt từ thẻ VietQR thật của chủ xưởng), đã kiểm tra giải mã
//   được: Vietcombank BIN 970436, STK 4943625922.
// - MoMo: /images/qr-momo.png là mã QR MoMo SẠCH chỉ còn ô mã (cắt
//   từ thẻ MoMo thật), đã kiểm tra giải mã được: MoMo BIN 971025,
//   0943625922 — quét bằng MoMo, ZaloPay hoặc app ngân hàng đều
//   được (cùng chuẩn VietQR).
// - ZaloPay: /images/zalo-qr.png là thẻ Danh thiếp Zalo của Phạm
//   Thanh Xuân (zaloapp.com/qr/p/1smblm0vd2cny) — quét là MỞ ĐOẠN
//   CHAT Zalo, KHÔNG phải mã thanh toán trực tiếp; khách quét để
//   nhắn Zalo, xưởng hướng dẫn thanh toán trong đoạn chat.
// - VNPay / PayPal: chưa có mã QR thật nên vẫn hiện ghi chú chờ bật sau.
// Mã QR TĨNH: khách quét rồi tự nhập số tiền trong app; các con số
// hiện trên trang đều tính từ giá thật của mẫu đã chọn, không điền
// bừa; mã khuyến mãi cũng chưa có hệ thống giảm giá thật.
type PayMethod = "bank" | "momo" | "zalopay" | "vnpay" | "paypal";

const PAY_METHODS: { id: PayMethod; label: string }[] = [
  { id: "bank", label: "Chuyển khoản qua ngân hàng" },
  { id: "momo", label: "MoMo" },
  { id: "zalopay", label: "ZaloPay" },
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
  // Các ô làm theo kiểu trang VNPay: bên trái là "Thông tin đơn
  // hàng" (số tiền thanh toán = cọc 50%, giá trị đơn, phí 0đ —
  // KHÔNG có dòng "Nhà cung cấp", và chưa có "Mã đơn hàng" vì đơn
  // chỉ có mã sau khi khách bấm ĐẶT HÀNG); mã QR nằm RIÊNG ở cột
  // phải (không chung hàng với đoạn văn bên trái).
  // - Ngân hàng: thẻ VietQR thật của chủ xưởng, đã kiểm tra giải mã
  //   được: Vietcombank (BIN 970436), STK 4943625922.
  // - MoMo: mã QR MoMo thật, đã kiểm tra giải mã được: MoMo (BIN
  //   971025), 0943625922 — quét bằng MoMo, ZaloPay hoặc app ngân
  //   hàng đều được (cùng chuẩn VietQR).
  // - ZaloPay: thẻ Danh thiếp Zalo — quét là MỞ ĐOẠN CHAT Zalo,
  //   không phải mã thanh toán trực tiếp; khách quét để nhắn Zalo,
  //   xưởng hướng dẫn thanh toán trong đoạn chat.
  // Mã QR TĨNH: khách quét rồi tự nhập số tiền trong app; các con số
  // hiện trên trang đều tính từ giá thật của mẫu đã chọn, không điền bừa.
  function renderPayDetails() {
    // VNPay / PayPal chưa có mã QR thật nên vẫn hiện ghi chú chờ bật sau.
    if (payMethod === "vnpay" || payMethod === "paypal") {
      const label =
        PAY_METHODS.find((m) => m.id === payMethod)?.label ?? "";
      return (
        <p className="rounded-xl bg-cream px-4 py-3 text-sm leading-relaxed text-coffee-deep/70">
          Thanh toán online qua {label} sẽ được bật sau — xưởng sẽ liên hệ
          hướng dẫn bạn thanh toán.
        </p>
      );
    }
    // Ngân hàng / MoMo / ZaloPay: cùng một khung "Thông tin đơn hàng"
    // (sản phẩm đã chọn, cọc 50%, giá trị đơn, phí 0đ), chỉ khác dòng
    // thanh toán ở cuối.
    const deposit =
      totalPrice != null ? Math.round(totalPrice * 0.5) : null;
    const payLine =
      payMethod === "bank" ? (
        <>
          Chuyển khoản đến: Vietcombank — PGD Kiến An • STK{" "}
          <span className="font-bold text-coffee-deep">4943625922</span>{" "}
          • PHAM THI THANH XUAN
        </>
      ) : payMethod === "momo" ? (
        <>
          Thanh toán đến: MoMo •{" "}
          <span className="font-bold text-coffee-deep">0943625922</span>{" "}
          • PHAM THI THANH XUAN
        </>
      ) : (
        <>
          Quét mã Zalo bên phải để nhắn với xưởng — xưởng sẽ hướng dẫn
          bạn thanh toán.
        </>
      );
    return (
      <div className="rounded-xl bg-cream p-4">
        <p className="text-base font-bold text-coffee-deep">
          Thông tin đơn hàng
        </p>
        <div className="mt-3">
          <p className="text-sm text-coffee-deep/60">Sản phẩm</p>
          <p className="font-bold text-coffee-deep">
            {product?.name ?? "—"}
          </p>
        </div>
        <div className="mt-3">
          <p className="text-sm text-coffee-deep/60">
            Số tiền thanh toán (ít nhất 50%)
          </p>
          <p className="text-2xl font-bold text-[#006C35]">
            {deposit != null ? formatPrice(deposit) : "—"}
          </p>
        </div>
        <div className="mt-4">
          <p className="text-sm text-coffee-deep/60">
            Giá trị đơn hàng
          </p>
          <p className="font-bold text-coffee-deep">
            {totalPrice != null ? formatPrice(totalPrice) : "—"}
          </p>
        </div>
        <div className="mt-4">
          <p className="text-sm text-coffee-deep/60">Phí giao dịch</p>
          <p className="font-bold text-coffee-deep">0₫</p>
        </div>
        <p className="mt-4 border-t border-coffee/10 pt-3 text-xs leading-relaxed text-coffee-deep/60">
          {payLine}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-coffee-deep/70">
          {payMethod === "zalopay"
            ? "Quý khách vui lòng thanh toán trước ít nhất 50% giá trị đơn hàng. Quét mã Zalo bên phải để nhắn với xưởng, xưởng sẽ hướng dẫn thanh toán và xác nhận đơn hàng."
            : "Quý khách vui lòng thanh toán trước ít nhất 50% giá trị đơn hàng qua phương thức chuyển khoản. Vui lòng ghi tên và số điện thoại vào nội dung chuyển khoản để xưởng đối soát. Xưởng sẽ liên hệ xác nhận sau khi nhận được đơn hàng."}
        </p>
      </div>
    );
  }

  // Khung mã QR — nằm RIÊNG ở cột phải (kiểu trang VNPay), không
  // chung hàng với đoạn văn bên trái. Hiện khi chọn ngân hàng, MoMo
  // hoặc ZaloPay; VNPay / PayPal chưa có mã QR nên không hiện.
  function renderQrPanel() {
    if (payMethod === "vnpay" || payMethod === "paypal") return null;
    // MoMo: mã QR VietQR thật (MoMo BIN 971025, 0943625922), đã kiểm
    // tra giải mã được — khách quét bằng MoMo, ZaloPay hoặc app ngân
    // hàng rồi tự nhập số tiền (mã tĩnh, không có sẵn số tiền).
    // ZaloPay: thẻ Danh thiếp Zalo của Phạm Thanh Xuân — quét là MỞ
    // ĐOẠN CHAT Zalo, không phải mã thanh toán trực tiếp; khách quét
    // để nhắn Zalo, xưởng hướng dẫn thanh toán trong đoạn chat.
    const isZalo = payMethod === "zalopay";
    const qrSrc = isZalo
      ? "/images/zalo-qr.png"
      : payMethod === "momo"
        ? "/images/qr-momo.png"
        : "/images/qr-vietcombank.png";
    const qrAlt = isZalo
      ? "Mã QR Zalo — Phạm Thanh Xuân, quét để nhắn Zalo với xưởng"
      : payMethod === "momo"
        ? "Mã QR MoMo nhận tiền — PHAM THI THANH XUAN, 0943625922"
        : "Mã QR Vietcombank nhận tiền — PHAM THI THANH XUAN, 4943625922";
    const title = isZalo
      ? "Quét mã để nhắn Zalo"
      : payMethod === "momo"
        ? "Quét mã qua MoMo"
        : "Quét mã qua App Ngân hàng/ Ví điện tử";
    const guide = isZalo
      ? "Nhắn Zalo để được hướng dẫn thanh toán"
      : "Hướng dẫn thanh toán";
    const hint = isZalo
      ? "Mở app Zalo, quét mã để nhắn với xưởng."
      : "Mở app MoMo, ZaloPay hoặc ngân hàng, chọn quét mã QR rồi nhập số tiền.";
    return (
      <div className="rounded-2xl border border-[#006C35]/25 bg-[#EAF6EC] p-5 text-center shadow-sm">
        <p className="text-base font-bold text-[#006C35]">{title}</p>
        <p className="mt-2 text-sm text-[#009444]">
          <span className="mr-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#009444] text-[10px] font-bold text-white">
            i
          </span>
          {guide}
        </p>
        <div className="relative mx-auto mt-4 w-fit">
          <img
            src={qrSrc}
            alt={qrAlt}
            className="w-[250px] rounded-lg"
          />
          <span
            aria-hidden
            className="absolute -left-2 -top-2 h-6 w-6 rounded-tl-md border-l-4 border-t-4 border-[#009444]"
          />
          <span
            aria-hidden
            className="absolute -right-2 -top-2 h-6 w-6 rounded-tr-md border-r-4 border-t-4 border-[#009444]"
          />
          <span
            aria-hidden
            className="absolute -bottom-2 -left-2 h-6 w-6 rounded-bl-md border-b-4 border-l-4 border-[#009444]"
          />
          <span
            aria-hidden
            className="absolute -bottom-2 -right-2 h-6 w-6 rounded-br-md border-b-4 border-r-4 border-[#009444]"
          />
        </div>
        {isZalo ? null : (
          <p className="mt-4 text-sm font-bold italic text-[#006C35]">
            Scan to Pay
          </p>
        )}
        <Link
          href="/san-pham"
          className="mx-auto mt-4 block w-[220px] rounded-lg bg-[#F0F0F0] px-4 py-3 text-sm text-coffee-deep transition hover:bg-[#E5E5E5]"
        >
          Hủy thanh toán
        </Link>
        <p className="mt-4 text-xs leading-relaxed text-coffee-deep/60">
          {hint}
        </p>
      </div>
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
              <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">{renderPayDetails()}</div>
                {payMethod === "bank" ||
                payMethod === "momo" ||
                payMethod === "zalopay" ? (
                  <div className="w-full shrink-0 sm:w-[250px]">
                    {renderQrPanel()}
                  </div>
                ) : null}
              </div>
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
                    <div className="mt-4">{renderPayDetails()}</div>
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

                  {/* Mã QR — riêng ở cột phải (kiểu trang VNPay),
                      chỉ hiện khi chọn ngân hàng, MoMo hoặc ZaloPay.
                      Không chung hàng với đoạn văn bên trái. */}
                  {renderQrPanel()}

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
