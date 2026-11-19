"use client";

import { useEffect, useRef, useState } from "react";
import AdminNav from "../AdminNav";
import { getSession, type AdminUser } from "@/lib/admin-auth";
import {
  addMessage,
  formatChatTime,
  loadThreads,
  markAdminRead,
  type ChatThread,
} from "@/lib/chat";

// Trang /admin/tin-nhan: quản trị xem và trả lời tin nhắn trò chuyện
// của khách. Tin nhắn lưu trong MySQL (xem src/lib/chat.ts).
export default function MessagesClient() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  // Đoạn chat cần mở sẵn khi vào từ thông báo
  // (/admin/tin-nhan?thread=<id>).
  const [pendingThread, setPendingThread] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setUser(await getSession());
      await refresh();
    })();
    try {
      const t = new URLSearchParams(window.location.search).get("thread");
      if (t) setPendingThread(t);
    } catch {
      // Không đọc được query thì thôi — quản trị chọn đoạn chat tay.
    }
  }, []);

  // Mở sẵn đoạn chat từ thông báo ngay khi danh sách đã tải xong.
  useEffect(() => {
    if (!pendingThread || threads.length === 0) return;
    const found = threads.find((t) => t.id === pendingThread);
    setPendingThread(null);
    if (found) {
      setOpenId(found.id);
      void (async () => {
        await markAdminRead(found.id);
        await refresh();
      })();
    }
  }, [threads, pendingThread]);

  async function refresh() {
    const all = await loadThreads();
    all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    setThreads(all);
  }

  // Tự làm mới mỗi 5 giây để thấy tin nhắn mới của khách.
  useEffect(() => {
    const timer = setInterval(() => {
      void refresh();
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const open = threads.find((t) => t.id === openId) || null;

  // Sang từ trang Khách hàng (?thread=<id>): mở đúng đoạn chat của
  // khách đó ngay khi danh sách đã tải xong. Chỉ làm một lần.
  const threadParamHandled = useRef(false);
  useEffect(() => {
    if (threadParamHandled.current || threads.length === 0) return;
    const id = new URLSearchParams(window.location.search).get("thread");
    if (!id) {
      threadParamHandled.current = true;
      return;
    }
    const target = threads.find((t) => t.id === id);
    if (!target) return;
    threadParamHandled.current = true;
    void handleOpen(target.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open?.messages.length, openId]);

  async function handleOpen(id: string) {
    setOpenId(id);
    await markAdminRead(id);
    await refresh();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!openId || !reply.trim()) return;
    await addMessage(openId, "admin", reply);
    setReply("");
    await refresh();
  }

  if (!user) {
    return (
      <main className="bg-[#241208] py-14">
        <div className="mx-auto max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-[#EADBC6]/20 bg-white/5 p-6 sm:p-8">
            <h1 className="text-2xl font-black text-[#EADBC6]">
              Bạn chưa đăng nhập
            </h1>
            <p className="mt-3 leading-relaxed text-[#EADBC6]/70">
              Hãy đăng nhập tài khoản quản trị để xem tin nhắn của khách hàng.
            </p>
            <a
              href="/admin"
              className="mt-6 inline-block rounded-full bg-[#FFD9A0] px-6 py-3 text-sm font-bold text-[#241208] transition hover:opacity-90"
            >
              Đi tới trang đăng nhập →
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[#241208] py-14 md:pl-[232px]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <a href="/admin" className="font-bold text-[#FFD9A0] hover:underline">
          ← Về trang quản trị
        </a>
        <AdminNav active="tin-nhan" />
        {threads.length > 0 && (
          <div className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr]">
            {/* Danh sách đoạn chat */}
            <div className="space-y-3">
              {threads.map((t) => {
                const last = t.messages[t.messages.length - 1];
                const active = t.id === openId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleOpen(t.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      active
                        ? "border-[#FFD9A0] bg-white/10"
                        : "border-[#EADBC6]/20 bg-white/5 hover:border-[#FFD9A0]/60"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-base font-bold text-[#EADBC6]">
                        {t.name}
                      </span>
                      {t.unreadAdmin && (
                        <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                          Mới
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[#EADBC6]/60">
                      {t.email} • {t.subject}
                    </span>
                    <span className="mt-2 block truncate text-sm text-[#EADBC6]/80">
                      {last ? last.body : ""}
                    </span>
                    <span className="mt-1 block text-[11px] text-[#EADBC6]/50">
                      {formatChatTime(t.updatedAt)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Khung xem + trả lời */}
            <div className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-[#EADBC6]/20 bg-white">
              {open ? (
                <>
                  <div className="border-b border-[#EADBC6] bg-[#FAF6F0] px-4 py-3">
                    <p className="text-base font-bold text-[#241208]">
                      {open.name} — {open.subject}
                    </p>
                    <p className="text-xs text-neutral-500">{open.email}</p>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {open.messages.map((m, i) => (
                      <div key={i} className="flex flex-col">
                        <div
                          className={
                            m.sender === "admin"
                              ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#241208] px-3.5 py-2.5 text-sm leading-relaxed text-[#EADBC6]"
                              : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-neutral-100 px-3.5 py-2.5 text-sm leading-relaxed text-neutral-800"
                          }
                        >
                          {m.body}
                        </div>
                        <span
                          className={
                            m.sender === "admin"
                              ? "mt-1 text-right text-[11px] text-neutral-400"
                              : "mt-1 text-left text-[11px] text-neutral-400"
                          }
                        >
                          {m.sender === "admin" ? "Quản trị" : open.name} •{" "}
                          {formatChatTime(m.createdAt)}
                        </span>
                      </div>
                    ))}
                    <div ref={endRef} />
                  </div>
                  <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2 border-t border-[#EADBC6] p-3"
                  >
                    <input
                      type="text"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Trả lời khách hàng…"
                      aria-label="Trả lời khách hàng"
                      className="min-w-0 flex-1 rounded-full border border-[#EADBC6] px-4 py-2.5 text-sm text-neutral-800 outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/30"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-full bg-[#241208] px-5 py-2.5 text-sm font-bold text-[#EADBC6] transition hover:opacity-90"
                    >
                      Gửi
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center p-8 text-center">
                  <p className="text-sm leading-relaxed text-neutral-500">
                    Chọn một đoạn chat bên trái để xem và trả lời khách hàng.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
