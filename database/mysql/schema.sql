-- ============================================================
-- Sofa Duy Ngọc — Cơ sở dữ liệu MySQL
-- Database riêng cho web bán nội thất Sofa Duy Ngọc.
-- Tên database: sofa_duy_ngoc (để riêng, dễ tìm trong Workbench,
-- không dùng chung với mona_fashion hay invoice_ems).
-- Cách chạy: mở MySQL Workbench, nối vào máy chủ MySQL,
-- mở file này (File > Open SQL Script) rồi bấm Execute (tia sét).
--
-- LƯU Ý: nếu bạn đã chạy file schema.sql phiên bản cũ (chưa có cột
-- subject / unread_admin / unread_customer ở chat_threads và cột
-- address ở customers), hãy xoá database sofa_duy_ngoc rồi chạy lại
-- file này từ đầu (mới setup, chưa có dữ liệu thật nên không mất gì).
--
-- NÂNG CẤP LOGO TÀI KHOẢN QUẢN TRỊ (chỉ cần chạy 1 lần nếu database
-- đã tạo từ trước — cột avatar lưu ảnh logo admin đổi từ giao diện):
--   ALTER TABLE admins ADD COLUMN avatar LONGTEXT NULL;
-- ============================================================

CREATE DATABASE IF NOT EXISTS sofa_duy_ngoc
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sofa_duy_ngoc;

-- -------------------------
-- categories: nhóm phong cách sofa (bộ lọc ở trang Sản phẩm)
-- -------------------------
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------
-- products: 8 mẫu sofa đang bán (chưa có giá — giá để NULL,
-- khi nào có giá thật sẽ cập nhật sau, không bịa giá).
-- size / material / code: kích thước, chất liệu, mã sản phẩm —
-- quản trị điền trong trang /admin/san-pham; trống thì trang chi
-- tiết vẫn hiện "Đang cập nhật". image là TEXT để lưu được ảnh
-- tải lên từ trang quản trị (data URL dài hơn VARCHAR(255)).
-- -------------------------
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  style VARCHAR(100),
  image TEXT,
  description TEXT,
  price DECIMAL(12,0) NULL,
  sale_price DECIMAL(12,0) NULL,
  size VARCHAR(100) NULL,
  material VARCHAR(255) NULL,
  code VARCHAR(100) NULL,
  is_new TINYINT(1) DEFAULT 0,
  is_sale TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nâng cấp cho trang "Sản phẩm & Giá" chỉnh sửa đầy đủ — chạy 1 lần
-- trong Workbench NẾU bảng products đã tạo từ trước (chạy lại file
-- này là tự áp dụng; cần MySQL 8.0.29+ cho ADD COLUMN IF NOT EXISTS):
--   ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(100) NULL;
--   ALTER TABLE products ADD COLUMN IF NOT EXISTS material VARCHAR(255) NULL;
--   ALTER TABLE products ADD COLUMN IF NOT EXISTS code VARCHAR(100) NULL;
--   ALTER TABLE products MODIFY COLUMN image TEXT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size VARCHAR(100) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material VARCHAR(255) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS code VARCHAR(100) NULL;
ALTER TABLE products MODIFY COLUMN image TEXT NULL;

-- -------------------------
-- customers: tài khoản khách hàng đăng ký trên web
-- (mật khẩu lưu dạng băm, không lưu mật khẩu gốc)
-- -------------------------
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address VARCHAR(255) DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------
-- admins: tài khoản quản trị web
-- -------------------------
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  avatar LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------
-- chat_threads: đoạn chat giữa khách và shop (nút chat xanh)
-- -------------------------
CREATE TABLE IF NOT EXISTS chat_threads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  subject VARCHAR(255) DEFAULT 'Trò chuyện với shop',
  unread_admin TINYINT(1) DEFAULT 0,
  unread_customer TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------
-- chat_messages: từng tin nhắn trong một đoạn chat
-- sender_type: 'customer' = khách nhắn, 'admin' = shop trả lời
-- -------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  thread_id INT NOT NULL,
  sender_type ENUM('customer','admin') NOT NULL,
  sender_name VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------
-- quote_requests: đơn xin báo giá / liên hệ từ form Liên hệ
-- status: 'moi' = mới, 'da_lien_he' = đã liên hệ, 'da_bao_gia' = đã báo giá,
-- 'da_chot' = đã chốt, 'da_huy' = đã hủy
-- -------------------------
CREATE TABLE IF NOT EXISTS quote_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  product_name VARCHAR(255),
  message TEXT,
  status VARCHAR(50) DEFAULT 'moi',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Dữ liệu mẫu ban đầu
