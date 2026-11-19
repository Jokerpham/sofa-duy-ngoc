"use client";

import { useEffect, useState } from "react";
import AdminNav from "../AdminNav";
import { getSession, type AdminUser } from "@/lib/admin-auth";
import { formatPrice } from "@/lib/products";

const STYLES = ["Hiện đại", "Tân cổ điển", "Tối giản"] as const;

type AdminProduct = {
  id: number;
  name: string;
  style: string | null;
  img: string | null;
  desc: string | null;
  price: number | null;
  sale_price: number | null;
  size: string | null;
  material: string | null;
  code: string | null;
};

type ProductForm = {
  name: string;
  style: string;
  img: string;
  desc: string;
  price: string;
  sale: string;
  size: string;
  material: string;
  code: string;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  style: "Hiện đại",
  img: "",
  desc: "",
  price: "",
  sale: "",
  size: "",
  material: "",
  code: "",
};

function formFromProduct(p: AdminProduct): ProductForm {
  return {
    name: p.name,
    style: p.style ?? "Hiện đại",
    img: p.img ?? "",
    desc: p.desc ?? "",
    price: p.price === null ? "" : String(p.price),
    sale: p.sale_price === null ? "" : String(p.sale_price),
    size: p.size ?? "",
    material: p.material ?? "",
    code: p.code ?? "",
  };
}

// Đọc file ảnh -> data URL, thu nhỏ còn tối đa 800px để lưu vào
// MySQL (cột image TEXT) không bị quá nặng.
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 800;
        let width = img.width;
        let height = img.height;
        if (width > max || height > max) {
          const scale = Math.min(max / width, max / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Không đọc được ảnh này."));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Không đọc được file."));
    reader.readAsDataURL(file);
  });
}

const INPUT_CLASS =
  "mt-1 w-full rounded-xl border border-[#EADBC6]/30 bg-white/10 px-3 py-2 text-sm text-[#EADBC6] outline-none focus:border-[#FFD9A0]";
const LABEL_CLASS = "text-xs font-bold text-[#EADBC6]/70";

