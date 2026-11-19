"use client";

import { useEffect, useState } from "react";
import AdminNav from "../AdminNav";
import { getSession, type AdminUser } from "@/lib/admin-auth";
import { formatPrice } from "@/lib/products";

type AdminProduct = {
  id: number;
  name: string;
  style: string | null;
  img: string | null;
  desc: string | null;
  price: number | null;
  sale_price: number | null;
};

type RowDraft = {
  onSale: boolean;
  price: string;
  sale: string;
  pct: string;
};

// % giảm (số nguyên) tính từ giá gốc + giá giảm. Trả "" nếu chưa tính được.
function pctFrom(priceStr: string, saleStr: string): string {
  const price = Number(priceStr);
  const sale = Number(saleStr);
  if (!Number.isFinite(price) || price <= 0) return "";
  if (saleStr.trim() === "" || !Number.isFinite(sale) || sale < 0) return "";
  return String(Math.max(0, Math.round((1 - sale / price) * 100)));
}

// Giá giảm (làm tròn đồng) tính từ giá gốc + % giảm. Trả "" nếu chưa tính được.
function saleFrom(priceStr: string, pctStr: string): string {
  const price = Number(priceStr);
  const pct = Number(pctStr);
  if (!Number.isFinite(price) || price <= 0) return "";
  if (pctStr.trim() === "" || !Number.isFinite(pct) || pct < 0 || pct > 90) return "";
  return String(Math.round(price * (1 - pct / 100)));
}

const EMPTY_DRAFT: RowDraft = { onSale: false, price: "", sale: "", pct: "" };

