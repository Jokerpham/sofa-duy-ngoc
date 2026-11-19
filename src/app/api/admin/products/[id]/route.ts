import { NextResponse } from "next/server";
import { execute, query } from "@/lib/db";
import { isAdminEmail } from "@/lib/admin-api";
import {
  cleanStyle,
  cleanText,
  parsePrice,
} from "@/lib/admin-products";

export const dynamic = "force-dynamic";
export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.

const DB_ERROR =
  "Lỗi kết nối cơ sở dữ liệu. Hãy kiểm tra MySQL và file .env.";

type ProductRow = {
  id: number;
  name: string;
  price: string | number | null;
  sale_price: string | number | null;
};

type PatchBody = {
  email?: string;
  name?: unknown;
  style?: unknown;
  image?: unknown;
  description?: unknown;
  price?: unknown;
  sale_price?: unknown;
  size?: unknown;
  material?: unknown;
  code?: unknown;
};

function badId() {
  return NextResponse.json(
    { ok: false, error: "Sản phẩm không hợp lệ." },
    { status: 400 },
  );
}

function parseId(params: { id: string }): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function readBody(req: Request): Promise<PatchBody | null> {
  try {
    return (await req.json()) as PatchBody;
  } catch {
    return null;
  }
}

// PATCH /api/admin/products/[id] — quản trị sửa một sản phẩm.
// Chỉ cập nhật các trường có trong body; trường không gửi thì giữ
// nguyên. Body: { email, name, style, image, description, price,
// sale_price, size, material, code }.
// - name (nếu gửi): không được để trống.
// - price: số VND >= 0 hoặc null (null = chưa có giá).
// - sale_price: số VND >= 0 hoặc null (null = không giảm giá);
//   giá giảm (nếu có) phải nhỏ hơn giá gốc hiệu dụng (giá gửi lên,
//   hoặc giá đang lưu nếu không gửi giá gốc).
// Trang Giảm giá chỉ gửi { email, price, sale_price } nên vẫn chạy
// y như trước.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const id = parseId(params);
  if (id === null) return badId();

  const body = await readBody(req);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  if (!(await isAdminEmail(body.email ?? ""))) {
    return NextResponse.json(
      { ok: false, error: "Bạn chưa đăng nhập quản trị." },
      { status: 401 },
    );
  }

  // Đọc giá đang lưu để kiểm tra giá giảm khi chỉ gửi giá giảm.
  let current: ProductRow | null = null;
  try {
    const rows = await query<ProductRow>(
      "SELECT id, name, price, sale_price FROM products WHERE id = ?",
      [id],
    );
    current = rows[0] ?? null;
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
  if (!current) {
    return NextResponse.json(
      { ok: false, error: "Không tìm thấy sản phẩm." },
      { status: 404 },
    );
  }

  const sets: string[] = [];
  const values: (string | number | null)[] = [];
  const has = (k: keyof PatchBody) =>
    body[k] !== undefined;

  if (has("name")) {
    const name = cleanText(body.name);
    if (!name) {
      return NextResponse.json(
        { ok: false, error: "Tên sản phẩm không được để trống." },
        { status: 400 },
      );
    }
    sets.push("name = ?");
    values.push(name);
  }
  if (has("style")) {
    const style = cleanStyle(body.style);
    if (body.style !== null && body.style !== "" && !style) {
      return NextResponse.json(
        { ok: false, error: "Kiểu dáng phải là Hiện đại, Tân cổ điển hoặc Tối giản." },
        { status: 400 },
      );
    }
    sets.push("style = ?");
    values.push(style);
  }
  if (has("image")) {
    sets.push("image = ?");
    values.push(cleanText(body.image));
  }
  if (has("description")) {
    sets.push("description = ?");
    values.push(cleanText(body.description));
  }
  if (has("size")) {
    sets.push("size = ?");
    values.push(cleanText(body.size));
  }
  if (has("material")) {
    sets.push("material = ?");
    values.push(cleanText(body.material));
  }
  if (has("code")) {
    sets.push("code = ?");
    values.push(cleanText(body.code));
  }

  // Giá: chỉ kiểm tra và cập nhật khi được gửi lên.
  const currentPrice =
    current.price === null ? null : Number(current.price);
  const currentSale =
    current.sale_price === null ? null : Number(current.sale_price);
  let effPrice = currentPrice;
  let effSale = currentSale;
  if (has("price")) {
    const price = parsePrice(body.price);
    if (price === undefined) {
      return NextResponse.json(
        { ok: false, error: "Giá phải là số tiền VND (>= 0) hoặc để trống." },
        { status: 400 },
      );
    }
    effPrice = price;
    sets.push("price = ?");
    values.push(price);
  }
  if (has("sale_price")) {
    const salePrice = parsePrice(body.sale_price);
    if (salePrice === undefined) {
      return NextResponse.json(
        { ok: false, error: "Giá phải là số tiền VND (>= 0) hoặc để trống." },
        { status: 400 },
      );
    }
    effSale = salePrice;
    sets.push("sale_price = ?");
    values.push(salePrice);
  }
  if (effSale !== null && (effPrice === null || effSale >= effPrice)) {
    return NextResponse.json(
      { ok: false, error: "Giá giảm phải nhỏ hơn giá gốc." },
      { status: 400 },
    );
  }

  if (sets.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Không có gì để lưu." },
      { status: 400 },
    );
  }

  try {
    const result = await execute(
      `UPDATE products SET ${sets.join(", ")} WHERE id = ?`,
      [...values, id],
    );
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy sản phẩm." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}

// DELETE /api/admin/products/[id] — quản trị xóa một sản phẩm
// khỏi shop. Body: { email }.
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  const id = parseId(params);
  if (id === null) return badId();

  const body = await readBody(req);
  if (!body) {
    return NextResponse.json(
      { ok: false, error: "Dữ liệu gửi lên không hợp lệ." },
      { status: 400 },
    );
  }

  if (!(await isAdminEmail(body.email ?? ""))) {
    return NextResponse.json(
      { ok: false, error: "Bạn chưa đăng nhập quản trị." },
      { status: 401 },
    );
  }

  try {
    const result = await execute("DELETE FROM products WHERE id = ?", [id]);
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy sản phẩm." },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