// Các ô nhập của form sản phẩm — dùng chung cho form "Sửa" và
// form "Thêm sản phẩm mới".
function ProductFormFields({
  form,
  setForm,
  disabled,
  onImageError,
}: {
  form: ProductForm;
  setForm: (patch: Partial<ProductForm>) => void;
  disabled: boolean;
  onImageError: (msg: string) => void;
}) {
  async function handleImageFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      onImageError("Vui lòng chọn file ảnh.");
      return;
    }
    try {
      const dataUrl = await fileToDataUrl(file);
      setForm({ img: dataUrl });
    } catch {
      onImageError("Không đọc được ảnh này. Hãy thử ảnh khác.");
    }
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className={LABEL_CLASS}>
        Tên sản phẩm *
        <input
          type="text"
          value={form.name}
          disabled={disabled}
          onChange={(e) => setForm({ name: e.target.value })}
          placeholder="Ví dụ: Sofa da chữ L nâu đậm"
          className={INPUT_CLASS}
        />
      </label>
      <label className={LABEL_CLASS}>
        Kiểu dáng
        <select
          value={form.style}
          disabled={disabled}
          onChange={(e) => setForm({ style: e.target.value })}
          className={`${INPUT_CLASS} bg-[#241208]`}
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-2">
        <p className={LABEL_CLASS}>Ảnh sản phẩm *</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          {form.img ? (
            <img
              src={form.img}
              alt="Ảnh sản phẩm"
              className="h-20 w-28 rounded-xl object-cover"
            />
          ) : (
            <span className="flex h-20 w-28 items-center justify-center rounded-xl border border-dashed border-[#EADBC6]/40 text-center text-xs text-[#EADBC6]/60">
              Chưa có ảnh
            </span>
          )}
          <label className="cursor-pointer rounded-full bg-[#FFD9A0] px-4 py-2 text-sm font-bold text-[#241208] transition hover:opacity-90">
            📷 Chọn ảnh từ máy
            <input
              type="file"
              accept="image/*"
              disabled={disabled}
              className="hidden"
              onChange={(e) => void handleImageFile(e.target.files?.[0])}
            />
          </label>
        </div>
        <input
          type="text"
          value={form.img.startsWith("data:") ? "" : form.img}
          disabled={disabled}
          onChange={(e) => setForm({ img: e.target.value })}
          placeholder="Hoặc dán link ảnh (https://…) — để trống nếu đã chọn ảnh"
          className={`${INPUT_CLASS} mt-2`}
        />
      </div>

      <label className={`${LABEL_CLASS} sm:col-span-2`}>
        Mô tả
        <textarea
          rows={3}
          value={form.desc}
          disabled={disabled}
          onChange={(e) => setForm({ desc: e.target.value })}
          placeholder="Mô tả ngắn về mẫu sofa này…"
          className={`${INPUT_CLASS} resize-y`}
        />
      </label>

      <label className={LABEL_CLASS}>
        Kích thước
        <input
          type="text"
          value={form.size}
          disabled={disabled}
          onChange={(e) => setForm({ size: e.target.value })}
          placeholder="Ví dụ: 2,4m × 0,9m × 0,85m"
          className={INPUT_CLASS}
        />
      </label>
      <label className={LABEL_CLASS}>
        Chất liệu
        <input
          type="text"
          value={form.material}
          disabled={disabled}
          onChange={(e) => setForm({ material: e.target.value })}
          placeholder="Ví dụ: Da bò thật, khung gỗ sồi"
          className={INPUT_CLASS}
        />
      </label>
      <label className={LABEL_CLASS}>
        Mã sản phẩm
        <input
          type="text"
          value={form.code}
          disabled={disabled}
          onChange={(e) => setForm({ code: e.target.value })}
          placeholder="Ví dụ: DN-SF-001"
          className={INPUT_CLASS}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={LABEL_CLASS}>
          Giá gốc (VND)
          <input
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            value={form.price}
            disabled={disabled}
            onChange={(e) => setForm({ price: e.target.value })}
            placeholder="Ví dụ: 15000000"
            className={INPUT_CLASS}
          />
        </label>
        <label className={LABEL_CLASS}>
          Giá giảm (VND) — trống = không giảm
          <input
            type="number"
            min={0}
            step={1000}
            inputMode="numeric"
            value={form.sale}
            disabled={disabled}
            onChange={(e) => setForm({ sale: e.target.value })}
            placeholder="Ví dụ: 13500000"
            className={INPUT_CLASS}
          />
        </label>
      </div>
    </div>
  );
}

