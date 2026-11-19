"use client";

import { useEffect, useState } from "react";
import AdminNav from "../AdminNav";
import PasswordField from "@/components/PasswordField";
import {
  changePassword,
  getSession,
  type AdminUser,
} from "@/lib/admin-auth";

// Trang /admin/doi-mat-khau: chỉ dùng được khi đã đăng nhập.
export default function ChangePasswordClient() {
  const [user, setUser] = useState<AdminUser | null>(null);
  // `checked` = đã kiểm tra phiên ở trình duyệt. Trước khi kiểm tra xong,
  // cứ hiện form (để form có sẵn trong HTML tĩnh); kiểm tra xong mà chưa
  // đăng nhập thì đổi sang thông báo yêu cầu đăng nhập.
  const [checked, setChecked] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void (async () => {
      setUser(await getSession());
      setChecked(true);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (next.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (next !== confirm) {
      setError("Nhập lại mật khẩu mới chưa khớp. Hãy nhập lại cho giống.");
      return;
    }

    const result = await changePassword(current, next);
    if (!result.ok) {
      setError(result.error ?? "Đổi mật khẩu thất bại. Hãy thử lại.");
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    setSuccess("Đổi mật khẩu thành công.");
  }

  const form = (
    <main className="bg-[#241208] py-14 md:pl-[232px]">
      <div className="mx-auto max-w-md px-4 sm:px-6">
        <a
          href="/admin"
          className="font-bold text-[#FFD9A0] hover:underline"
        >
          ← Quay lại trang quản trị
        </a>
        <AdminNav active="doi-mat-khau" />

        <div className="mt-6 rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-6 sm:p-8">
          <h1 className="text-2xl font-black text-[#EADBC6]">
            Đổi mật khẩu
          </h1>
          {user && (
            <p className="mt-2 text-sm text-[#EADBC6]/70">
              Tài khoản: <span className="font-bold">{user.email}</span>
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <PasswordField
              id="current-password"
              label="Mật khẩu hiện tại"
              value={current}
              onChange={setCurrent}
              placeholder="Nhập mật khẩu hiện tại"
              autoComplete="current-password"
            />

            <PasswordField
              id="new-password"
              label="Mật khẩu mới (tối thiểu 6 ký tự)"
              value={next}
              onChange={setNext}
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
            />

            <PasswordField
              id="confirm-password"
              label="Nhập lại mật khẩu mới"
              value={confirm}
              onChange={setConfirm}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-400/50 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-300"
              >
                {error}
              </p>
            )}

            {success && (
              <p
                role="status"
                className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-300"
              >
                {success}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-full bg-[#FFD9A0] px-6 py-3.5 text-base font-bold text-[#241208] shadow transition hover:opacity-90"
            >
              ĐỔI MẬT KHẨU
            </button>
          </form>
        </div>
      </div>
    </main>
  );

  // Chưa kiểm tra xong phiên thì cứ hiện form (để form có sẵn trong HTML
  // tĩnh); kiểm tra xong mà chưa đăng nhập thì hiện thông báo bên dưới.
  if (!checked) return form;

  if (!user) {
    return (
      <main className="bg-[#241208] py-14">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-6 text-center sm:p-8">
            <h1 className="text-2xl font-black text-[#EADBC6]">
              Bạn chưa đăng nhập
            </h1>
            <p className="mt-3 text-base leading-relaxed text-[#EADBC6]/70">
              Hãy đăng nhập tài khoản quản trị trước khi đổi mật khẩu.
            </p>
            <a
              href="/admin"
              className="mt-6 inline-block rounded-full bg-[#FFD9A0] px-6 py-3 text-sm font-bold text-[#241208] shadow transition hover:opacity-90"
            >
              Đến trang đăng nhập
            </a>
          </div>
        </div>
      </main>
    );
  }

  return form;
}
