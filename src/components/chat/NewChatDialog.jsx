import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New conversation</DialogTitle>
          <DialogDescription>Start a private chat or create a group chatroom.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {[
            { id: "direct", label: "Private chat" },
            { id: "group", label: "Group chatroom" },
          ].map((t) => (
            <button
              key={t.id}
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            className="pl-9"
          />
        </div>

        {tab === "group" && (
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Chatroom name"
          />
        )}

        <div className="max-h-64 space-y-1 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">No people found.</div>
          )}
          {filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => (tab === "direct" ? onStartDirect(u) : toggle(u.id))}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-muted"
            >
              {tab === "group" && (
                <Checkbox checked={selected.includes(u.id)} onCheckedChange={() => toggle(u.id)} />
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
          <Button
            onClick={() => onCreateGroup(groupName, selectedUsers)}
            disabled={!groupName.trim() || selected.length === 0}
          >
            Create chatroom
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}