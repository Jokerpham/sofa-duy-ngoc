# Đưa web Sofa Duy Ngọc lên mạng (Cloudflare Pages + D1)

> Bản này chạy bằng **database D1 của Cloudflare** (không cần MySQL trên
> máy nữa). **Không dùng cách kéo-thả file zip tĩnh như trước** — cách đó
> chỉ chạy được web tĩnh, không chạy được web có database D1 này. Làm
> theo 3 phần dưới đây, mỗi bước chỉ 1 việc.

---

## Phần 1 — Tạo database D1 trên Cloudflare

1. Mở trình duyệt, vào **dash.cloudflare.com** và đăng nhập tài khoản
   Cloudflare của bạn.
2. Ở menu bên trái, bấm **Workers & Pages**.
3. Bấm **D1 SQL Database** (ở menu bên trái, mục Storage).
4. Bấm nút **Create**.
5. Ô **Database name**: gõ đúng tên `sofa-duy-ngoc`
6. Bấm **Create**.
7. Cloudflare hiện ra trang chi tiết database — tìm dòng **Database ID**,
   bấm nút copy bên cạnh để sao chép dãy ID đó.
8. Trên máy tính, mở file **`wrangler.toml`** trong thư mục code bằng
   Notepad (hoặc VS Code).
9. Tìm dòng `database_id = "REPLACE_WITH_D1_DATABASE_ID"`.
10. Xóa đúng chữ `REPLACE_WITH_D1_DATABASE_ID` (giữ nguyên 2 dấu ngoặc
    kép), dán dãy ID vừa copy vào giữa 2 dấu ngoặc kép.
11. Lưu file (Ctrl + S).

---

## Phần 2 — Nạp dữ liệu mẫu vào database D1

1. Vẫn ở trang chi tiết database `sofa-duy-ngoc` trong Cloudflare,
   bấm tab **Console** ở phía trên.
2. Trên máy tính, mở file **`database/d1/sofa-duy-ngoc-d1.sql`** bằng
   Notepad, bấm Ctrl + A (chọn hết) rồi Ctrl + C (sao chép).
3. Dán toàn bộ vào ô nhập SQL trong tab Console của Cloudflare.
4. Bấm nút **Execute** (hoặc **Run**).
5. Đợi báo thành công. Kiểm tra nhanh: vẫn trong tab Console, gõ câu
   lệnh sau vào ô nhập rồi bấm Execute:

   ```sql
   SELECT COUNT(*) FROM products;
   ```

   Kết quả phải là **8** (8 mẫu sofa). Nếu báo lỗi, chụp màn hình lỗi
   gửi lại cho tôi.

> Tài khoản quản trị sau khi nạp dữ liệu:
> **Email:** `duyngocmanufac@gmail.com` — **Mật khẩu:** `admin123`
> Đăng nhập web xong, đổi mật khẩu ngay trong trang quản trị
> (**/admin/doi-mat-khau**).

---

## Phần 3 — Đưa code lên GitHub rồi nối vào Cloudflare Pages

### 3a. Tạo 1 file nhỏ bắt buộc (để lệnh build chạy được)

1. Trong thư mục code, tạo thư mục mới tên **`.vercel`** (có dấu chấm ở
   đầu).
2. Trong thư mục `.vercel`, tạo file mới tên **`project.json`**.
3. Mở file `project.json`, dán đúng nội dung sau vào rồi lưu:

   ```json
   {"projectId":"_","orgId":"_","settings":{"framework":"nextjs"}}
   ```

### 3b. Tạo repo GitHub và đẩy code lên

1. Vào **github.com**, đăng nhập tài khoản của bạn.
2. Bấm dấu **+** ở góc trên bên phải, chọn **New repository**.
3. Ô **Repository name**: gõ `sofa-duy-ngoc`
4. Chọn **Public**, rồi bấm **Create repository**.
5. GitHub hiện ra trang hướng dẫn — làm theo mục
   **“…or push an existing repository from the command line”**:
   mở cửa sổ lệnh (Terminal / Command Prompt) trong thư mục code và
   chạy từng lệnh (mỗi lệnh 1 dòng, chờ chạy xong mới chạy lệnh tiếp):

   ```bash
   git init
   ```

   ```bash
   git add .
   ```

   ```bash
   git commit -m "Web Sofa Duy Ngọc - Cloudflare Pages + D1"
   ```

   ```bash
   git branch -M main
   ```

   ```bash
   git remote add origin https://github.com/Jokerpham/sofa-duy-ngoc.git
   ```

   ```bash
   git push -u origin main
   ```

   > Nếu máy hỏi tài khoản/mật khẩu GitHub, đăng nhập như bình thường.
   > **Không** đẩy file `.env` lên GitHub (bản này không cần file `.env`
   > khi chạy trên Cloudflare).

