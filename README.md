# Sofa Duy Ngọc — Website giới thiệu (Next.js)

Website giới thiệu Xưởng **Sofa Duy Ngọc (DN HOME)** — Thiết kế nội thất,
sản xuất / bọc / sửa lại ghế sofa tại Hải Phòng.

## Cơ sở dữ liệu MySQL (local)

Website giờ dùng database MySQL local `sofa_duy_ngoc` trên chính máy của
bạn (tài khoản khách, tài khoản quản trị, tin nhắn chat, đơn xin báo giá
đều lưu trong database — mật khẩu lưu dạng băm bcrypt, không lưu chữ thường).
Web chạy dạng **máy chủ Node** (không còn xuất tĩnh), nên máy phải đang chạy
MySQL thì web mới hoạt động.

Các bước setup (làm một lần):

1. Mở MySQL Workbench, nối vào **"Local instance MySQL80"** (MySQL trên máy
   của bạn), mở file `database/mysql/schema.sql` (File > Open SQL Script)
   rồi bấm Execute (tia sét) để tạo database `sofa_duy_ngoc` cùng các bảng
   và dữ liệu mẫu (8 sản phẩm, 3 nhóm phong cách, tài khoản quản trị
   `duyngocmanufac@gmail.com` / mật khẩu ban đầu `admin123` — đăng nhập xong
   thì đổi mật khẩu ngay trong trang quản trị).
2. Copy file `.env.example` thành `.env`, rồi thay
   `MAT_KHAU_MYSQL_CUA_BAN` bằng mật khẩu root MySQL trên máy của bạn.
   Gõ mật khẩu trực tiếp vào file `.env` trên máy của bạn, **không gửi mật
   khẩu qua chat, không đưa `.env` lên GitHub**.
3. Chạy `npm run dev` như bình thường.

## Chạy thử trên máy của bạn

```bash
npm install
npm run dev
```

Mở trình duyệt tại địa chỉ hiện trong terminal, thường là
http://localhost:3000

## Build và chạy dạng máy chủ Node

```bash
npm run build
npm start
```

Lệnh này build web dạng máy chủ Node (thư mục `.next/`), rồi chạy tại
http://localhost:3000. Web cần MySQL đang chạy trên máy thì các API
(tài khoản, chat, báo giá) mới hoạt động. Web **không còn** xuất ra thư mục
`out/` tĩnh để đăng Cloudflare Pages static nữa.

## Cấu trúc — web nhiều trang

- `/` (`src/app/page.tsx`) — trang chủ: Hero, 3 điểm mạnh, giới thiệu nhanh
  các trang còn lại.
- `/dich-vu` — 6 thẻ dịch vụ.
- `/san-pham` — 8 mẫu sofa thật, lọc theo phong cách (Tất cả / Hiện đại /
  Tân cổ điển / Tối giản). Nút "Báo giá" ở mỗi mẫu dẫn sang `/lien-he?mau=...`
  để form tự điền sẵn tên mẫu.
- `/quy-trinh` — quy trình 5 bước.
- `/xuong-san-xuat` — giới thiệu xưởng.
- `/hoi-dap` — hỏi đáp dạng accordion.
- `/lien-he` — thông tin liên hệ đầy đủ + bản đồ Google Maps nhúng theo đúng
  địa chỉ xưởng + form "Thông tin liên hệ" (Họ và Tên, Email, Chủ đề, Nội
  dung — gửi qua mailto tới xưởng) + form báo giá.
- `src/app/layout.tsx` — Header (menu trỏ sang các trang) + Footer chung cho
  mọi trang. Footer nền nâu đậm #241208, chữ kem, link vàng, bố cục cột kiểu
  zerofurniture: Sản phẩm / Dịch vụ / Hỗ trợ / Về chúng tôi / Phòng trưng bày
  + Bản tin.
- `src/components/` — từng mục là một component riêng.
- `src/lib/site.ts` — số điện thoại, email, địa chỉ, link Zalo/Maps (sửa ở đây
  là đổi cả trang).
