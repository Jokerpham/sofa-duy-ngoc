CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  sender_name TEXT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS site_settings (
  "key" TEXT NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO categories (id, name, slug) VALUES
  (1, 'Hiện đại', 'hien-dai'),
  (2, 'Tân cổ điển', 'tan-co-dien'),
  (3, 'Tối giản', 'toi-gian');

INSERT OR IGNORE INTO products (id, name, style, image, description, price, sale_price) VALUES
  (1, 'Sofa da chữ L nâu đậm', 'Hiện đại', '/images/sofa/sofa-da-chu-l-nau-dam.jpg', 'Da nâu đậm, dáng chữ L, lưng tựa nút bấm, chân gỗ — sang trọng, dễ lau chùi.', 8500000, 7650000),
  (2, 'Sofa da chữ L nâu chần trám', 'Hiện đại', '/images/sofa/sofa-da-chu-l-nau-chan-tram.jpg', 'Da nâu, dáng chữ L, tựa lưng chần trám, đệm ngồi dày dặn.', 9000000, NULL),
  (3, 'Sofa vải xanh dương chữ L', 'Tối giản', '/images/sofa/sofa-vai-xanh-duong-chu-l.jpg', 'Vải xanh dương, dáng chữ L rộng rãi, đệm êm, hợp phòng khách hiện đại.', 8500000, 7650000),
  (4, 'Sofa vải trắng kem chữ L', 'Tối giản', '/images/sofa/sofa-vai-trang-kem-chu-l.jpg', 'Vải trắng kem, dáng chữ L, tông sáng, tạo cảm giác rộng và thoáng.', 5600000, NULL),
  (5, 'Sofa cổ điển xanh nhạt', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xanh-nhat.jpg', 'Vải xanh nhạt, lưng tựa nút bấm cổ điển, tay vịn thanh lịch.', 2200000, NULL),
  (6, 'Sofa cổ điển xám đậm', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xam-dam.jpg', 'Vải xám đậm, lưng tựa nút bấm cổ điển, dáng gọn, dễ phối nội thất.', 13500000, NULL),
  (7, 'Sofa cổ điển xanh teal', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xanh-teal.jpg', 'Vải xanh teal, lưng tựa nút bấm cổ điển, điểm nhấn nổi bật cho phòng khách.', 14000000, 12600000),
  (8, 'Sofa cổ điển xám nhạt kèm đôn', 'Tân cổ điển', '/images/sofa/sofa-co-dien-xam-nhat-kem-don.jpg', 'Vải xám nhạt, lưng tựa nút bấm cổ điển, kèm 2 đôn tiện lợi.', 2500000, NULL);

INSERT OR IGNORE INTO admins (id, email, password_hash, name, role) VALUES
  (1, 'duyngocmanufac@gmail.com', '$2b$10$rFB71rAsa5OD6eTLcff.oO17fq6V.ax138aGTuZyuIhi8iP1f3xPO', 'Quản trị viên Sofa Duy Ngọc', 'admin');

INSERT OR IGNORE INTO site_settings ("key", "value") VALUES
  ('phone_main', '0943625922'),
  ('phone_secondary', '0398084245');
