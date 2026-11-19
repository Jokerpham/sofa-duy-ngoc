import { NextResponse } from "next/server";
import { query } from "@/lib/db";

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

export async function GET() {
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
        price: r.price === null ? null : Number(r.price),
        sale_price: r.sale_price === null ? null : Number(r.sale_price),
        size: r.size,
        material: r.material,
        code: r.code,
      })),
    });
  } catch {
    return NextResponse.json({ ok: false, error: DB_ERROR }, { status: 500 });
  }
}