- `src/lib/products.ts` — danh sách 8 sản phẩm thật (dùng chung cho trang Sản
  phẩm và cột Sản phẩm ở footer).
- `public/images/banner-sofa-duy-ngoc.jpg` — banner chính thức của xưởng.

## Ghi chú

- Website dùng database MySQL local `sofa_duy_ngoc` (xem mục "Cơ sở dữ liệu
  MySQL (local)" ở trên): tài khoản khách, tài khoản quản trị, tin nhắn chat
  và đơn xin báo giá lưu trong database; mật khẩu lưu dạng băm bcrypt.
  Cần file `.env` (copy từ `.env.example`) và MySQL đang chạy trên máy.
- Form báo giá chỉ soạn sẵn tin nhắn trên trình duyệt của khách rồi gửi qua
  Email (mailto) hoặc sao chép — không lưu dữ liệu lên máy chủ.
- Ảnh trong mục "Sản phẩm" là ảnh thật các mẫu sofa của xưởng
  (thư mục `public/images/sofa/`). Gửi thêm ảnh cho xưởng là thêm được mẫu mới.
  Sản phẩm chưa có giá bán — khách bấm "Báo giá" ở thẻ sản phẩm để gửi yêu cầu,
  form sẽ tự điền sẵn tên mẫu.
- Liên hệ: 0943.625.922 — 0398.084.245 — duyngocmanufac@gmail.com —
  350 Hoàng Quốc Việt, P. Phù Liễn, Hải Phòng.
- **Nút chat xanh** ở góc dưới bên phải mọi trang shop (trên nút Zalo): khách
  bấm để trò chuyện với xưởng. **Nút tròn nâu đậm ↑** nằm ngay phía trên nút
  chat xanh: chỉ hiện khi đã cuộn xuống khoảng 300px, bấm để cuộn mượt về đầu
  trang. Cả hai nút đều KHÔNG hiện trên các trang `/admin`.

## Chat demo: tin nhắn chỉ lưu trong trình duyệt

- Khách bấm nút chat xanh → nhập Họ và tên, Email, Tin nhắn → đoạn chat được
  tạo và lưu trong localStorage (key `sdn-chat-threads`), email nhớ trong
  `sdn-chat-email`. Khung chat tự làm mới mỗi 5 giây và tự cuộn xuống tin mới.
- Quản trị xem và trả lời tại trang `/admin/tin-nhan` (cần đăng nhập trước;
  có huy hiệu đếm tin mới ở thẻ “Tin nhắn khách hàng” trong trang tổng quan
  `/admin`). Tin nhắn của quản trị hiện bên trái (xám nhạt), của khách hiện
  bên phải (nâu đậm) — ngược lại trong khung chat của khách.
- ⚠️ **Giới hạn bản demo:** tin nhắn chỉ lưu trong localStorage của trình
  duyệt đang mở, KHÔNG có máy chủ. Nghĩa là khách và quản trị chỉ thấy tin
  nhắn của nhau khi dùng CHUNG một trình duyệt (cùng máy, cùng trình duyệt).
  Muốn chat thật giữa nhiều người dùng / nhiều máy thì cần máy chủ + database
  lưu tin nhắn.

## Quản trị (bản demo)

- Trang đăng nhập: `/admin` — nhập Email + Mật khẩu rồi bấm **ĐĂNG NHẬP**.
  Tài khoản mặc định (đã tạo sẵn trong trình duyệt khi mở trang lần đầu):
  - Email: `duyngocmanufac@gmail.com`
  - Mật khẩu: `admin123`
  - Tên hiển thị: Quản trị viên Sofa Duy Ngọc
- Ô mật khẩu nào cũng có nút **con mắt** ở mép phải để hiện / ẩn mật khẩu
  (trang đăng nhập và cả 3 ô ở trang đổi mật khẩu).
- Sau khi đăng nhập, trang `/admin` hiện trang tổng quan đơn giản: 8 sản phẩm,
  6 dịch vụ, thông tin liên hệ xưởng, link xem các trang shop, nút **Đổi mật
  khẩu** (`/admin/doi-mat-khau`) và nút **Đăng xuất**.
- Đổi mật khẩu: nhập Mật khẩu hiện tại, Mật khẩu mới (tối thiểu 6 ký tự) và
  Nhập lại mật khẩu mới. Mật khẩu hiện tại sai hoặc nhập lại không khớp thì
  trang báo lỗi rõ ràng; đổi xong hiện "Đổi mật khẩu thành công".
- **Quên / mất mật khẩu:** mật khẩu chỉ lưu trong localStorage của trình duyệt
  đang dùng. Mở DevTools của trình duyệt (F12) → tab Application (Chrome) /
  Storage (Firefox) → Local Storage → chọn đúng địa chỉ web → xoá key
  `sdn-users` rồi tải lại trang `/admin`: tài khoản mặc định
  `duyngocmanufac@gmail.com` / `admin123` sẽ được tạo lại.
- ⚠️ **Giới hạn bản demo:** tài khoản, mật khẩu (lưu dạng chữ thường) và phiên
  đăng nhập chỉ lưu trong localStorage của từng trình duyệt — không có máy chủ
  kiểm tra, ai mở DevTools cũng xem được. Chỉ dùng để xem thử / quản lý giao
  diện demo. Trước khi dùng thật (đăng nhập từ nhiều máy, bảo vệ dữ liệu),
  bắt buộc phải làm đăng nhập phía máy chủ + mã hoá mật khẩu.
- Trang quản trị KHÔNG có trong menu của shop — mở trực tiếp bằng địa chỉ
  `/admin` (ví dụ: http://localhost:3000/admin khi chạy local).

## Tài khoản khách hàng (bản demo)

- Trang tài khoản: `/tai-khoan` — có 2 tab **Đăng nhập** và **Đăng ký**,
  link "Tài khoản" có trong menu header và footer.
- **Đăng ký:** nhập Họ và tên, Email, Số điện thoại, Mật khẩu, Nhập lại mật
  khẩu (Địa chỉ không bắt buộc). Mật khẩu tối thiểu 6 ký tự; email sai định
  dạng, mật khẩu nhập lại không khớp, hoặc email đã đăng ký thì trang báo lỗi
  rõ ràng. Đăng ký xong thì tài khoản được tạo và đăng nhập luôn.
- **Đăng nhập:** nhập Email + Mật khẩu. Email chưa đăng ký hoặc mật khẩu sai
  thì trang báo lỗi rõ ràng.
- Sau khi đăng nhập, trang hiện thông tin tài khoản (Họ tên, Email, SĐT,
  Địa chỉ), mục **Đổi mật khẩu** (Mật khẩu hiện tại + Mật khẩu mới + Nhập lại
  mật khẩu mới, tối thiểu 6 ký tự) và nút **Đăng xuất**.
- Ô mật khẩu nào cũng có nút **con mắt** ở mép phải để hiện / ẩn mật khẩu.
- ⚠️ **Giới hạn bản demo:** tài khoản khách hàng, mật khẩu (lưu dạng chữ
  thường) và phiên đăng nhập chỉ lưu trong localStorage của từng trình duyệt
  (key `sdn-customers` và `sdn-customer-session`) — không có máy chủ kiểm tra,
  ai mở DevTools cũng xem được. Chỉ dùng để xem thử giao diện đăng ký /
  đăng nhập. Trước khi dùng thật (đăng nhập từ nhiều máy, bảo vệ dữ liệu
  khách), bắt buộc phải làm đăng nhập phía máy chủ + mã hoá mật khẩu.
- **Quên / mất mật khẩu:** xoá key `sdn-customers` trong Local Storage của
  trình duyệt (DevTools → Application / Storage → Local Storage) rồi tải lại
  trang — mọi tài khoản khách đã đăng ký trong trình duyệt đó sẽ bị xoá.
