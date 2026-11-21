// Sản phẩm thật của xưởng Sofa Duy Ngọc — ảnh thật, bán thật.
// GIÁ THẬT cho 6 mẫu (chủ xưởng gửi ngày 2026-11-21); 2 mẫu
// ("Sofa cổ điển xám đậm", "Sofa cổ điển xanh teal") vẫn GIÁ TẠM
// THỜI (đặt ngày 2026-11-14, khoảng 12–15 triệu/mẫu). Khi có giá
// thật cho 2 mẫu còn lại thì sửa lại số trong bảng TEMP_PRICES /
// TEMP_SALE_PRICES dưới đây + chạy file
// database/mysql/set-temporary-prices.sql để đồng bộ MySQL.
// Chỉ 3 mẫu có giá giảm (-10%); 5 mẫu còn lại chỉ có giá thường.
// Dùng chung cho trang Sản phẩm và cột Sản phẩm ở footer.
export type ProductStyle = "Hiện đại" | "Tân cổ điển" | "Tối giản";

// Giá theo tên mẫu — GIÁ THẬT cho 6 mẫu (chủ xưởng gửi ngày
// 2026-11-21); 2 mẫu còn lại ("Sofa cổ điển xám đậm", "Sofa cổ
// điển xanh teal") vẫn là GIÁ TẠM THỜI (12–15 triệu/mẫu, đặt ngày
// 2026-11-14) cho tới khi có giá thật.
const TEMP_PRICES: Record<string, number> = {
  "Sofa da chữ L nâu đậm": 8500000,
  "Sofa da chữ L nâu chần trám": 9000000,
  "Sofa vải xanh dương chữ L": 8500000,
  "Sofa vải trắng kem chữ L": 5600000,
  "Sofa cổ điển xanh nhạt": 2200000,
  "Sofa cổ điển xám đậm": 13500000,
  "Sofa cổ điển xanh teal": 14000000,
  "Sofa cổ điển xám nhạt kèm đôn": 2500000,
};

// Giá giảm (-10% so với giá gốc) — chỉ 3 mẫu này có giảm.
const TEMP_SALE_PRICES: Record<string, number> = {
  "Sofa da chữ L nâu đậm": 7650000,
  "Sofa vải xanh dương chữ L": 7650000,
  "Sofa cổ điển xanh teal": 12600000,
};

