import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "./ChatRoomList";

export default function NewChatDialog({ open, onOpenChange, users, onStartDirect, onCreateGroup }) {
  const [tab, setTab] = useState("direct");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (!open) {
      setTab("direct");
      setQuery("");
      setSelected([]);
      setGroupName("");
    }
  }, [open]);

  const filtered = users.filter((u) =>
    `${u.full_name || ""} ${u.email || ""}`.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const selectedUsers = users.filter((u) => selected.includes(u.id));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-lg font-semibold">New conversation</div>
            <div className="text-sm text-muted-foreground">Start a private chat or create a group chatroom.</div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange?.(false)}
            className="rounded-md border border-border px-2 py-1 text-sm"
          >
            Close
          </button>
        </div>

        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {[
            { id: "direct", label: "Private chat" },
            { id: "group", label: "Group chatroom" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                tab === t.id ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>

        {tab === "group" && (
          <div className="mt-4">
            <input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Chatroom name"
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        )}

        <div className="mt-4 max-h-64 space-y-1 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">No people found.</div>
          )}
          {filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => (tab === "direct" ? onStartDirect(u) : toggle(u.id))}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted"
            >
              {tab === "group" && (
                <input
                  type="checkbox"
                  checked={selected.includes(u.id)}
                  onChange={() => toggle(u.id)}
                  className="h-4 w-4 rounded border-input"
                />
              )}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                {initials(u.full_name || u.email)}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{u.full_name || u.email}</div>
                <div className="truncate text-xs text-muted-foreground">{u.email}</div>
              </div>
            </button>
          ))}
        </div>

        {tab === "group" && (
          <button
            type="button"
            onClick={() => {
              onCreateGroup(groupName, selectedUsers);
              onOpenChange?.(false);
            }}
            disabled={!groupName.trim() || selected.length === 0}
            className="mt-4 w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Create chatroom
          </button>
        )}
      </div>
    </div>
  );
}