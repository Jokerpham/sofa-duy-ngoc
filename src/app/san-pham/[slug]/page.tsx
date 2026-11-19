import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PRODUCTS, slugify } from "@/lib/products";
import { query } from "@/lib/db";
import ProductDetailClient from "./ProductDetailClient";

export const runtime = "edge"; // Cloudflare Pages yêu cầu route động chạy Edge Runtime.
export const dynamic = "force-dynamic"; // Render theo từng yêu cầu để đọc D1 (binding chỉ có lúc chạy, không có lúc build tĩnh).

type DbProduct = {
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

type ShopProduct = (typeof PRODUCTS)[number];

const STYLES = ["Hiện đại", "Tân cổ điển", "Tối giản"] as const;

// Tìm mẫu theo slug — ưu tiên MySQL (quản trị đã sửa tên, thêm
// mẫu mới trong /admin/san-pham thì URL mới vẫn mở được), dự
// phòng danh sách tĩnh khi MySQL chưa nối được. Dùng cho cả
// generateMetadata và trang chi tiết.
async function findProduct(slug: string): Promise<ShopProduct | null> {
  try {
    const rows = await query<DbProduct>(
      "SELECT name, style, image, description, price, sale_price, size, material, code FROM products ORDER BY id ASC",
    );
    const mapped: ShopProduct[] = rows
      .filter(
        (r) =>
          typeof r.name === "string" &&
          r.name.trim() &&
          typeof r.image === "string" &&
          r.image.trim(),
      )
      .map((r) => ({
        name: r.name.trim(),
        slug: slugify(r.name.trim()),
        style: (STYLES as readonly string[]).includes(r.style ?? "")
          ? (r.style as (typeof STYLES)[number])
          : "Hiện đại",
        img: (r.image as string).trim(),
        desc: typeof r.description === "string" ? r.description : "",
        price:
          r.price === null || Number(r.price) <= 0 ? null : Number(r.price),
        sale_price:
          r.sale_price === null || Number(r.sale_price) <= 0
            ? null
            : Number(r.sale_price),
        size: r.size,
        material: r.material,
        code: r.code,
      }));
    const found = mapped.find((p) => p.slug === slug);
    if (found) return found;
  } catch {
    // MySQL chưa nối được (lúc build chẳng hạn) — dùng danh sách tĩnh.
  }
  return PRODUCTS.find((p) => p.slug === slug) ?? null;
}

// Trang chi tiết từng mẫu sofa: /san-pham/<slug> (vd:
// /san-pham/sofa-da-chu-l-nau-dam). 8 mẫu được tạo tĩnh sẵn lúc
// build qua generateStaticParams; mẫu đổi tên / thêm mới thì
// render theo yêu cầu (dynamicParams mặc định bật) và tra MySQL.
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const p = await findProduct(params.slug);
  if (!p) return { title: "Sản phẩm — Sofa Duy Ngọc | DN HOME Hải Phòng" };
  return {
    title: `${p.name} — Sofa Duy Ngọc | DN HOME Hải Phòng`,
    description: `${p.name} — ${p.desc} Phong cách: ${p.style}.`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await findProduct(params.slug);
  if (!product) notFound();
  return (
    <main>
      <ProductDetailClient product={product} />
    </main>
  );
}
