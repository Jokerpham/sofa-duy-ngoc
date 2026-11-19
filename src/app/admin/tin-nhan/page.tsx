import type { Metadata } from "next";
import MessagesClient from "./MessagesClient";

export const metadata: Metadata = {
  title: "Quản trị Sofa Duy Ngọc | DN HOME Hải Phòng",
  description:
    "Xem và trả lời tin nhắn trò chuyện của khách hàng gửi tới Xưởng Sofa Duy Ngọc (DN HOME) — Hải Phòng.",
};

export default function AdminMessagesPage() {
  return <MessagesClient />;
}
