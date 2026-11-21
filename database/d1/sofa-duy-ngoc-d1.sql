-- ============================================================
-- Sofa Duy Ngọc — Cơ sở dữ liệu D1 (Cloudflare)
-- Bản SQLite của database/mysql/schema.sql — cùng tên bảng, cùng
-- tên cột, cùng dữ liệu mẫu — để chạy trên Cloudflare D1 cho web
-- chạy trên Cloudflare Pages (xem wrangler.toml).
--
-- CÁCH CHẠY (sau khi đã tạo database D1 tên "sofa-duy-ngoc" trong
-- Cloudflare dashboard và dán database ID vào wrangler.toml):
--   Cách 1 (khuyên dùng): mở Cloudflare dashboard > Workers & Pages
--   > D1 SQL Database > sofa-duy-ngoc > Console, dán toàn bộ file
--   này vào rồi bấm Execute.
--   Cách 2: wrangler d1 execute sofa-duy-ngoc --file=database/d1/sofa-duy-ngoc-d1.sql
--
-- CHẠY LẠI AN TOÀN: mọi lệnh tạo bảng dùng IF NOT EXISTS, mọi lệnh
-- nạp dữ liệu dùng INSERT OR IGNORE (theo id / khóa chính), nên
-- chạy lại file này không ghi đè dữ liệu quản trị đã sửa (giá,
-- số điện thoại, mật khẩu...) và không báo lỗi trùng khóa.
--
-- KHÁC BIỆT SO VỚI BẢN MySQL (do SQLite không có các tính năng này):
--   - INTEGER PRIMARY KEY AUTOINCREMENT thay cho INT AUTO_INCREMENT.
--   - TEXT thay cho VARCHAR(...); price / sale_price là INTEGER
--     (đồng VNĐ, không có số lẻ) thay cho DECIMAL(12,0).
--   - Cờ is_new / is_sale / unread_admin / unread_customer là
--     INTEGER 0/1 thay cho TINYINT(1).
--   - sender_type là TEXT kèm CHECK (sender_type IN
--     ('customer','admin')) thay cho ENUM.
--   - KHÔNG có ON UPDATE CURRENT_TIMESTAMP — thay bằng trigger
--     AFTER UPDATE ở cuối file, tự cập nhật updated_at
--     (products, customers, admins, chat_threads, quote_requests).
--   - created_at / updated_at mặc định CURRENT_TIMESTAMP (giờ UTC,
--     dạng 'YYYY-MM-DD HH:MM:SS').
--   - Khóa ngoại chat_messages.thread_id -> chat_threads(id)
--     ON DELETE CASCADE (bật bằng PRAGMA foreign_keys = ON).
-- ============================================================

PRAGMA foreign_keys = ON;

-- -------------------------
-- categories: nhóm phong cách sofa (bộ lọc ở trang Sản phẩm)
-- -------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------
-- products: 8 mẫu sofa đang bán
-- size / material / code: kích thước, chất liệu, mã sản phẩm —
-- quản trị điền trong trang /admin/san-pham; trống thì trang chi
-- tiết vẫn hiện "Đang cập nhật". image là TEXT để lưu được ảnh
-- tải lên từ trang quản trị (data URL dài hơn VARCHAR(255)).
-- -------------------------
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  style TEXT,
  image TEXT,
  description TEXT,
  price INTEGER NULL,
  sale_price INTEGER NULL,
  size TEXT NULL,
  material TEXT NULL,
  code TEXT NULL,
  is_new INTEGER DEFAULT 0,
  is_sale INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------
-- customers: tài khoản khách hàng đăng ký trên web
-- (mật khẩu lưu dạng băm, không lưu mật khẩu gốc)
-- -------------------------
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT DEFAULT '',
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------
-- admins: tài khoản quản trị web
-- -------------------------
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',
  avatar TEXT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------
-- chat_threads: đoạn chat giữa khách và shop (nút chat xanh)
-- -------------------------
CREATE TABLE IF NOT EXISTS chat_threads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  customer_email TEXT,
  subject TEXT DEFAULT 'Trò chuyện với shop',
  unread_admin INTEGER DEFAULT 0,
  unread_customer INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------
-- chat_messages: từng tin nhắn trong một đoạn chat
-- sender_type: 'customer' = khách nhắn, 'admin' = shop trả lời
-- -------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
);

-- -------------------------
-- quote_requests: đơn xin báo giá / liên hệ từ form Liên hệ
-- status: 'moi' = mới, 'da_lien_he' = đã liên hệ, 'da_bao_gia' = đã báo giá,
-- 'da_chot' = đã chốt, 'da_huy' = đã hủy
-- -------------------------
CREATE TABLE IF NOT EXISTS quote_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  product_name TEXT,
  message TEXT,
  status TEXT DEFAULT 'moi',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------
