import React from "react";
import { CheckCheck } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

const timeLabel = (d) =>
  new Date(d).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" });

export default function MessageBubble({ message, isMine, showSender }) {
  return (
    <div className={cn("flex w-full", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 shadow-sm",
          isMine
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm border border-border bg-card text-card-foreground"
        )}
      >
        {!isMine && showSender && (
          <div className="mb-0.5 text-[11px] font-semibold text-primary">{message.sender_name}</div>
        )}
        {message.attachment_url && (
          <div className="mb-1.5 overflow-hidden rounded-xl">
            <Image
              src={message.attachment_url}
              className="max-h-64 w-full object-cover"
              alt={message.attachment_name || "Attachment"}
            />
          </div>
        )}
        {message.body && (
          <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
        )}
        <div
          className={cn(
            "mt-0.5 flex items-center justify-end gap-1 text-[10px]",
            isMine ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {timeLabel(message.created_date)}
          {isMine && <CheckCheck className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}