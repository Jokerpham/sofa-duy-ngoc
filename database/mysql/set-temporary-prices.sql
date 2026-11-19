-- Đặt GIÁ TẠM THỜI cho 8 mẫu sofa trong database sofa_duy_ngoc đã có.
-- Chạy file này trong MySQL Workbench (mở file rồi bấm Ctrl+Shift+Enter).
-- GIÁ TẠM THỜI (đặt ngày 2026-11-14, khoảng 12–15 triệu/mẫu): chỉ 3 mẫu
-- có giá giảm -10% (nâu đậm, xanh dương, xanh teal), 5 mẫu còn lại
-- sale_price NULL. Khi có giá thật thì sửa lại số ở đây rồi chạy lại.
-- Cập nhật theo TÊN mẫu nên không phụ thuộc id.

USE sofa_duy_ngoc;

UPDATE products SET price = 15000000, sale_price = 13500000 WHERE name = 'Sofa da chữ L nâu đậm';
UPDATE products SET price = 14500000, sale_price = NULL WHERE name = 'Sofa da chữ L nâu chần trám';
UPDATE products SET price = 13000000, sale_price = 11700000 WHERE name = 'Sofa vải xanh dương chữ L';
UPDATE products SET price = 12500000, sale_price = NULL WHERE name = 'Sofa vải trắng kem chữ L';
UPDATE products SET price = 12000000, sale_price = NULL WHERE name = 'Sofa cổ điển xanh nhạt';
UPDATE products SET price = 13500000, sale_price = NULL WHERE name = 'Sofa cổ điển xám đậm';
UPDATE products SET price = 14000000, sale_price = 12600000 WHERE name = 'Sofa cổ điển xanh teal';
UPDATE products SET price = 15000000, sale_price = NULL WHERE name = 'Sofa cổ điển xám nhạt kèm đôn';

-- Kiểm tra lại sau khi chạy:
-- SELECT name, price, sale_price FROM products ORDER BY id;
