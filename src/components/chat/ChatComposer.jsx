import React, { useRef, useState } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";

export default function ChatComposer({ onSend, disabled }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);

  const pick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const submit = async () => {
    if (disabled || sending) return;
    const body = text.trim();
    if (!body && !file) return;
    setSending(true);
    try {
      let attachment = {};
      if (file) {
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
        attachment = {
          attachment_url: file_url,
          attachment_type: file.type.startsWith("image/") ? "image" : "file",
          attachment_name: file.name,
        };
      }
      await onSend({ body, ...attachment });
      setText("");
      clearFile();
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-border bg-card p-3">
      {preview && (
        <div className="relative mb-2 inline-block">
          <Image src={preview} className="h-20 w-20 rounded-xl object-cover" alt="Attachment preview" />
          <button
            type="button"
            onClick={clearFile}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-0.5 text-destructive-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {file && !preview && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
          <Paperclip className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{file.name}</span>
          <button type="button" onClick={clearFile} className="shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={pick}
          className="hidden"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Attach file"
          onClick={() => inputRef.current?.click()}
          className="shrink-0 rounded-full"
        >
          <Paperclip className="h-5 w-5" />
        </Button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Type a message"
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <Button
          type="button"
          size="icon"
          aria-label="Send message"
          onClick={submit}
          disabled={disabled || sending}
          className="shrink-0 rounded-full"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </Button>
      </div>
    </div>
  );
}