// Trang /admin/san-pham: quản trị chỉnh sửa TÙY Ý từng mẫu sofa
// (tên, kiểu dáng, ảnh, mô tả, kích thước, chất liệu, mã, giá gốc,
// giá giảm), thêm mẫu mới và xóa mẫu. Lưu vào MySQL (bảng products)
// và hiện ngay trên trang shop.
export default function ProductsClient() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<ProductForm>(EMPTY_FORM);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<ProductForm>(EMPTY_FORM);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

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
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setLoading(false);
    }
  }

  // Kiểm tra chung cho form sửa và form thêm: tên + ảnh bắt buộc
  // (shop chỉ hiện mẫu có ảnh), giá >= 0, giá giảm < giá gốc.
  function validateForm(form: ProductForm): string | null {
    if (form.name.trim() === "") return "Tên sản phẩm không được để trống.";
    if (form.img.trim() === "")
      return "Ảnh sản phẩm không được để trống — hãy chọn ảnh từ máy hoặc dán link ảnh.";
    const price = form.price.trim() === "" ? null : Number(form.price);
    const sale = form.sale.trim() === "" ? null : Number(form.sale);
    if (price !== null && (!Number.isFinite(price) || price < 0))
      return "Giá gốc phải là số tiền VND (>= 0) hoặc để trống.";
    if (sale !== null && (!Number.isFinite(sale) || sale < 0))
      return "Giá giảm phải là số tiền VND (>= 0) hoặc để trống.";
    if (price !== null && sale !== null && sale >= price)
      return "Giá giảm phải nhỏ hơn giá gốc.";
    if (sale !== null && price === null)
      return "Muốn có giá giảm thì phải nhập giá gốc trước.";
    return null;
  }

  function formBody(form: ProductForm) {
    return {
      name: form.name.trim(),
      style: form.style,
      image: form.img.trim(),
      description: form.desc.trim(),
      price: form.price.trim() === "" ? null : Number(form.price),
      sale_price: form.sale.trim() === "" ? null : Number(form.sale),
      size: form.size.trim(),
      material: form.material.trim(),
      code: form.code.trim(),
    };
  }

  function startEdit(p: AdminProduct) {
    setEditingId(p.id);
    setEditForm(formFromProduct(p));
    setShowAdd(false);
    setDeletingId(null);
    setNotice("");
    setError("");
  }

  async function saveEdit(p: AdminProduct) {
    if (!user) return;
    const problem = validateForm(editForm);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, ...formBody(editForm) }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Lưu thất bại. Hãy thử lại.");
        return;
      }
      setEditingId(null);
      setNotice(`Đã lưu thay đổi cho "${editForm.name.trim()}".`);
      await loadProducts(user.email);
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAdd() {
    if (!user) return;
    const problem = validateForm(addForm);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, ...formBody(addForm) }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Thêm sản phẩm thất bại. Hãy thử lại.");
        return;
      }
      setShowAdd(false);
      setAddForm(EMPTY_FORM);
      setNotice(`Đã thêm sản phẩm mới "${addForm.name.trim()}".`);
      await loadProducts(user.email);
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(p: AdminProduct) {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!data.ok) {
        setError(data.error ?? "Xóa thất bại. Hãy thử lại.");
        return;
      }
      setDeletingId(null);
      setEditingId(null);
      setNotice(`Đã xóa sản phẩm "${p.name}".`);
      await loadProducts(user.email);
    } catch {
      setError("Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.");
    } finally {
      setSaving(false);
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
              Hãy đăng nhập tài khoản quản trị để chỉnh sửa sản phẩm.
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

  return (
    <main className="bg-[#241208] py-14 md:pl-[232px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mt-2 text-3xl font-black text-[#EADBC6] sm:text-4xl">
          Sản phẩm &amp; Giá
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#EADBC6]/70">
          Chỉnh sửa tùy ý từng mẫu sofa: tên, kiểu dáng, ảnh, mô tả,
          kích thước, chất liệu, mã sản phẩm, giá gốc và giá giảm. Thêm
          mẫu mới hoặc xóa mẫu — lưu vào MySQL và hiện ngay trên trang
          shop.
        </p>
        <AdminNav active="san-pham" />

        <div className="mt-6">
          {!showAdd ? (
            <button
              type="button"
              onClick={() => {
                setShowAdd(true);
                setAddForm(EMPTY_FORM);
                setEditingId(null);
                setDeletingId(null);
                setNotice("");
                setError("");
              }}
              className="rounded-full bg-[#FFD9A0] px-6 py-3 text-sm font-bold text-[#241208] transition hover:opacity-90"
            >
              + Thêm sản phẩm mới
            </button>
          ) : (
            <div className="rounded-2xl border border-[#FFD9A0]/50 bg-white/5 p-4 sm:p-5">
              <h2 className="text-xl font-bold text-[#EADBC6]">
                Thêm sản phẩm mới
              </h2>
              <div className="mt-4">
                <ProductFormFields
                  form={addForm}
                  setForm={(patch) =>
                    setAddForm((f) => ({ ...f, ...patch }))
                  }
                  disabled={saving}
                  onImageError={setError}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void saveAdd()}
                  disabled={saving}
                  className="rounded-full bg-[#FFD9A0] px-6 py-2.5 text-sm font-bold text-[#241208] transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Đang lưu…" : "Thêm sản phẩm"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAdd(false);
                    setAddForm(EMPTY_FORM);
                  }}
                  disabled={saving}
                  className="rounded-full border border-[#EADBC6]/40 px-6 py-2.5 text-sm font-bold text-[#EADBC6] transition hover:border-[#FFD9A0] disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          )}
        </div>

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
            Chưa có sản phẩm nào trong cơ sở dữ liệu — bấm &ldquo;Thêm sản
            phẩm mới&rdquo; ở trên để thêm mẫu đầu tiên.
          </p>
        ) : (
          <div className="mt-8 space-y-4">
            {products.map((p) => {
              const editing = editingId === p.id;
              const confirmingDelete = deletingId === p.id;
              const discount =
                p.price !== null &&
                p.sale_price !== null &&
                p.price > 0
                  ? Math.round((1 - p.sale_price / p.price) * 100)
                  : null;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    {p.img && (
                      <img
                        src={p.img}
                        alt={p.name}
                        className="h-20 w-28 shrink-0 rounded-xl object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-[#EADBC6]">
                        {p.name}
                      </p>
                      <p className="text-sm text-[#EADBC6]/60">
                        Phong cách: {p.style ?? "—"}
                        {p.code ? ` • Mã: ${p.code}` : ""}
                      </p>
                      {p.size || p.material ? (
                        <p className="text-sm text-[#EADBC6]/60">
                          {p.size ? `Kích thước: ${p.size}` : ""}
                          {p.size && p.material ? " • " : ""}
                          {p.material ? `Chất liệu: ${p.material}` : ""}
                        </p>
                      ) : null}
                      {!editing && (
                        <p className="mt-1.5 text-base">
                          {p.sale_price !== null ? (
                            <>
                              <span className="font-black text-[#FFD9A0]">
                                {formatPrice(p.sale_price)}
                              </span>{" "}
                              <span className="text-sm text-[#EADBC6]/60 line-through">
                                {p.price !== null
                                  ? formatPrice(p.price)
                                  : ""}
                              </span>{" "}
                              {discount !== null && (
                                <span className="ml-1 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                                  -{discount}%
                                </span>
                              )}
                            </>
                          ) : p.price !== null ? (
                            <span className="font-black text-[#FFD9A0]">
                              {formatPrice(p.price)}
                            </span>
                          ) : (
                            <span className="text-sm text-[#EADBC6]/60">
                              Chưa có giá — liên hệ báo giá
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    {!editing && (
                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          className="rounded-full bg-[#FFD9A0] px-5 py-2.5 text-sm font-bold text-[#241208] transition hover:opacity-90"
                        >
                          Sửa
                        </button>
                        {confirmingDelete ? (
                          <>
                            <button
                              type="button"
                              onClick={() => void deleteProduct(p)}
                              disabled={saving}
                              className="rounded-full bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50"
                            >
                              {saving ? "Đang xóa…" : "Xóa luôn"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              disabled={saving}
                              className="rounded-full border border-[#EADBC6]/40 px-4 py-2.5 text-sm font-bold text-[#EADBC6] transition hover:border-[#FFD9A0] disabled:opacity-50"
                            >
                              Hủy
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingId(p.id);
                              setNotice("");
                              setError("");
                            }}
                            className="rounded-full border border-red-400/60 px-4 py-2.5 text-sm font-bold text-red-300 transition hover:bg-red-500/10"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {confirmingDelete && !editing && (
                    <p className="mt-3 rounded-xl border border-red-400/50 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300">
                      Chắc chắn xóa &ldquo;{p.name}&rdquo; khỏi shop? Mẫu
                      này sẽ biến mất khỏi trang shop ngay sau khi xóa.
                    </p>
                  )}

                  {editing && (
                    <div className="mt-4 border-t border-[#EADBC6]/10 pt-4">
                      <ProductFormFields
                        form={editForm}
                        setForm={(patch) =>
                          setEditForm((f) => ({ ...f, ...patch }))
                        }
                        disabled={saving}
                        onImageError={setError}
                      />
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void saveEdit(p)}
                          disabled={saving}
                          className="rounded-full bg-[#FFD9A0] px-6 py-2.5 text-sm font-bold text-[#241208] transition hover:opacity-90 disabled:opacity-50"
                        >
                          {saving ? "Đang lưu…" : "Lưu sản phẩm"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={saving}
                          className="rounded-full border border-[#EADBC6]/40 px-6 py-2.5 text-sm font-bold text-[#EADBC6] transition hover:border-[#FFD9A0] disabled:opacity-50"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
