"use client";

import { useState } from "react";

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  // "dark": chữ kem trên nền nâu đậm (mặc định, dùng ở trang quản trị
  // và form tối). "light": chữ nâu trên nền trắng (dùng ở khung trắng
  // của trang Tài khoản độc lập).
  variant?: "dark" | "light";
};

// Ô nhập mật khẩu có nút con mắt để hiện / ẩn mật khẩu.
export default function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  variant = "dark",
}: PasswordFieldProps) {
  const [show, setShow] = useState(false);
  const light = variant === "light";

  return (
    <div>
      <label
        htmlFor={id}
        className={`mb-1.5 block text-sm font-bold ${
          light ? "text-[#241208]" : "text-[#EADBC6]"
        }`}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className={`w-full rounded-lg border px-4 py-2.5 pr-12 text-[15px] outline-none transition focus:ring-2 ${
            light
              ? "border-[#241208]/20 bg-white text-[#241208] placeholder:text-[#241208]/40 focus:border-[#6B3A2A] focus:ring-[#6B3A2A]/20"
              : "border-[#EADBC6]/30 bg-white/10 text-[#EADBC6] placeholder:text-[#EADBC6]/50 focus:border-[#FFD9A0] focus:ring-[#FFD9A0]/40"
          }`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          aria-pressed={show}
          title={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          className={`absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg transition ${
            light
              ? "text-[#241208]/60 hover:bg-[#241208]/5 hover:text-[#241208]"
              : "text-[#EADBC6]/80 hover:bg-white/10 hover:text-[#FFD9A0]"
          }`}
        >
          {show ? (
            // Mắt gạch chéo = đang hiện mật khẩu
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
              <path d="m14.12 14.12-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            // Mắt mở = đang ẩn mật khẩu
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
