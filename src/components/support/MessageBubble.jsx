import React from "react";
import ReactMarkdown from "react-markdown";
import { Waves } from "lucide-react";
import FunctionDisplay from "./FunctionDisplay";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-lg ocean-gradient flex items-center justify-center shrink-0 mt-0.5">
          <Waves className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? "order-1" : ""}`}>
        {message.content && (
          <div className={`rounded-2xl px-4 py-2.5 text-sm ${isUser ? "bg-primary text-white rounded-br-sm" : "bg-muted/60 border border-border rounded-bl-sm"}`}>
            {isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-table:text-xs prose-th:text-left prose-td:py-1 prose-th:py-1"
                components={{
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto scrollbar-thin my-2"><table className="w-full border-collapse text-xs" {...props} /></div>
                  ),
                  th: ({ node, ...props }) => <th className="border-b border-border py-1 pr-3 text-left font-semibold" {...props} />,
                  td: ({ node, ...props }) => <td className="border-b border-border/50 py-1 pr-3" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {message.tool_calls?.map((tc, i) => <FunctionDisplay key={i} toolCall={tc} />)}
      </div>
    </div>
  );
}