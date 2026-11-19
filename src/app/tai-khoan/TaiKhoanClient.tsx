"use client";

import { useEffect, useState } from "react";
import PasswordField from "@/components/PasswordField";
import {
  changeCustomerPassword,
  getCustomerSession,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  updateCustomer,
  type Customer,
} from "@/lib/customer-auth";
import { redirectAfterLogin } from "@/lib/auth-guard";

// Trang /tai-khoan ĐỘC LẬP (kiểu full-screen modal / standalone page,
// giống trang /account mẫu): KHÔNG có Header, Footer hay nút nổi —
// toàn màn hình chỉ có một khung trắng tối giản ở chính giữa để
// Đăng nhập / Đăng ký (hoặc xem tài khoản khi đã đăng nhập).
// (Tài khoản khách lưu trong MySQL, kiểm tra qua API —
// xem src/lib/customer-auth.ts.)

// Kiểu ô nhập chữ trên khung trắng.
const lightLabel = "mb-1.5 block text-sm font-bold text-[#241208]";
const lightInput =
  "w-full rounded-lg border border-[#241208]/20 bg-white px-4 py-2.5 text-[15px] text-[#241208] placeholder:text-[#241208]/40 outline-none transition focus:border-[#6B3A2A] focus:ring-2 focus:ring-[#6B3A2A]/20";
const submitBtn =
  "w-full rounded-full bg-[#241208] px-6 py-3 text-base font-bold text-[#EADBC6] shadow transition hover:bg-[#3E241A]";