### 3c. Nối repo vào Cloudflare Pages

1. Vào **dash.cloudflare.com** → **Workers & Pages**.
2. Bấm **Create** → chọn **Pages** → chọn **Connect to Git**.
3. Chọn tài khoản GitHub của bạn, chọn repo **`sofa-duy-ngoc`**.
4. Bấm **Begin setup**.
5. Ô **Project name**: gõ `sofa-duy-ngoc`
6. Ô **Production branch**: để `main`.
7. Mục **Build settings** — sửa 2 ô sau:
   - **Build command**: gõ đúng `npm run pages:build`
   - **Build output directory**: để trống (không điền gì)
8. Bấm **Save and Deploy**.
9. Đợi Cloudflare build xong (vài phút). Khi báo thành công, web chạy ở
   địa chỉ dạng `https://sofa-duy-ngoc.pages.dev`.

### 3d. Kiểm tra binding D1 đã gắn đúng chưa

1. Trong trang dự án Pages `sofa-duy-ngoc`, bấm **Settings**.
2. Bấm **Functions** ở menu bên trái.
3. Kéo xuống mục **D1 database bindings** — phải thấy 1 dòng:
   tên biến là **`DB`**, database là **`sofa-duy-ngoc`**.
4. Nếu chưa thấy, bấm **Add binding**, điền Variable name là `DB`,
   chọn database `sofa-duy-ngoc`, bấm **Save**, rồi bấm
   **Deployments** → bấm dấu **⋯** ở bản deploy mới nhất → **Retry
   deployment**.

---

## Kiểm tra sau khi deploy xong

1. Mở `https://sofa-duy-ngoc.pages.dev` — trang chủ phải hiện đủ
   8 mẫu sofa.
2. Mở `https://sofa-duy-ngoc.pages.dev/admin` — đăng nhập bằng
   `duyngocmanufac@gmail.com` / `admin123`, rồi đổi mật khẩu ngay.
3. Thử đặt 1 đơn / gửi 1 tin nhắn liên hệ, rồi vào trang quản trị xem
   có hiện không.

---

## Những việc vẫn cần bạn làm (chưa làm được hộ)

- **Tạo database D1** và **dán database ID vào `wrangler.toml`**
  (Phần 1) — chỉ bạn mới vào được tài khoản Cloudflare của bạn.
- **Nạp file SQL** vào D1 Console (Phần 2).
- **Tạo repo GitHub, đẩy code, nối vào Pages** (Phần 3) — chỉ bạn mới
  vào được tài khoản GitHub và Cloudflare của bạn.
- **Đổi mật khẩu quản trị** sau lần đăng nhập đầu tiên.
- **Giá thật của 8 mẫu sofa**: trong code hiện vẫn là giá tạm
  (12–15 triệu). Vào trang quản trị **/admin/san-pham** để sửa giá
  thật, hoặc báo giá thật để tôi sửa giúp.

## Lưu ý quan trọng

- **Không dùng file zip tĩnh kéo-thả lên Pages nữa.** Bản web này là
  web động (có database D1, đăng nhập, đặt hàng) nên chỉ deploy được
  bằng cách nối GitHub như Phần 3.
- Sau này mỗi lần sửa code: chỉ cần đẩy code mới lên GitHub
  (`git add .` → `git commit -m "..."` → `git push`), Cloudflare sẽ
  tự build và cập nhật web — không cần làm lại Phần 1, 2, 3.
- Database D1 trên Cloudflare và MySQL trên máy tính là 2 nơi riêng:
  đổi giá/sản phẩm trên web thật chỉ đổi trong D1, không đổi MySQL
  trên máy và ngược lại.
