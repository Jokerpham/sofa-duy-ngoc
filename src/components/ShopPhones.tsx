"use client";

import { useSitePhones } from "@/lib/site-settings";

// Số điện thoại gọi được trên trang Liên hệ — đọc từ Cài đặt của quản
// trị (lưu trong MySQL), chưa lưu gì thì hiện số mặc định trên banner.
// Component này chỉ HIỂN THỊ số, không có chỗ nào để khách đổi số.
export function ContactPhoneLinks({
  linkClassName,
}: {
  linkClassName?: string;
}) {
  const phones = useSitePhones();
  return (
    <>
      <a href={`tel:${phones.mainTel}`} className={linkClassName}>
        {phones.main}
      </a>
      <a href={`tel:${phones.secondaryTel}`} className={linkClassName}>
        {phones.secondary}
      </a>
    </>
  );
}

// Số điện thoại chính dạng chữ (dùng trong nút "Nhắn Zalo: ...").
export function MainPhoneText() {
  const phones = useSitePhones();
  return <>{phones.main}</>;
}
