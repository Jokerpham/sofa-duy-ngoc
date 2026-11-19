// Số điện thoại của xưởng hiển thị trên shop — quản trị đổi được trong
// trang /admin/cai-dat (chỉ quản trị, không ai khác đổi được). Shop chỉ
// ĐỌC và HIỂN THỊ số đã lưu; số mặc định dưới đây (trùng số trên banner)
// dùng khi chưa lưu gì trong cơ sở dữ liệu hoặc khi không tải được.
import { useEffect, useState } from "react";
import { SITE } from "./site";

export type SitePhones = {
  /** Số chính dạng hiển thị, ví dụ "0943.625.922". */
  main: string;
  /** Số phụ dạng hiển thị, ví dụ "0398.084.245". */
  secondary: string;
  /** Số chính chỉ gồm chữ số, dùng cho link tel:. */
  mainTel: string;
  /** Số phụ chỉ gồm chữ số, dùng cho link tel:. */
  secondaryTel: string;
};

export const DEFAULT_PHONES: SitePhones = {
  main: SITE.phone1,
  secondary: SITE.phone2,
  mainTel: SITE.phone1Tel,
  secondaryTel: SITE.phone2Tel,
};

/** Bỏ hết ký tự không phải chữ số (dấu chấm, khoảng trắng, dấu +...). */
export function normalizePhone(value: string): string {
  return (value ?? "").replace(/\D/g, "");
}

/** Số điện thoại Việt Nam hợp lệ: chỉ gồm chữ số, dài 9–11 chữ số. */
export function isValidPhone(value: string): boolean {
  const digits = normalizePhone(value);
  return digits.length >= 9 && digits.length <= 11;
}

/** Định dạng số để hiển thị: 10 số → 0943.625.922, 11 số → 4.4.3,
 * 9 số → 3.3.3, còn lại giữ nguyên dãy số. */
export function formatPhoneDisplay(value: string): string {
  const d = normalizePhone(value);
  if (d.length === 10) return `${d.slice(0, 4)}.${d.slice(4, 7)}.${d.slice(7)}`;
  if (d.length === 11)
    return `${d.slice(0, 4)}.${d.slice(4, 8)}.${d.slice(8)}`;
  if (d.length === 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return d;
}

export function toSitePhones(mainDigits: string, secondaryDigits: string): SitePhones {
  return {
    main: formatPhoneDisplay(mainDigits),
    secondary: formatPhoneDisplay(secondaryDigits),
    mainTel: normalizePhone(mainDigits),
    secondaryTel: normalizePhone(secondaryDigits),
  };
}

type SettingsResponse = {
  ok?: boolean;
  settings?: { phone_main?: string; phone_secondary?: string };
};

// Cache chung: Header + Footer + trang Liên hệ cùng dùng 1 lần tải,
// không gọi /api/settings lặp lại trên mỗi trang.
let cachedFetch: Promise<SitePhones> | null = null;

export function fetchSitePhones(): Promise<SitePhones> {
  if (!cachedFetch) {
    cachedFetch = fetch("/api/settings")
      .then((r) => r.json())
      .then((data: unknown) => {
        const d = data as SettingsResponse;
        if (d && d.ok && d.settings?.phone_main) {
          return toSitePhones(
            d.settings.phone_main,
            d.settings.phone_secondary ?? DEFAULT_PHONES.secondaryTel,
          );
        }
        return DEFAULT_PHONES;
      })
      .catch(() => DEFAULT_PHONES);
  }
  return cachedFetch;
}

/** Xóa cache sau khi quản trị lưu số mới, để shop tải lại số mới. */
export function invalidateSitePhonesCache(): void {
  cachedFetch = null;
}

/** Hook cho các component phía shop: lúc đầu hiện số mặc định, tải xong
 * số đã lưu thì đổi sang số đó. Không tải được thì giữ số mặc định. */
export function useSitePhones(): SitePhones {
  const [phones, setPhones] = useState<SitePhones>(DEFAULT_PHONES);
  useEffect(() => {
    let alive = true;
    void fetchSitePhones().then((p) => {
      if (alive) setPhones(p);
    });
    return () => {
      alive = false;
    };
  }, []);
  return phones;
}
