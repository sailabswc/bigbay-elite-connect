import React from "react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";

export const initials = (name) =>
  (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

export const shortTime = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });
  }
  if ((now - date) / 86400000 < 7) {
    return date.toLocaleDateString("en-ZA", { weekday: "short" });
  }
  return date.toLocaleDateString("en-ZA", { day: "2-digit", month: "2-digit" });
};

export default function ChatRoomList({ rooms, activeId, onSelect, loading, unreadIds, currentUserId }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {rooms.length} conversation{rooms.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {loading && (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No conversations yet. Tap “New chat” to start one.
          </div>
        )}

        {rooms.map((room) => {
          const unread = unreadIds.has(room.id);
          const preview = room.last_message
            ? (room.last_sender_id === currentUserId ? "You: " : "") + room.last_message
            : room.topic || "No messages yet";
          return (
            <button
              key={room.id}
              onClick={() => onSelect(room.id)}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                activeId === room.id ? "bg-secondary" : "hover:bg-muted"
              )}
            >
              {room.avatar_url ? (
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                  <Image src={room.avatar_url} className="h-full w-full object-cover" alt={room.name} />
                </div>
              ) : (
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full ocean-gradient text-sm font-semibold text-white">
                  {initials(room.name)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{room.name}</span>
                  <span
                    className={cn(
                      "shrink-0 text-[11px]",
                      unread ? "font-semibold text-primary" : "text-muted-foreground"
                    )}
                  >
                    {shortTime(room.last_message_at)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">{preview}</span>
                  {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}