// Trang /admin/giam-gia: quản trị bật/tắt giảm giá, chỉnh mức giảm
// theo % hoặc giá giảm, và xóa hẳn giảm giá của 8 mẫu sofa. Lưu vào
// MySQL (cột sale_price của bảng products: có giá = đang giảm,
// NULL = không giảm) qua API PATCH /api/admin/products/[id] đã có
// sẵn. Shop đọc giá từ MySQL nên thay đổi ở đây hiện ngay trên shop.
// - Tắt giảm giá: chỉ gạt công tắc rồi Lưu — giá giảm cũ vẫn giữ
//   trong ô nhập, bật lại là khôi phục (chưa lưu thì không mất).
// - Xóa giảm giá: xóa hẳn giá giảm đã lưu (PATCH sale_price: null)
//   và dọn luôn ô nhập — bật lại sau sẽ gợi ý mức giảm mới (-10%).
export default function GiamGiaClient() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<number, RowDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    void (async () => {
      const u = await getSession();
      setUser(u);
      if (u) await loadProducts(u.email);
      else setLoading(false);
    })();
  }, []);

  async function loadProducts(email: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/admin/products?email=${encodeURIComponent(email)}`,
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        products?: AdminProduct[];
        error?: string;
      };
      if (!data.ok || !Array.isArray(data.products)) {
        setError(data.error ?? "Không tải được danh sách sản phẩm.");
        return;
      }
      setProducts(data.products);
      const next: Record<number, RowDraft> = {};
      for (const p of data.products) {
        const price = p.price === null ? "" : String(p.price);
        const sale = p.sale_price === null ? "" : String(p.sale_price);
        next[p.id] = {
          onSale: p.sale_price !== null,
          price,
          sale,
          pct: pctFrom(price, sale),
        };
      }
      setDrafts(next);
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setLoading(false);
    }
  }

  function setDraft(id: number, patch: Partial<RowDraft>) {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? EMPTY_DRAFT), ...patch },
    }));
  }

  // Đổi giá gốc: giữ nguyên giá giảm đã nhập, tính lại % cho khớp
  // (% và giá giảm luôn đồng nhất với nhau).
  function onPriceChange(id: number, value: string) {
    const d = drafts[id] ?? EMPTY_DRAFT;
    setDraft(id, { price: value, pct: pctFrom(value, d.sale) });
  }

  // Sửa giá giảm trực tiếp: tính lại % cho khớp.
  function onSaleChange(id: number, value: string) {
    const d = drafts[id] ?? EMPTY_DRAFT;
    setDraft(id, {
      sale: value,
      pct: value.trim() === "" ? "" : pctFrom(d.price, value),
    });
  }

  // Nhập % giảm (0–90): tính ngay giá giảm = giá gốc × (1 − %/100).
  function onPctChange(id: number, value: string) {
    const d = drafts[id] ?? EMPTY_DRAFT;
    const nextSale = saleFrom(d.price, value);
    setDraft(id, { pct: value, sale: nextSale === "" ? d.sale : nextSale });
  }

  // Bật giảm giá: nếu chưa có giá giảm thì gợi ý -10% so với giá gốc
  // (theo đúng mức giảm tạm đang dùng) — chỉ là gợi ý trong ô nhập,
  // chưa lưu cho tới khi bấm "Lưu". Giá giảm cũ còn trong ô nhập thì
  // giữ nguyên (kể cả khi vừa tắt đi rồi bật lại).
  function toggleSale(p: AdminProduct, on: boolean) {
    const d = drafts[p.id] ?? EMPTY_DRAFT;
    if (on) {
      if (d.sale.trim() === "") {
        const priceNum = Number(d.price);
        const suggestion =
          Number.isFinite(priceNum) && priceNum > 0
            ? String(Math.round(priceNum * 0.9))
            : "";
        setDraft(p.id, {
          onSale: true,
          sale: suggestion,
          pct: suggestion === "" ? "" : "10",
        });
      } else {
        setDraft(p.id, { onSale: true, pct: pctFrom(d.price, d.sale) });
      }
    } else {
      setDraft(p.id, { onSale: false });
    }
    setNotice("");
  }

  async function saveRow(p: AdminProduct) {
    if (!user) return;
    const d = drafts[p.id] ?? EMPTY_DRAFT;
    const price = d.price.trim() === "" ? null : Number(d.price);
    let sale: number | null;
    if (!d.onSale) {
      sale = null;
    } else if (d.pct.trim() !== "") {
      // Nhập % thì % thắng: giá giảm tính từ % (làm tròn đồng).
      const pctNum = Number(d.pct);
      if (!Number.isFinite(pctNum) || pctNum < 0 || pctNum > 90) {
        setError(`"${p.name}": mức giảm phải từ 0% đến 90%.`);
        return;
      }
      if (pctNum === 0) {
        setError(
          `"${p.name}": mức giảm 0% nghĩa là không giảm giá — hãy nhập từ 1% đến 90%, hoặc tắt giảm giá.`,
        );
        return;
      }
      if (price === null || !Number.isFinite(price) || price <= 0) {
        setError(
          `"${p.name}": cần nhập giá gốc hợp lệ để tính giá giảm theo %.`,
        );
        return;
      }
      sale = Math.round(price * (1 - pctNum / 100));
    } else {
      sale = d.sale.trim() === "" ? null : Number(d.sale);
    }
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      setError(`"${p.name}": giá gốc phải là số tiền VND (>= 0) hoặc để trống.`);
      return;
    }
    if (d.onSale) {
      if (sale === null || !Number.isFinite(sale) || sale < 0) {
        setError(
          `"${p.name}": đang bật giảm giá thì phải nhập giá giảm (>= 0) hoặc mức giảm %.`,
        );
        return;
      }
      if (price !== null && sale >= price) {
        setError(`"${p.name}": giá giảm phải nhỏ hơn giá gốc.`);
        return;
      }
    }
    setSavingId(p.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, price, sale_price: sale }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Lưu thất bại. Hãy thử lại.");
        return;
      }
      const savedDiscount =
        sale !== null && price !== null && price > 0
          ? Math.round((1 - sale / price) * 100)
          : null;
      setNotice(
        d.onSale
          ? `Đã lưu giảm giá cho "${p.name}" (${formatPrice(sale as number)}${
              savedDiscount !== null ? `, -${savedDiscount}%` : ""
            }).`
          : `Đã tắt giảm giá cho "${p.name}".`,
      );
      await loadProducts(user.email);
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setSavingId(null);
    }
  }

  // Xóa hẳn giảm giá: PATCH sale_price: null ngay (không cần bấm
  // "Lưu") và dọn luôn giá giảm + % trong ô nhập — bật lại sau sẽ
  // gợi ý mức giảm mới (-10%), không khôi phục giá giảm cũ.
  async function deleteSale(p: AdminProduct) {
    if (!user) return;
    setDeletingId(p.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, sale_price: null }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Xóa giảm giá thất bại. Hãy thử lại.");
        return;
      }
      setDraft(p.id, { onSale: false, sale: "", pct: "" });
      setConfirmDeleteId(null);
      setNotice(`Đã xóa giảm giá cho "${p.name}" — shop chỉ hiện giá thường.`);
      await loadProducts(user.email);
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setDeletingId(null);
    }
  }

  if (!user) {
    return (
      <main className="bg-[#241208] py-14">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-6 sm:p-8">
            <h1 className="text-2xl font-black text-[#EADBC6]">
              Bạn chưa đăng nhập
            </h1>
            <p className="mt-3 leading-relaxed text-[#EADBC6]/70">
              Hãy đăng nhập tài khoản quản trị để quản lý giảm giá.
            </p>
            <a
              href="/admin"
              className="mt-6 inline-block rounded-full bg-[#FFD9A0] px-6 py-3 text-sm font-bold text-[#241208] transition hover:opacity-90"
            >
              Đi tới trang đăng nhập →
            </a>
          </div>
        </div>
      </main>
    );
  }

  const onSaleCount = products.filter((p) => p.sale_price !== null).length;

  return (
    <main className="bg-[#241208] py-14 md:pl-[232px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mt-2 text-3xl font-black text-[#EADBC6] sm:text-4xl">
          Giảm giá
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#EADBC6]/70">
          Bật/tắt giảm giá, chỉnh mức giảm theo % hoặc giá giảm, và xóa hẳn
          giảm giá của 8 mẫu sofa đang bán. Hiện có{" "}
          <strong className="text-[#FFD9A0]">
            {onSaleCount}/{products.length} mẫu đang giảm giá
          </strong>
          . Tắt giảm giá ở đây là shop hết hiện tem giảm giá ngay (chỉ
          hiện giá thường, giá giảm cũ vẫn giữ trong ô nhập); xóa giảm giá
          thì xóa hẳn giá giảm đã lưu — bật lại sau sẽ tính mức giảm mới.
        </p>
        <AdminNav active="giam-gia" />

        {notice && (
          <p
            role="status"
            className="mt-6 rounded-xl border border-green-400/50 bg-green-400/10 px-4 py-3 text-sm font-semibold text-green-300"
          >
            {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-red-400/50 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300"
          >
            {error}
          </p>
        )}

        {loading ? (
          <p className="mt-8 text-[#EADBC6]/70">Đang tải sản phẩm…</p>
        ) : products.length === 0 ? (
          <p className="mt-8 text-[#EADBC6]/70">
            Chưa có sản phẩm nào trong cơ sở dữ liệu.
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {products.map((p) => {
              const d = drafts[p.id] ?? EMPTY_DRAFT;
              const priceNum = Number(d.price);
              const pctNum = Number(d.pct);
              // Giá giảm sẽ lưu: nhập % thì tính từ %, không thì lấy ô giá giảm.
              const effSaleStr =
                d.pct.trim() !== "" &&
                Number.isFinite(pctNum) &&
                pctNum >= 0 &&
                pctNum <= 90
                  ? saleFrom(d.price, d.pct) || d.sale
                  : d.sale;
              const effSaleNum = Number(effSaleStr);
              const discount =
                d.onSale &&
                Number.isFinite(priceNum) &&
                Number.isFinite(effSaleNum) &&
                priceNum > 0 &&
                effSaleNum >= 0 &&
                effSaleNum < priceNum
                  ? Math.round((1 - effSaleNum / priceNum) * 100)
                  : null;
              const saving = savingId === p.id;
              const deleting = deletingId === p.id;
              return (
                <div
                  key={p.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-4 sm:p-5 lg:flex-row lg:items-center"
                >
                  {p.img && (
                    <img
                      src={p.img}
                      alt={p.name}
                      className="h-20 w-28 shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold text-[#EADBC6]">{p.name}</p>
                    <p className="text-sm text-[#EADBC6]/60">
                      Phong cách: {p.style ?? "—"}
                    </p>
                    <p className="mt-1.5 text-base">
                      {p.sale_price !== null ? (
                        <>
                          <span className="font-black text-[#FFD9A0]">
                            {formatPrice(p.sale_price)}
                          </span>{" "}
                          <span className="text-sm text-[#EADBC6]/60 line-through">
                            {p.price !== null ? formatPrice(p.price) : ""}
                          </span>{" "}
                          {p.price !== null && p.price > 0 && (
                            <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                              -
                              {Math.round(
                                (1 - p.sale_price / p.price) * 100,
                              )}
                              %
                            </span>
                          )}
                          <span className="ml-2 rounded-full bg-green-500/20 px-2 py-0.5 text-[11px] font-bold text-green-300">
                            Đang giảm giá
                          </span>
                        </>
                      ) : p.price !== null ? (
                        <>
                          <span className="font-black text-[#FFD9A0]">
                            {formatPrice(p.price)}
                          </span>
                          <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-[#EADBC6]/70">
                            Không giảm giá
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-[#EADBC6]/60">
                          Chưa có giá — liên hệ báo giá
                        </span>
                      )}
                    </p>
                    {discount !== null && (
                      <p className="mt-1 text-sm font-semibold text-[#FFD9A0]">
                        Mức giảm sẽ lưu: -{discount}%
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 sm:w-80">
                    <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#EADBC6]">
                      <input
                        type="checkbox"
                        checked={d.onSale}
                        onChange={(e) => toggleSale(p, e.target.checked)}
                        className="h-5 w-5 accent-[#FFD9A0]"
                      />
                      Đang giảm giá
                    </label>
                    <label className="text-xs font-bold text-[#EADBC6]/70">
                      Giá gốc (VND)
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        inputMode="numeric"
                        value={d.price}
                        onChange={(e) => onPriceChange(p.id, e.target.value)}
                        placeholder="Ví dụ: 15000000"
                        className="mt-1 w-full rounded-xl border border-[#EADBC6]/30 bg-white/10 px-3 py-2 text-sm text-[#EADBC6] outline-none focus:border-[#FFD9A0]"
                      />
                    </label>
                    <label className="text-xs font-bold text-[#EADBC6]/70">
                      Giảm (%)
                      <span className="relative mt-1 block">
                        <input
                          type="number"
                          min={0}
                          max={90}
                          step={1}
                          inputMode="numeric"
                          value={d.pct}
                          disabled={!d.onSale}
                          onChange={(e) => onPctChange(p.id, e.target.value)}
                          placeholder="Ví dụ: 10"
                          className="w-full rounded-xl border border-[#EADBC6]/30 bg-white/10 px-3 py-2 pr-8 text-sm text-[#EADBC6] outline-none focus:border-[#FFD9A0] disabled:opacity-40"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[#EADBC6]/60">
                          %
                        </span>
                      </span>
                    </label>
                    <label className="text-xs font-bold text-[#EADBC6]/70">
                      Giá giảm (VND)
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        inputMode="numeric"
                        value={d.sale}
                        disabled={!d.onSale}
                        onChange={(e) => onSaleChange(p.id, e.target.value)}
                        placeholder="Ví dụ: 13500000"
                        className="mt-1 w-full rounded-xl border border-[#EADBC6]/30 bg-white/10 px-3 py-2 text-sm text-[#EADBC6] outline-none focus:border-[#FFD9A0] disabled:opacity-40"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => void saveRow(p)}
                      disabled={saving || deleting}
                      className="rounded-full bg-[#FFD9A0] px-4 py-2 text-sm font-bold text-[#241208] transition hover:opacity-90 disabled:opacity-50"
                    >
                      {saving ? "Đang lưu…" : "Lưu"}
                    </button>
                    {p.sale_price !== null &&
                      (confirmDeleteId === p.id ? (
                        <div className="rounded-xl border border-red-400/50 bg-red-400/10 p-3">
                          <p className="text-sm font-bold text-red-300">
                            Xóa giảm giá mẫu này?
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-[#EADBC6]/70">
                            Giá giảm sẽ bị xóa hẳn, shop chỉ hiện giá thường.
                            Bật lại sau sẽ tính mức giảm mới.
                          </p>
                          <div className="mt-2 flex gap-2">
                            <button
                              type="button"
                              onClick={() => void deleteSale(p)}
                              disabled={deleting}
                              className="flex-1 rounded-full bg-red-500 px-4 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                              {deleting ? "Đang xóa…" : "Xóa luôn"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              disabled={deleting}
                              className="rounded-full border border-[#EADBC6]/40 px-4 py-2 text-sm font-bold text-[#EADBC6] transition hover:border-[#FFD9A0] disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(p.id)}
                          disabled={saving || deleting}
                          className="rounded-full border border-red-400/60 px-4 py-2 text-sm font-bold text-red-300 transition hover:border-red-400 hover:bg-red-400/10 disabled:opacity-50"
                        >
                          Xóa giảm giá
                        </button>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
