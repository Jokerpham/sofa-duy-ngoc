"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  CHAT_EMAIL_KEY,
  addMessage,
  createThread,
  formatChatTime,
  loadThreads,
  markCustomerRead,
  type ChatThread,
} from "@/lib/chat";

// Widget chat nổi cho khách — giống nút chat xanh trong ảnh người dùng gửi.
// Chỉ hiện trên các trang shop, KHÔNG hiện trên /admin.
export default function FloatingChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"start" | "list" | "thread">("start");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  // Nạp email đã lưu + các đoạn chat của email đó (từ API MySQL).
  // Chỉ đặt view "list" 1 lần lúc mở trang (nếu đã có đoạn chat);
  // các lần làm mới sau đó KHÔNG được đổi view, để khách đang nhắn
  // trong 1 đoạn chat không bị bật ngược về danh sách.
  useEffect(() => {
    const savedEmail =
      window.localStorage.getItem(CHAT_EMAIL_KEY) || "";
    if (savedEmail) setEmail(savedEmail);
    void refreshThreads(savedEmail).then((mine) => {
      if (savedEmail && mine.length > 0) setView("list");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chỉ cập nhật dữ liệu đoạn chat, KHÔNG đổi view.
  async function refreshThreads(forEmail?: string): Promise<ChatThread[]> {
    const mine = await loadThreads(forEmail);
    setThreads(mine);
    return mine;
  }

  // Tự làm mới mỗi 5 giây khi khung chat đang mở.
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      void refreshThreads(email || undefined).then((mine) => {
        if (activeId) {
          const active = mine.find((t) => t.id === activeId);
          if (active?.unreadCustomer) void markCustomerRead(activeId);
        }
      });
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeId, email]);

  const active = threads.find((t) => t.id === activeId) || null;

  // Tự cuộn xuống tin nhắn mới nhất.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.messages.length, view, open]);

  if (pathname?.startsWith("/admin")) return null;

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !firstMessage.trim()) return;
    const thread = await createThread(name, email, "Trò chuyện với shop", firstMessage);
    if (!thread) return;
    window.localStorage.setItem(CHAT_EMAIL_KEY, email.trim());
    setThreads([thread]);
    setActiveId(thread.id);
    setFirstMessage("");
    setView("thread");
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!activeId || !reply.trim()) return;
    await addMessage(activeId, "customer", reply);
    setReply("");
    const mine = await refreshThreads(email || undefined);
    const updated = mine.find((t) => t.id === activeId);
    if (updated) setThreads(mine);
  }

  function openThread(id: string) {
    setActiveId(id);
    void markCustomerRead(id);
    setView("thread");
  }

  function backToList() {
    setActiveId(null);
    void refreshThreads(email || undefined);
    setView(threads.length > 0 ? "list" : "start");
  }

  return (
    <>
      {/* Nút chat tròn màu xanh — nằm trên nút Facebook, dưới nút cuộn đầu trang.
          Cỡ 56×56 (h-14 w-14), chung với 3 nút nổi còn lại, khoảng cách đều 16px. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Đóng khung trò chuyện" : "Trò chuyện với Sofa Duy Ngọc"}
        className="fixed bottom-[168px] right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition hover:scale-105 hover:bg-[#1EB856]"
      >
        {open ? (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 5.94 2 10.89c0 2.87 1.53 5.42 3.91 7.06-.1.82-.5 2.32-1.07 3.4-.13.24 0 .52.26.6.09.03.18.04.27.04.2 0 .4-.09.54-.25.83-.97 1.95-2.06 2.63-2.5.78.19 1.6.29 2.46.29 5.52 0 10-3.94 10-8.89S17.52 2 12 2zm-2.2 10.3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4.4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4.4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
          </svg>
        )}
      </button>

      {open && (
        <div className="fixed bottom-[224px] right-6 z-50 flex h-[480px] w-[340px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[#EADBC6] bg-white shadow-2xl max-h-[calc(100vh-180px)]">
          {/* Đầu khung chat */}
          <div className="flex items-center justify-between bg-[#241208] px-4 py-3">
            <div>
              <p className="text-base font-bold text-[#EADBC6]">
                Trò chuyện với Sofa Duy Ngọc
              </p>
              <p className="text-xs text-[#EADBC6]/70">
                Shop sẽ trả lời bạn sớm nhất
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng khung trò chuyện"
              className="text-xl font-bold leading-none text-[#EADBC6] hover:text-[#FFD9A0]"
            >
              ✕
            </button>
          </div>

          {/* Danh sách đoạn chat của khách */}
          {view === "list" && (
            <div className="flex flex-1 flex-col overflow-y-auto p-4">
              <p className="text-sm font-bold text-[#241208]">
                Tin nhắn của bạn ({email})
              </p>
              <div className="mt-3 space-y-2">
                {threads.map((t) => {
                  const last = t.messages[t.messages.length - 1];
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => openThread(t.id)}
                      className="w-full rounded-xl border border-[#EADBC6] bg-[#FAF6F0] px-3 py-3 text-left transition hover:border-[#C9A227]"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-bold text-[#241208]">
                          {t.subject}
                        </span>
                        {t.unreadCustomer && (
                          <span className="shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-bold text-white">
                            Mới
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block truncate text-xs text-neutral-500">
                        {last ? last.body : ""}
                      </span>
                      <span className="mt-1 block text-[11px] text-neutral-400">
                        {formatChatTime(t.updatedAt)}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setView("start")}
                className="mt-4 rounded-full bg-[#241208] px-5 py-2.5 text-sm font-bold text-[#EADBC6] transition hover:opacity-90"
              >
                ＋ Gửi tin nhắn mới
              </button>
            </div>
          )}

          {/* Form bắt đầu trò chuyện */}
          {view === "start" && (
            <form onSubmit={handleStart} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-sm leading-relaxed text-neutral-600">
                Nhập tên và email của bạn để bắt đầu trò chuyện với xưởng.
                Tin nhắn của bạn sẽ được quản trị viên trả lời tại đây.
              </p>
              <div>
                <label htmlFor="chat-name" className="mb-1 block text-sm font-bold text-[#241208]">
                  Họ và tên *
                </label>
                <input
                  id="chat-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên của bạn"
                  required
                  className="w-full rounded-xl border border-[#EADBC6] px-3 py-2.5 text-sm outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/30"
                />
              </div>
              <div>
                <label htmlFor="chat-email" className="mb-1 block text-sm font-bold text-[#241208]">
                  Email *
                </label>
                <input
                  id="chat-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@vidu.com"
                  required
                  className="w-full rounded-xl border border-[#EADBC6] px-3 py-2.5 text-sm outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/30"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="chat-first" className="mb-1 block text-sm font-bold text-[#241208]">
                  Tin nhắn *
                </label>
                <textarea
                  id="chat-first"
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  placeholder="Ví dụ: Tôi muốn hỏi giá sofa da chữ L nâu đậm…"
                  rows={4}
                  required
                  className="w-full resize-none rounded-xl border border-[#EADBC6] px-3 py-2.5 text-sm outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/30"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-[#241208] px-5 py-3 text-sm font-bold text-[#EADBC6] transition hover:opacity-90"
              >
                Bắt đầu trò chuyện
              </button>
              {threads.length > 0 && (
                <button
                  type="button"
                  onClick={() => setView("list")}
                  className="text-sm font-bold text-[#6B3A2A] hover:underline"
                >
                  ← Xem lại tin nhắn cũ của tôi
                </button>
              )}
            </form>
          )}

          {/* Xem đoạn chat + nhắn tiếp */}
          {view === "thread" && active && (
            <>
              <div className="flex items-center gap-2 border-b border-[#EADBC6] bg-[#FAF6F0] px-3 py-2">
                <button
                  type="button"
                  onClick={backToList}
                  aria-label="Quay lại danh sách tin nhắn"
                  className="text-lg font-bold text-[#6B3A2A] hover:text-[#241208]"
                >
                  ←
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#241208]">
                    {active.subject}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {active.name} • {active.email}
                  </p>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto bg-white px-3 py-4">
                {active.messages.map((m, i) => (
                  <div key={i} className="flex flex-col">
                    <div
                      className={
                        m.sender === "customer"
                          ? "ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#241208] px-3.5 py-2.5 text-sm leading-relaxed text-[#EADBC6]"
                          : "mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-neutral-100 px-3.5 py-2.5 text-sm leading-relaxed text-neutral-800"
                      }
                    >
                      {m.body}
                    </div>
                    <span
                      className={
                        m.sender === "customer"
                          ? "mt-1 text-right text-[11px] text-neutral-400"
                          : "mt-1 text-left text-[11px] text-neutral-400"
                      }
                    >
                      {m.sender === "customer" ? "Bạn" : "Sofa Duy Ngọc"} •{" "}
                      {formatChatTime(m.createdAt)}
                    </span>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              <form
                onSubmit={handleSendReply}
                className="flex items-center gap-2 border-t border-[#EADBC6] bg-white p-3"
              >
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Nhắn tin cho shop…"
                  aria-label="Nhắn tin cho shop"
                  className="min-w-0 flex-1 rounded-full border border-[#EADBC6] px-4 py-2.5 text-sm outline-none focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/30"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-[#241208] px-4 py-2.5 text-sm font-bold text-[#EADBC6] transition hover:opacity-90"
                >
                  Gửi
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
