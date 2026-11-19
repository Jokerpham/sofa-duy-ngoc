// Lớp truy cập database dùng chung cho mọi API route — 2 chế độ:
//
//   1. D1 (Cloudflare Pages): khi chạy trên Pages (hoặc chạy local với
//      USE_D1_DEV=1, xem next.config.mjs), binding D1 "DB" có mặt trong
//      request context thì dùng D1. Trên Cloudflare Pages, D1 luôn thắng.
//   2. MySQL (máy của Sơn): khi không có binding D1 thì dùng MySQL local
//      (database sofa_duy_ngoc) qua DATABASE_URL trong file .env, như trước.
//
// Hàm query / execute giữ nguyên tên, tham số và kiểu trả về như bản
// MySQL cũ nên 24 API route hiện tại không cần sửa gì. D1 dùng dấu `?`
// làm placeholder y như mysql2 nên câu SQL hiện tại chạy được như cũ
// (xem lưu ý về ON DUPLICATE KEY UPDATE / NOW() ở cuối file).
//
// AN TOÀN CHO EDGE RUNTIME: file này KHÔNG import tĩnh bất cứ module
// Node-only nào ở đầu file. mysql2 chỉ được nạp động (await import)
// bên trong getPool(), tức chỉ khi đang chạy ở chế độ MySQL trên Node;
// trên Pages (chế độ D1) mysql2 không bao giờ được nạp, nên bundle
// Edge Runtime không bị vỡ. `import type ... from "mysql2/promise"`
// chỉ là kiểu dữ liệu, bị xóa hết lúc biên dịch.
import { getRequestContext } from "@cloudflare/next-on-pages";
import type { Pool, ResultSetHeader } from "mysql2/promise";

// Kiểu tối thiểu cho binding D1 (chỉ các phương thức file này dùng).
// Dùng kiểu cấu trúc thay vì import D1Database để file này không phụ
// thuộc vào cách gói @cloudflare/workers-types xuất kiểu.
interface D1PreparedStatement {
  bind(...params: (string | number | null)[]): D1PreparedStatement;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { last_row_id: number | null; changes: number } }>;
}

interface D1DatabaseLike {
  prepare(sql: string): D1PreparedStatement;
}

/** Lấy binding D1 "DB" nếu đang chạy trên Pages / dev D1 local. */
function getD1(): D1DatabaseLike | null {
  // Ngoài Pages runtime và ngoài dev server có setupDevPlatform
  // (next.config.mjs, chỉ khi USE_D1_DEV=1), getRequestContext()
  // ném lỗi — bắt lại và trả về null để rơi xuống chế độ MySQL.
  try {
    const env = getRequestContext().env as unknown as { DB?: D1DatabaseLike };
    return env.DB ?? null;
  } catch {
    return null;
  }
}

/** true khi đang chạy với binding D1 (Pages / dev D1 local). */
export function isD1(): boolean {
  return getD1() !== null;
}

let pool: Pool | null = null;

/** Pool MySQL local (chỉ dùng ở chế độ MySQL). Nạp mysql2 động để không vỡ Edge Runtime. */
export async function getPool(): Promise<Pool> {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Thiếu DATABASE_URL — tạo file .env từ .env.example và điền mật khẩu MySQL local của bạn.",
    );
  }
  // Ghép tên gói lúc chạy, KHÔNG viết thẳng chuỗi "mysql2/promise"
  // trong câu import: cả webpack (next build) và esbuild
  // (next-on-pages) đều cố đóng gói import() có chuỗi tĩnh vào
  // bundle Edge, mà mysql2 dùng API Node (crypto/tls/...) nên build
  // vỡ. Dấu "/" lấy qua globalThis để bundler không tính trước
  // được chuỗi (đã thử .join("/") và gọi qua hàm — webpack đều gộp
  // lại thành chuỗi tĩnh). Câu import này chỉ chạy lúc runtime ở
  // chế độ MySQL trên Node; trên Pages (chế độ D1) nó không bao
  // giờ được gọi.
  const sep =
    (globalThis as { __slash?: string }).__slash ?? "/";
  const specifier = ["mysql2", "promise"].join(sep);
  const { default: mysql } = await import(
    /* webpackIgnore: true */ specifier
  );
  pool = mysql.createPool({ uri: url, connectionLimit: 10 }) as Pool;
  return pool;
}

/** Chạy một câu SQL có tham số, trả về các dòng kết quả. */
export async function query<T>(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<T[]> {
  const db = getD1();
  if (db) {
    const { results } = await db.prepare(sql).bind(...params).all<T>();
    return results;
  }
  const p = await getPool();
  const [rows] = await p.execute(sql, params);
  return rows as unknown as T[];
}

/** Chạy INSERT / UPDATE / DELETE, trả về kết quả (insertId, affectedRows). */
export async function execute(
  sql: string,
  params: (string | number | null)[] = [],
): Promise<ResultSetHeader> {
  const db = getD1();
  if (db) {
    const { meta } = await db.prepare(sql).bind(...params).run();
    return {
      insertId: meta?.last_row_id ?? 0,
      affectedRows: meta?.changes ?? 0,
    } as unknown as ResultSetHeader;
  }
  const p = await getPool();
  const [result] = await p.execute(sql, params);
  return result as ResultSetHeader;
}

// ---------------------------------------------------------------------------
// LƯU Ý KHI CHẠY TRÊN D1 (SQLite) — 2 chỗ trong các API route từng dùng
// cú pháp chỉ MySQL mới hiểu, đã sửa xong (dùng isD1() để chọn câu SQL):
//   - src/app/api/admin/settings/route.ts: "ON DUPLICATE KEY UPDATE" và
//     "ON UPDATE CURRENT_TIMESTAMP" trong CREATE TABLE — SQLite dùng
//     "ON CONFLICT(\"key\") DO UPDATE SET ..." thay thế.
//   - src/app/api/chat/threads/[id]/messages/route.ts: "updated_at = NOW()"
//     — đã đổi thành "updated_at = CURRENT_TIMESTAMP" (chạy cả 2 bên).
// Ngoài 2 chỗ đó, các câu SQL còn lại (SELECT / INSERT / UPDATE / DELETE
// với placeholder `?`) chạy được như nhau trên cả MySQL và D1.
// ---------------------------------------------------------------------------
