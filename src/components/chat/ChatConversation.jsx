import React, { useEffect, useMemo, useRef } from "react";
import { ArrowLeft, MessagesSquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import MessageBubble from "./MessageBubble";
import ChatComposer from "./ChatComposer";
import { initials } from "./ChatRoomList";

const dayLabel = (d) => {
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });
};

export default function ChatConversation({ room, messages, currentUser, loading, onSend, onBack }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, room?.id]);

  const rows = useMemo(() => {
    const out = [];
    let lastDay = null;
    let lastSender = null;
    messages.forEach((m) => {
      const day = new Date(m.created_date).toDateString();
      if (day !== lastDay) {
        out.push({ kind: "day", key: `day-${day}`, label: dayLabel(m.created_date) });
        lastDay = day;
        lastSender = null;
      }
      out.push({
        kind: "msg",
        key: m.id,
        message: m,
        showSender: room?.kind === "group" && m.sender_id !== lastSender,
      });
      lastSender = m.sender_id;
    });
    return out;
  }, [messages, room]);

  if (!room) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-muted/30 p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card shadow-sm">
          <MessagesSquare className="h-6 w-6 text-primary" />
        </div>
        <div>
          <div className="font-heading font-semibold">Select a conversation</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a chatroom or start a private chat to begin.
          </p>
        </div>
      </div>
    );
  }

  const subtitle =
    room.kind === "direct" ? "Private chat" : `${(room.member_ids || []).length} members`;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border bg-card px-3 py-2.5">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ocean-gradient text-xs font-semibold text-white">
          {initials(room.name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium leading-tight">{room.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">{subtitle}</div>
        </div>
        <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto scrollbar-thin bg-muted/30 px-3 py-4">
        {loading && (
          <div className="py-6 text-center text-xs text-muted-foreground">Loading messages…</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No messages yet. Say hello 👋
          </div>
        )}
        {rows.map((row) =>
          row.kind === "day" ? (
            <div key={row.key} className="flex justify-center py-1">
              <span className="rounded-full bg-card px-3 py-0.5 text-[11px] font-medium text-muted-foreground shadow-sm">
                {row.label}
              </span>
            </div>
          ) : (
            <MessageBubble
              key={row.key}
              message={row.message}
              isMine={row.message.sender_id === currentUser?.id}
              showSender={row.showSender}
            />
          )
        )}
        <div ref={endRef} />
      </div>

      <ChatComposer onSend={onSend} />
    </div>
  );
}