export default function TaiKhoanClient() {
  const [user, setUser] = useState<Customer | null>(null);
  const [tab, setTab] = useState<"login" | "register">("login");

  // Đăng nhập
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Đăng ký
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Sửa thông tin tài khoản
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Đổi mật khẩu (mục gấp gọn, bấm mới mở form)
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState("");

  // Phiên đăng nhập chỉ kiểm tra sau khi trang đã tải ở trình duyệt
  // (localStorage không có lúc build tĩnh). Mặc định hiện form đăng nhập
  // để form có sẵn trong HTML tĩnh; có phiên thì đổi sang trang tài khoản.
  useEffect(() => {
    void (async () => {
      const session = await getCustomerSession();
      setUser(session);
      // Đã đăng nhập sẵn mà còn địa chỉ cần quay về (vd: khách bấm nút
      // Báo giá / BOOK NOW rồi đăng nhập ở tab khác) thì đưa về đó luôn.
      if (session) redirectAfterLogin();
    })();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const result = await loginCustomer(loginEmail, loginPassword);
    if (!result.ok || !result.customer) {
      setLoginError(result.error ?? "Đăng nhập không thành công.");
      return;
    }
    setLoginError("");
    setLoginPassword("");
    setUser(result.customer);
    // Đăng nhập xong: nếu khách bấm nút Báo giá / BOOK NOW trước đó
    // thì tự đưa về đúng trang báo giá (mẫu đã điền sẵn), không có
    // thì ở lại trang tài khoản như bình thường.
    redirectAfterLogin();
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const result = await registerCustomer({
      name,
      email,
      phone,
      address: "",
      password,
      confirm,
    });
    if (!result.ok || !result.customer) {
      setRegError(result.error ?? "Đăng ký không thành công.");
      setRegSuccess("");
      return;
    }
    setRegError("");
    setRegSuccess("Đăng ký thành công! Tài khoản đã được tạo và đăng nhập.");
    setPassword("");
    setConfirm("");
    setUser(result.customer);
    // Đăng ký xong là tự đăng nhập: nếu khách bấm nút Báo giá /
    // BOOK NOW trước đó thì tự đưa về đúng trang báo giá
    // (mẫu đã điền sẵn), không có thì ở lại trang tài khoản.
    redirectAfterLogin();
  }

  function startEditing() {
    if (!user) return;
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditError("");
    setEditSuccess("");
    setEditing(true);
  }

  async function handleEditInfo(e: React.FormEvent) {
    e.preventDefault();
    const result = await updateCustomer({
      name: editName,
      phone: editPhone,
      // Không còn nhập địa chỉ ở form: giữ nguyên địa chỉ đã lưu (nếu có).
      address: user?.address ?? "",
    });
    if (!result.ok || !result.customer) {
      setEditError(result.error ?? "Lưu không thành công.");
      setEditSuccess("");
      return;
    }
    setEditError("");
    setEditSuccess("Đã lưu thông tin tài khoản.");
    setEditing(false);
    setUser(result.customer);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    const result = await changeCustomerPassword(currentPw, newPw, confirmPw);
    if (!result.ok) {
      setCpError(result.error ?? "Đổi mật khẩu không thành công.");
      setCpSuccess("");
      return;
    }
    setCpError("");
    setCpSuccess("Đổi mật khẩu thành công.");
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  }

  function handleLogout() {
    logoutCustomer();
    setUser(null);
    setTab("login");
    setEditing(false);
    setShowChangePw(false);
    setLoginEmail("");
    setLoginPassword("");
    setLoginError("");
    setRegError("");
    setRegSuccess("");
    setEditError("");
    setEditSuccess("");
    setCpError("");
    setCpSuccess("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sand px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8">
        {/* Đầu khung: tiêu đề "My Account" bên trái, nút × bên phải
            để đóng và về trang chủ. */}
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-black text-[#241208]">My Account</h1>
          <a
            href="/"
            aria-label="Đóng và về trang chủ"
            title="Đóng và về trang chủ"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-3xl leading-none text-[#241208]/40 transition hover:bg-[#241208]/5 hover:text-[#241208]"
          >
            ×
          </a>
        </div>

        {user ? (
          <>
            {/* ---------- Đã đăng nhập: thông tin tài khoản ---------- */}
            <p className="mt-1 text-base font-bold text-[#241208]">
              Xin chào, {user.name}
            </p>
            <p className="mt-0.5 text-sm text-[#241208]/55">{user.email}</p>

            {editing ? (
              <form onSubmit={handleEditInfo} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="edit-name" className={lightLabel}>
                    Họ và tên
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoComplete="name"
                    required
                    className={lightInput}
                  />
                </div>
                <div>
                  <label htmlFor="edit-phone" className={lightLabel}>
                    Số điện thoại
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    autoComplete="tel"
                    required
                    className={lightInput}
                  />
                </div>
                <p className="text-sm text-[#241208]/55">
                  Email <span className="font-semibold text-[#241208]">{user.email}</span> là
                  tên đăng nhập, không đổi được.
                </p>
                {editError && (
                  <p
                    role="alert"
                    className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                  >
                    {editError}
                  </p>
                )}
                <div className="flex gap-3">
                  <button type="submit" className={`${submitBtn} flex-1`}>
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="flex-1 rounded-full border-2 border-[#241208]/20 px-6 py-3 text-base font-bold text-[#241208] transition hover:border-[#241208]"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <>
                <dl className="mt-6 divide-y divide-[#241208]/10 border-y border-[#241208]/10">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-sm font-bold text-[#241208]/50">Họ và tên</dt>
                    <dd className="text-right text-[15px] font-semibold text-[#241208]">
                      {user.name}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-sm font-bold text-[#241208]/50">Số điện thoại</dt>
                    <dd className="text-right text-[15px] font-semibold text-[#241208]">
                      {user.phone}
                    </dd>
                  </div>
                </dl>
                {editSuccess && (
                  <p
                    role="status"
                    className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                  >
                    {editSuccess}
                  </p>
                )}
                <button
                  type="button"
                  onClick={startEditing}
                  className="mt-4 w-full rounded-full border-2 border-[#241208]/20 px-6 py-2.5 text-sm font-bold text-[#241208] transition hover:border-[#241208]"
                >
                  Chỉnh sửa thông tin
                </button>
              </>
            )}

            {/* Đổi mật khẩu (mục gấp gọn) */}
            <div className="mt-6 border-t border-[#241208]/10 pt-5">
              <button
                type="button"
                onClick={() => setShowChangePw((v) => !v)}
                aria-expanded={showChangePw}
                className="flex w-full items-center justify-between text-left text-base font-black text-[#241208]"
              >
                Đổi mật khẩu
                <span className="text-xl font-bold text-[#241208]/40">
                  {showChangePw ? "−" : "+"}
                </span>
              </button>
              {showChangePw && (
                <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                  <PasswordField
                    id="cp-current"
                    label="Mật khẩu hiện tại"
                    value={currentPw}
                    onChange={setCurrentPw}
                    placeholder="Nhập mật khẩu hiện tại"
                    autoComplete="current-password"
                    variant="light"
                  />
                  <PasswordField
                    id="cp-new"
                    label="Mật khẩu mới"
                    value={newPw}
                    onChange={setNewPw}
                    placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                    autoComplete="new-password"
                    variant="light"
                  />
                  <PasswordField
                    id="cp-confirm"
                    label="Nhập lại mật khẩu mới"
                    value={confirmPw}
                    onChange={setConfirmPw}
                    placeholder="Nhập lại mật khẩu mới"
                    autoComplete="new-password"
                    variant="light"
                  />
                  {cpError && (
                    <p
                      role="alert"
                      className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                    >
                      {cpError}
                    </p>
                  )}
                  {cpSuccess && (
                    <p
                      role="status"
                      className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                    >
                      {cpSuccess}
                    </p>
                  )}
                  <button type="submit" className={submitBtn}>
                    Đổi mật khẩu
                  </button>
                </form>
              )}
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-6 w-full rounded-full border-2 border-[#241208] px-6 py-3 text-base font-bold text-[#241208] transition hover:bg-[#241208] hover:text-[#EADBC6]"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            {/* ---------- Chưa đăng nhập: 2 tab Đăng nhập / Đăng ký ---------- */}
            <div
              className="mt-5 grid grid-cols-2 border-b border-[#241208]/10"
              role="tablist"
              aria-label="Tài khoản"
            >
              <button
                type="button"
                role="tab"
                aria-selected={tab === "login"}
                onClick={() => {
                  setTab("login");
                  setRegError("");
                  setRegSuccess("");
                }}
                className={`-mb-px border-b-2 py-3 text-base transition ${
                  tab === "login"
                    ? "border-[#241208] font-bold text-[#241208]"
                    : "border-transparent font-semibold text-[#241208]/45 hover:text-[#241208]"
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "register"}
                onClick={() => {
                  setTab("register");
                  setLoginError("");
                }}
                className={`-mb-px border-b-2 py-3 text-base transition ${
                  tab === "register"
                    ? "border-[#241208] font-bold text-[#241208]"
                    : "border-transparent font-semibold text-[#241208]/45 hover:text-[#241208]"
                }`}
              >
                Đăng ký
              </button>
            </div>

            <div className="pt-6">
              {tab === "login" ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="login-email" className={lightLabel}>
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Nhập email của bạn"
                      autoComplete="email"
                      required
                      className={lightInput}
                    />
                  </div>
                  <PasswordField
                    id="login-password"
                    label="Mật khẩu"
                    value={loginPassword}
                    onChange={setLoginPassword}
                    placeholder="Nhập mật khẩu"
                    autoComplete="current-password"
                    variant="light"
                  />
                  {loginError && (
                    <p
                      role="alert"
                      className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                    >
                      {loginError}
                    </p>
                  )}
                  <button type="submit" className={submitBtn}>
                    Đăng nhập
                  </button>
                  <p className="text-center text-sm text-[#241208]/55">
                    Chưa có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("register")}
                      className="font-bold text-[#6B3A2A] underline underline-offset-2 hover:text-[#241208]"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label htmlFor="reg-name" className={lightLabel}>
                      Họ và tên
                    </label>
                    <input
                      id="reg-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nhập họ và tên"
                      autoComplete="name"
                      required
                      className={lightInput}
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-email" className={lightLabel}>
                      Email
                    </label>
                    <input
                      id="reg-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Nhập email của bạn"
                      autoComplete="email"
                      required
                      className={lightInput}
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-phone" className={lightLabel}>
                      Số điện thoại
                    </label>
                    <input
                      id="reg-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Nhập số điện thoại"
                      autoComplete="tel"
                      required
                      className={lightInput}
                    />
                  </div>
                  <PasswordField
                    id="reg-password"
                    label="Mật khẩu"
                    value={password}
                    onChange={setPassword}
                    placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
                    autoComplete="new-password"
                    variant="light"
                  />
                  <PasswordField
                    id="reg-confirm"
                    label="Nhập lại mật khẩu"
                    value={confirm}
                    onChange={setConfirm}
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                    variant="light"
                  />
                  {regError && (
                    <p
                      role="alert"
                      className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
                    >
                      {regError}
                    </p>
                  )}
                  {regSuccess && (
                    <p
                      role="status"
                      className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700"
                    >
                      {regSuccess}
                    </p>
                  )}
                  <button type="submit" className={submitBtn}>
                    Đăng ký
                  </button>
                  <p className="text-center text-sm text-[#241208]/55">
                    Đã có tài khoản?{" "}
                    <button
                      type="button"
                      onClick={() => setTab("login")}
                      className="font-bold text-[#6B3A2A] underline underline-offset-2 hover:text-[#241208]"
                    >
                      Đăng nhập
                    </button>
                  </p>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