// Tạo slug thân thiện với URL từ tên mẫu
// ("Sofa da chữ L nâu đậm" → "sofa-da-chu-l-nau-dam") — dùng cho
// trang chi tiết /san-pham/<slug> và khi sản phẩm từ MySQL chưa có slug.
export function slugify(name: string): string {
  return name
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const PRODUCTS: {
  name: string;
  slug: string;
  style: ProductStyle;
  img: string;
  desc: string;
  price: number | null;
  sale_price: number | null;
  size: string | null;
  material: string | null;
  code: string | null;
}[] = [
  {
    name: "Sofa da chữ L nâu đậm",
    slug: "sofa-da-chu-l-nau-dam",
    style: "Hiện đại",
    img: "/images/sofa/sofa-da-chu-l-nau-dam.jpg",
    desc: "Da nâu đậm, dáng chữ L, lưng tựa nút bấm, chân gỗ — sang trọng, dễ lau chùi.",
    price: TEMP_PRICES["Sofa da chữ L nâu đậm"] ?? null,
    sale_price: TEMP_SALE_PRICES["Sofa da chữ L nâu đậm"] ?? null,
    size: null,
    material: null,
    code: null,
  },
  {
    name: "Sofa da chữ L nâu chần trám",
    slug: "sofa-da-chu-l-nau-chan-tram",
    style: "Hiện đại",
    img: "/images/sofa/sofa-da-chu-l-nau-chan-tram.jpg",
    desc: "Da nâu, dáng chữ L, tựa lưng chần trám, đệm ngồi dày dặn.",
    price: TEMP_PRICES["Sofa da chữ L nâu chần trám"] ?? null,
    sale_price: TEMP_SALE_PRICES["Sofa da chữ L nâu chần trám"] ?? null,
    size: null,
    material: null,
    code: null,
  },
  {
    name: "Sofa vải xanh dương chữ L",
    slug: "sofa-vai-xanh-duong-chu-l",
    style: "Tối giản",
    img: "/images/sofa/sofa-vai-xanh-duong-chu-l.jpg",
    desc: "Vải xanh dương, dáng chữ L rộng rãi, đệm êm, hợp phòng khách hiện đại.",
    price: TEMP_PRICES["Sofa vải xanh dương chữ L"] ?? null,
    sale_price: TEMP_SALE_PRICES["Sofa vải xanh dương chữ L"] ?? null,
    size: null,
    material: null,
    code: null,
  },
  {
    name: "Sofa vải trắng kem chữ L",
    slug: "sofa-vai-trang-kem-chu-l",
    style: "Tối giản",
    img: "/images/sofa/sofa-vai-trang-kem-chu-l.jpg",
    desc: "Vải trắng kem, dáng chữ L, tông sáng, tạo cảm giác rộng và thoáng.",
    price: TEMP_PRICES["Sofa vải trắng kem chữ L"] ?? null,
    sale_price: TEMP_SALE_PRICES["Sofa vải trắng kem chữ L"] ?? null,
    size: null,
    material: null,
    code: null,
  },
  {
    name: "Sofa cổ điển xanh nhạt",
    slug: "sofa-co-dien-xanh-nhat",
    style: "Tân cổ điển",
    img: "/images/sofa/sofa-co-dien-xanh-nhat.jpg",
    desc: "Vải xanh nhạt, lưng tựa nút bấm cổ điển, tay vịn thanh lịch.",
    price: TEMP_PRICES["Sofa cổ điển xanh nhạt"] ?? null,
    sale_price: TEMP_SALE_PRICES["Sofa cổ điển xanh nhạt"] ?? null,
    size: null,
    material: null,
    code: null,
  },
  {
    name: "Sofa cổ điển xám đậm",
    slug: "sofa-co-dien-xam-dam",
    style: "Tân cổ điển",
    img: "/images/sofa/sofa-co-dien-xam-dam.jpg",
    desc: "Vải xám đậm, lưng tựa nút bấm cổ điển, dáng gọn, dễ phối nội thất.",
    price: TEMP_PRICES["Sofa cổ điển xám đậm"] ?? null,
    sale_price: TEMP_SALE_PRICES["Sofa cổ điển xám đậm"] ?? null,
    size: null,
    material: null,
    code: null,
  },
  {
    name: "Sofa cổ điển xanh teal",
    slug: "sofa-co-dien-xanh-teal",
    style: "Tân cổ điển",
    img: "/images/sofa/sofa-co-dien-xanh-teal.jpg",
    desc: "Vải xanh teal, lưng tựa nút bấm cổ điển, điểm nhấn nổi bật cho phòng khách.",
    price: TEMP_PRICES["Sofa cổ điển xanh teal"] ?? null,
    sale_price: TEMP_SALE_PRICES["Sofa cổ điển xanh teal"] ?? null,
    size: null,
    material: null,
    code: null,
  },
  {
    name: "Sofa cổ điển xám nhạt kèm đôn",
    slug: "sofa-co-dien-xam-nhat-kem-don",
    style: "Tân cổ điển",
    img: "/images/sofa/sofa-co-dien-xam-nhat-kem-don.jpg",
    desc: "Vải xám nhạt, lưng tựa nút bấm cổ điển, kèm 2 đôn tiện lợi.",
    price: TEMP_PRICES["Sofa cổ điển xám nhạt kèm đôn"] ?? null,
    sale_price: TEMP_SALE_PRICES["Sofa cổ điển xám nhạt kèm đôn"] ?? null,
    size: null,
    material: null,
    code: null,
  },
];

// Hiển thị giá kiểu MONA: 15000000 → "15.000.000₫".
export function formatPrice(vnd: number): string {
  return `${vnd.toLocaleString("vi-VN")}₫`;
}

const STYLES: ProductStyle[] = ["Hiện đại", "Tân cổ điển", "Tối giản"];

type ApiProduct = {
  name?: unknown;
  style?: unknown;
  img?: unknown;
  desc?: unknown;
  price?: unknown;
  sale_price?: unknown;
  size?: unknown;
  material?: unknown;
  code?: unknown;
};

// Lấy danh sách sản phẩm từ API MySQL (/api/products). Lỗi gì cũng
// trả về danh sách dự phòng PRODUCTS ở trên — không bao giờ ném lỗi.
// Giá lấy từ cột price / sale_price của MySQL; nếu API chưa có giá
// (null) thì dùng giá tạm theo tên mẫu để thẻ vẫn hiện giá.
export async function fetchProducts(): Promise<typeof PRODUCTS> {
  try {
    const res = await fetch("/api/products");
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      products?: ApiProduct[];
    };
    if (!data.ok || !Array.isArray(data.products)) return PRODUCTS;
    const mapped = data.products
      .filter(
        (p) => typeof p.name === "string" && p.name.trim() && typeof p.img === "string" && p.img.trim(),
      )
      .map((p) => {
        const name = (p.name as string).trim();
        const apiPrice =
          typeof p.price === "number" && Number.isFinite(p.price) && p.price > 0
            ? p.price
            : null;
        const apiSale =
          typeof p.sale_price === "number" &&
          Number.isFinite(p.sale_price) &&
          p.sale_price > 0
            ? p.sale_price
            : null;
        return {
          name,
          slug: slugify(name),
          style: (STYLES as string[]).includes(p.style as string)
            ? (p.style as ProductStyle)
            : "Hiện đại",
          img: (p.img as string).trim(),
          desc: typeof p.desc === "string" ? p.desc : "",
          // Ưu tiên giá MySQL; chưa có thì dùng giá tạm theo tên mẫu.
          price: apiPrice ?? TEMP_PRICES[name] ?? null,
          // Giá giảm: giá trị MySQL thắng tuyệt đối — kể cả khi MySQL
          // là NULL (quản trị đã tắt giảm giá ở /admin/giam-gia) thì
          // shop cũng không hiện giảm giá, KHÔNG dùng lại giá giảm
          // tạm. Chỉ khi API lỗi hẳn (trả về danh sách PRODUCTS tĩnh)
          // thì 3 mẫu tạm mới hiện giảm giá.
          sale_price: apiSale,
          // Kích thước / chất liệu / mã do quản trị điền trong
          // /admin/san-pham; trống thì trang chi tiết hiện
          // "Đang cập nhật".
          size: typeof p.size === "string" && p.size.trim() ? p.size.trim() : null,
          material:
            typeof p.material === "string" && p.material.trim()
              ? p.material.trim()
              : null,
          code: typeof p.code === "string" && p.code.trim() ? p.code.trim() : null,
        };
      });
    return mapped.length > 0 ? mapped : PRODUCTS;
  } catch {
    return PRODUCTS;
  }
}
