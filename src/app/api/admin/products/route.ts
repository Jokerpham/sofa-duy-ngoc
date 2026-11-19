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
  style: string | null;
  image: string | null;
  description: string | null;
  price: string | number | null;
  sale_price: string | number | null;
  size: string | null;
  material: string | null;
  code: string | null;
};

function toNumber(v: string | number | null): number | null {
  return v === null ? null : Number(v);
}

// GET /api/admin/products?email=... — danh sách sản phẩm cho trang
// quản trị /admin/san-pham (kèm giá gốc + giá giảm + kích thước /
// chất liệu / mã từ MySQL).
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get("email") ?? "";
  if (!(await isAdminEmail(email))) {
    return NextResponse.json(
      { ok: false, error: "Bạn chưa đăng nhập quản trị." },
      { status: 401 },
    );
  }
  try {
    const rows = await query<ProductRow>(
      "SELECT id, name, style, image, description, price, sale_price, size, material, code FROM products ORDER BY id ASC",
    );
    return NextResponse.json({
      ok: true,
      products: rows.map((r) => ({
        id: r.id,
        name: r.name,
        style: r.style,
        img: r.image,
        desc: r.description,
        price: toNumber(r.price),
        sale_price: toNumber(r.sale_price),
        size: r.size,
        material: r.material,
        code: r.code,
      })),
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}

// POST /api/admin/products — quản trị thêm sản phẩm mới từ trang
// /admin/san-pham. Body: { email, name, style, image, description,
// price, sale_price, size, material, code }. Tên bắt buộc; giá gốc
// >= 0 hoặc để trống; giá giảm (nếu có) phải nhỏ hơn giá gốc.
// Slug của mẫu mới tự sinh từ tên (hàm slugify ở lib/products).
export async function POST(req: Request) {
  let body: {
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
  try {
    body = (await req.json()) as typeof body;
  } catch {
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

  const name = cleanText(body.name);
  if (!name) {
    return NextResponse.json(
      { ok: false, error: "Tên sản phẩm không được để trống." },
      { status: 400 },
    );
  }
  const style = cleanStyle(body.style);
  if (body.style !== undefined && body.style !== null && body.style !== "" && !style) {
    return NextResponse.json(
      { ok: false, error: "Kiểu dáng phải là Hiện đại, Tân cổ điển hoặc Tối giản." },
      { status: 400 },
    );
  }
  const price = parsePrice(body.price);
  const salePrice = parsePrice(body.sale_price);
  if (price === undefined || salePrice === undefined) {
    return NextResponse.json(
      { ok: false, error: "Giá phải là số tiền VND (>= 0) hoặc để trống." },
      { status: 400 },
    );
  }
  if (salePrice !== null && (price === null || salePrice >= price)) {
    return NextResponse.json(
      { ok: false, error: "Giá giảm phải nhỏ hơn giá gốc." },
      { status: 400 },
    );
  }

  try {
    const result = await execute(
      "INSERT INTO products (name, style, image, description, price, sale_price, size, material, code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        name,
        style,
        cleanText(body.image),
        cleanText(body.description),
        price,
        salePrice,
        cleanText(body.size),
        cleanText(body.material),
        cleanText(body.code),
      ],
    );
    return NextResponse.json({ ok: true, id: result.insertId });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
