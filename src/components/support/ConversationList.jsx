import React from "react";
import { MessageSquarePlus, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";

export default function ConversationList({ conversations, activeId, onSelect, onNew }) {
  return (
    <div className="flex flex-col h-full">
      <button onClick={onNew} className="flex items-center justify-center gap-2 mx-3 mt-3 mb-2 px-3 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity">
        <MessageSquarePlus className="w-4 h-4" /> New conversation
      </button>
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3 space-y-1">
        {conversations.length === 0 && (
          <div className="text-center text-xs text-muted-foreground py-8">
            <MessagesSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No conversations yet
          </div>
        )}
        {conversations.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-xl transition-colors",
              activeId === c.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/60 border border-transparent"
            )}
          >
            <div className="text-sm font-medium truncate">{c.metadata?.name || "Conversation"}</div>
            <div className="text-xs text-muted-foreground truncate">{c.metadata?.description || timeAgo(c.created_date)}</div>
          </button>
        ))}
      </div>
    </div>
  );
}