-- site_settings: cài đặt chung của web — số điện thoại hiển thị
-- trên shop. Quản trị đổi số trong trang /admin/cai-dat (lưu vào
-- bảng này), shop đọc ra để hiện ở chân trang, nút "Gọi ngay" và
-- trang Liên hệ.
-- -------------------------
CREATE TABLE IF NOT EXISTS site_settings (
  "key" TEXT NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Trigger tự cập nhật updated_at (thay cho ON UPDATE
-- CURRENT_TIMESTAMP của MySQL). SQLite mặc định KHÔNG chạy
-- trigger đệ quy (recursive_triggers = OFF) nên lệnh UPDATE
-- bên trong trigger không tự kích hoạt lại chính nó.
-- ============================================================
CREATE TRIGGER IF NOT EXISTS products_updated_at
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
  UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS customers_updated_at
AFTER UPDATE ON customers
FOR EACH ROW
BEGIN
  UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS admins_updated_at
AFTER UPDATE ON admins
FOR EACH ROW
BEGIN
  UPDATE admins SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS chat_threads_updated_at
AFTER UPDATE ON chat_threads
FOR EACH ROW
BEGIN
  UPDATE chat_threads SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS quote_requests_updated_at
AFTER UPDATE ON quote_requests
FOR EACH ROW
BEGIN
  UPDATE quote_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================================
-- Dữ liệu mẫu ban đầu (INSERT OR IGNORE theo id / khóa chính:
-- chạy lại không ghi đè dữ liệu đã sửa)
-- ============================================================

-- 3 nhóm phong cách
INSERT OR IGNORE INTO categories (id, name, slug) VALUES
  (1, 'Hiện đại', 'hien-dai'),
  (2, 'Tân cổ điển', 'tan-co-dien'),
  (3, 'Tối giản', 'toi-gian');

-- 8 mẫu sofa thật của xưởng. GIÁ THẬT cho 6 mẫu (chủ xưởng gửi
-- ngày 2026-11-21); 2 mẫu còn lại (xám đậm, xanh teal) vẫn GIÁ TẠM
-- THỜI (đặt ngày 2026-11-14, khoảng 12–15 triệu/mẫu): chỉ 3 mẫu
-- có giá giảm -10% (nâu đậm, xanh dương, xanh teal), 5 mẫu còn lại
-- sale_price NULL. Khi có giá thật cho 2 mẫu còn lại thì sửa số ở đây.
INSERT OR IGNORE INTO products (id, name, style, image, description, price, sale_price) VALUES
  (1, 'Sofa da chữ L nâu đậm', 'Hiện đại', '/images/sofa/sofa-da-chu-l-nau-dam.jpg', 'Da nâu đậm, dáng chữ L, lưng tựa nút bấm, chân gỗ — sang trọng, dễ lau chùi.', 8500000, 7650000),
  (2, 'Sofa da chữ L nâu chần trám', 'Hiện đại', '/images/sofa/sofa-da-chu-l-nau-chan-tram.jpg', 'Da nâu, dáng chữ L, tựa lưng chần trám, đệm ngồi dày dặn.', 9000000, NULL),
  (3, 'Sofa vải xanh dương chữ L', 'Tối giản', '/images/sofa/sofa-vai-xanh-duong-chu-l.jpg', 'Vải xanh dương, dáng chữ L rộng rãi, đệm êm, hợp phòng khách hiện đại.', 8500000, 7650000),
  (4, 'Sofa vải trắng kem chữ L', 'Tối giản', '/images/sofa/sofa-vai-trang-kem-chu-l.jpg', 'Vải trắng kem, dáng chữ L, tông sáng, tạo cảm giác rộng và thoáng.', 5600000, NULL),
  (5, 'Sofa cổ điển xanh nhạt', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xanh-nhat.jpg', 'Vải xanh nhạt, lưng tựa nút bấm cổ điển, tay vịn thanh lịch.', 2200000, NULL),
  (6, 'Sofa cổ điển xám đậm', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xam-dam.jpg', 'Vải xám đậm, lưng tựa nút bấm cổ điển, dáng gọn, dễ phối nội thất.', 13500000, NULL),
  (7, 'Sofa cổ điển xanh teal', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xanh-teal.jpg', 'Vải xanh teal, lưng tựa nút bấm cổ điển, điểm nhấn nổi bật cho phòng khách.', 14000000, 12600000),
  (8, 'Sofa cổ điển xám nhạt kèm đôn', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xam-nhat-kem-don.jpg', 'Vải xám nhạt, lưng tựa nút bấm cổ điển, kèm 2 đôn tiện lợi.', 2500000, NULL);

-- Tài khoản quản trị: duyngocmanufac@gmail.com
-- Mật khẩu ban đầu là admin123 (đã băm bằng bcrypt — giữ nguyên
-- chuỗi băm từ bản MySQL, đăng nhập web xong thì đổi mật khẩu ngay
-- trong trang quản trị).
INSERT OR IGNORE INTO admins (id, email, password_hash, name, role) VALUES
  (1, 'duyngocmanufac@gmail.com', '$2b$10$rFB71rAsa5OD6eTLcff.oO17fq6V.ax138aGTuZyuIhi8iP1f3xPO', 'Quản trị viên Sofa Duy Ngọc', 'admin');

-- Số điện thoại mặc định (trùng số trên banner). INSERT OR IGNORE
-- để không ghi đè số quản trị đã đổi trong /admin/cai-dat khi
-- chạy lại file này.
INSERT OR IGNORE INTO site_settings ("key", "value") VALUES
  ('phone_main', '0943625922'),
  ('phone_secondary', '0398084245');