-- ============================================================

-- 3 nhóm phong cách
INSERT INTO categories (name, slug) VALUES
  ('Hiện đại', 'hien-dai'),
  ('Tân cổ điển', 'tan-co-dien'),
  ('Tối giản', 'toi-gian')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 8 mẫu sofa đang bán (giá để NULL vì chưa có giá thật)
-- 8 mẫu sofa thật của xưởng. GIÁ TẠM THỜI (đặt ngày 2026-11-14,
-- khoảng 12–15 triệu/mẫu, để hiển thị giá kiểu MONA): chỉ 3 mẫu có
-- giá giảm -10% (nâu đậm, xanh dương, xanh teal), 5 mẫu còn lại
-- sale_price NULL. Khi có giá thật thì sửa lại số ở đây.
INSERT INTO products (name, style, image, description, price, sale_price) VALUES
  ('Sofa da chữ L nâu đậm', 'Hiện đại', '/images/sofa/sofa-da-chu-l-nau-dam.jpg', 'Da nâu đậm, dáng chữ L, lưng tựa nút bấm, chân gỗ — sang trọng, dễ lau chùi.', 15000000, 13500000),
  ('Sofa da chữ L nâu chần trám', 'Hiện đại', '/images/sofa/sofa-da-chu-l-nau-chan-tram.jpg', 'Da nâu, dáng chữ L, tựa lưng chần trám, đệm ngồi dày dặn.', 14500000, NULL),
  ('Sofa vải xanh dương chữ L', 'Tối giản', '/images/sofa/sofa-vai-xanh-duong-chu-l.jpg', 'Vải xanh dương, dáng chữ L rộng rãi, đệm êm, hợp phòng khách hiện đại.', 13000000, 11700000),
  ('Sofa vải trắng kem chữ L', 'Tối giản', '/images/sofa/sofa-vai-trang-kem-chu-l.jpg', 'Vải trắng kem, dáng chữ L, tông sáng, tạo cảm giác rộng và thoáng.', 12500000, NULL),
  ('Sofa cổ điển xanh nhạt', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xanh-nhat.jpg', 'Vải xanh nhạt, lưng tựa nút bấm cổ điển, tay vịn thanh lịch.', 12000000, NULL),
  ('Sofa cổ điển xám đậm', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xam-dam.jpg', 'Vải xám đậm, lưng tựa nút bấm cổ điển, dáng gọn, dễ phối nội thất.', 13500000, NULL),
  ('Sofa cổ điển xanh teal', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xanh-teal.jpg', 'Vải xanh teal, lưng tựa nút bấm cổ điển, điểm nhấn nổi bật cho phòng khách.', 14000000, 12600000),
  ('Sofa cổ điển xám nhạt kèm đôn', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xam-nhat-kem-don.jpg', 'Vải xám nhạt, lưng tựa nút bấm cổ điển, kèm 2 đôn tiện lợi.', 15000000, NULL);

-- Tài khoản quản trị: duyngocmanufac@gmail.com
-- Mật khẩu ban đầu là admin123 (đã băm bằng bcrypt).
-- Đăng nhập web xong thì đổi mật khẩu ngay trong trang quản trị.
INSERT INTO admins (email, password_hash, name, role) VALUES
  ('duyngocmanufac@gmail.com', '$2b$10$rFB71rAsa5OD6eTLcff.oO17fq6V.ax138aGTuZyuIhi8iP1f3xPO', 'Quản trị viên Sofa Duy Ngọc', 'admin')
ON DUPLICATE KEY UPDATE name = VALUES(name), role = VALUES(role);

-- ============================================================
-- Bảng cài đặt chung của web — số điện thoại hiển thị trên shop.
-- Quản trị đổi số trong trang /admin/cai-dat (lưu vào bảng này),
-- shop đọc ra để hiện ở chân trang, nút "Gọi ngay" và trang Liên hệ.
-- Chạy 1 lần trong Workbench NẾU bảng chưa có. Lưu ý: route
-- /api/admin/settings cũng tự tạo bảng khi lưu lần đầu, nên bước
-- này KHÔNG bắt buộc — đổi số trong trang quản trị là đủ.
-- ============================================================
CREATE TABLE IF NOT EXISTS site_settings (
  `key` VARCHAR(50) NOT NULL PRIMARY KEY,
  `value` VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Số mặc định (trùng số trên banner). INSERT IGNORE để không ghi đè
-- số quản trị đã đổi trong /admin/cai-dat khi chạy lại file này.
INSERT IGNORE INTO site_settings (`key`, `value`) VALUES
  ('phone_main', '0943625922'),
  ('phone_secondary', '0398084245');
