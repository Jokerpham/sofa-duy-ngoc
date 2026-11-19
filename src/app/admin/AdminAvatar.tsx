"use client";

import { useEffect, useRef, useState } from "react";
import { SESSION_KEY } from "@/lib/admin-auth";

// Khối tài khoản quản trị ở đầu các trang /admin: vòng tròn logo
// + tên + email. Bấm vào logo (có huy hiệu bút chì) để đổi logo
// từ giao diện, không cần sửa code — ảnh lưu vào cột avatar của
// bảng admins (MySQL) nên hiện trên mọi trình duyệt; nếu database
// chưa có cột avatar thì lưu tạm vào localStorage của trình duyệt.
const AVATAR_CACHE_KEY = "sdn-admin-avatar";
const MAX_SIZE = 256;

function getSessionEmail(): string | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { email?: string };
    return session.email ? String(session.email) : null;
  } catch {
    return null;
  }
}

// Thu nhỏ ảnh về tối đa 256px (logo chỉ hiện nhỏ) để chuỗi data URL
// lưu vào database chỉ còn vài chục KB thay vì ảnh gốc vài MB.
function downscaleImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_SIZE / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Không xử lý được ảnh."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const type = ["image/png", "image/jpeg", "image/webp"].includes(
        file.type,
      )
        ? file.type
        : "image/jpeg";
      resolve(canvas.toDataURL(type, 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không đọc được file ảnh."));
    };
    img.src = url;
  });
}

export default function AdminAvatar() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("Quản trị viên Sofa Duy Ngọc");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tải logo đã lưu (ưu tiên database, sau đó tới localStorage).
  useEffect(() => {
    const em = getSessionEmail();
    if (!em) return;
    setEmail(em);
    void (async () => {
      try {
        const res = await fetch(
          `/api/admin/profile?email=${encodeURIComponent(em)}`,
        );
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          needsMigration?: boolean;
          admin?: { name?: string; avatar?: string | null };
        };
        if (data.ok && data.admin) {
          if (data.admin.name) setName(data.admin.name);
          if (data.admin.avatar) {
            setAvatar(data.admin.avatar);
            window.localStorage.setItem(
              AVATAR_CACHE_KEY,
              data.admin.avatar,
            );
            return;
          }
        }
      } catch {
        // Không tải được từ database thì dùng bản lưu tạm ở trình duyệt.
      }
      try {
        const cached = window.localStorage.getItem(AVATAR_CACHE_KEY);
        if (cached) setAvatar(cached);
      } catch {
        // Không đọc được localStorage thì giữ logo mặc định.
      }
    })();
  }, []);

  async function saveAvatar(next: string | null) {
    if (!email) return;
    setSaving(true);
    setNotice("");
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, avatar: next }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        needsMigration?: boolean;
      };
      if (data.ok) {
        setAvatar(next);
        try {
          if (next) window.localStorage.setItem(AVATAR_CACHE_KEY, next);
          else window.localStorage.removeItem(AVATAR_CACHE_KEY);
        } catch {
          // Không lưu được cache thì thôi, database đã lưu rồi.
        }
        setNotice(
          next ? "Đã đổi logo tài khoản." : "Đã xóa logo, về mặc định.",
        );
        return;
      }
      // Database chưa có cột avatar — lưu tạm vào trình duyệt này.
      if (data.needsMigration) {
        setAvatar(next);
        try {
          if (next) window.localStorage.setItem(AVATAR_CACHE_KEY, next);
          else window.localStorage.removeItem(AVATAR_CACHE_KEY);
        } catch {
          // Không lưu được cache thì thôi.
        }
        setNotice(
          "Đã lưu logo trên trình duyệt này. Để logo hiện trên mọi trình duyệt, hãy chạy lệnh ALTER TABLE admins ADD COLUMN avatar LONGTEXT NULL; trong MySQL Workbench.",
        );
        return;
      }
      setNotice("Không lưu được logo. Hãy thử lại.");
    } catch {
      setNotice("Lỗi kết nối. Hãy kiểm tra MySQL rồi thử lại.");
    } finally {
      setSaving(false);
      setMenuOpen(false);
    }
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice("Vui lòng chọn file ảnh.");
      setMenuOpen(false);
      return;
    }
    try {
      const dataUrl = await downscaleImage(file);
      await saveAvatar(dataUrl);
    } catch {
      setNotice("Không đọc được file ảnh. Hãy chọn file khác.");
      setMenuOpen(false);
    }
  }

  if (!email) return null;

  const initial = (name.trim().charAt(0) || "Q").toUpperCase();

  return (
    <div className="relative">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => {
              setNotice("");
              setMenuOpen((v) => !v);
            }}
            title="Bấm để đổi logo tài khoản"
            aria-label="Đổi logo tài khoản"
            className="block h-12 w-12 overflow-hidden rounded-full bg-[#FFD9A0] text-xl font-black text-[#241208] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#FFD9A0]/60"
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Logo tài khoản quản trị"
                className="h-12 w-12 object-cover"
              />
            ) : (
              initial
            )}
          </button>
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#241208] bg-[#FFD9A0] text-[11px] font-black leading-none text-[#241208]"
          >
            ✎
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#EADBC6]">{name}</p>
          <p className="truncate text-xs text-[#EADBC6]/70">{email}</p>
        </div>
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute left-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-[#EADBC6]/20 bg-[#241208] shadow-lg">
            <button
              type="button"
              disabled={saving}
              onClick={() => fileRef.current?.click()}
              className="block w-full px-4 py-2.5 text-left text-sm font-bold text-[#EADBC6] transition hover:bg-white/10 disabled:opacity-50"
            >
              {saving ? "Đang lưu…" : "Đổi logo"}
            </button>
            {avatar && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveAvatar(null)}
                className="block w-full border-t border-[#EADBC6]/10 px-4 py-2.5 text-left text-sm font-bold text-red-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                Xóa logo
              </button>
            )}
          </div>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {notice && (
        <p
          role="status"
          className="mt-2 max-w-md rounded-xl border border-[#FFD9A0]/40 bg-[#FFD9A0]/10 px-3 py-2 text-xs font-semibold leading-relaxed text-[#FFD9A0]"
        >
          {notice}
        </p>
      )}
    </div>
  );
}
