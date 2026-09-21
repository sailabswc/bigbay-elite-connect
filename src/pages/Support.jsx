import React, { useEffect, useState, useRef, useCallback } from "react";
import { appRuntime } from "@/api/localRuntime";
import { Send, Sparkles, Loader2, Phone, PanelLeft, X } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import ConversationList from "@/components/support/ConversationList";
import MessageBubble from "@/components/support/MessageBubble";

const AGENT = "event_support_assistant";

const SUGGESTIONS = [
  "Give me a live safety report for the active event",
  "Which swimmers are still awaiting screening?",
  "Summarise revenue and sponsorship this season",
  "Send an email update to all swimmers in the next event",
  "Which support crew are currently on the water?",
];

export default function Support() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showList, setShowList] = useState(false);
  const scrollRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      const list = await appRuntime.agents.listConversations({ agent_name: AGENT });
      setConversations(list);
      if (list[0]) setActiveId(list[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    let unsub;
    (async () => {
      try {
        const convo = await appRuntime.agents.getConversation(activeId);
        setMessages(convo.messages || []);
      } catch (e) { console.error(e); }
      unsub = appRuntime.agents.subscribeToConversation(activeId, (data) => setMessages(data.messages || []));
    })();
    return () => unsub && unsub();
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const newConversation = async () => {
    try {
      const convo = await appRuntime.agents.createConversation({
        agent_name: AGENT,
        metadata: { name: "Support chat", description: "Big Bay Events assistant" },
      });
      setConversations((prev) => [convo, ...prev]);
      setActiveId(convo.id);
      setShowList(false);
    } catch (e) { console.error(e); }
  };

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;
    setSending(true);
    setInput("");
    try {
      let convoId = activeId;
      let convo;
      if (!convoId) {
        convo = await appRuntime.agents.createConversation({
          agent_name: AGENT,
          metadata: { name: content.slice(0, 40), description: "Big Bay Events assistant" },
        });
        convoId = convo.id;
        setConversations((prev) => [convo, ...prev]);
        setActiveId(convoId);
      } else {
        convo = await appRuntime.agents.getConversation(convoId);
      }
      await appRuntime.agents.addMessage(convo, { role: "user", content });
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-[1500px] mx-auto">
      <PageHeader
        title="Support Assistant"
        subtitle="Your AI guide for the whole platform — ask about events, swimmers, safety, revenue, or have it raise alerts and send updates."
        icon={Sparkles}
        actions={
          <div className="flex items-center gap-2">
            <a href={appRuntime.agents.getWhatsAppConnectURL(AGENT)} target="_blank" rel="noreferrer">
              <Button variant="outline"><Phone className="w-4 h-4 mr-1.5" /> Connect WhatsApp</Button>
            </a>
          </div>
        }
      />

      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm flex h-[calc(100vh-230px)] min-h-[520px]">
        {/* Conversation list — desktop */}
        <div className="hidden md:flex flex-col w-64 border-r border-border bg-muted/20">
          <ConversationList conversations={conversations} activeId={activeId} onSelect={setActiveId} onNew={newConversation} />
        </div>

        {/* Mobile list drawer */}
        {showList && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setShowList(false)}>
            <div className="w-72 h-full bg-card" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-end p-2"><button onClick={() => setShowList(false)}><X className="w-5 h-5" /></button></div>
              <ConversationList conversations={conversations} activeId={activeId} onSelect={(id) => { setActiveId(id); setShowList(false); }} onNew={newConversation} />
            </div>
          </div>
        )}

        {/* Chat panel */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border md:hidden">
            <button onClick={() => setShowList(true)}><PanelLeft className="w-5 h-5" /></button>
            <span className="text-sm font-medium">Conversations</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-4 sm:p-6 space-y-4">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : messages.length === 0 ? (
              <div className="max-w-xl mx-auto text-center pt-8">
                <div className="w-14 h-14 rounded-2xl ocean-gradient flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-heading font-bold text-xl">How can I help?</h3>
                <p className="text-sm text-muted-foreground mt-1.5">
                  I can guide you through the app, pull live event data, run reports, monitor safety and send updates to swimmers.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} onClick={() => send(s)} className="px-3 py-2 rounded-xl border border-border text-xs text-left hover:border-primary/40 hover:bg-primary/5 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => <MessageBubble key={i} message={m} />)
            )}
          </div>

          <div className="border-t border-border p-3 sm:p-4">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Ask about events, swimmers, safety, revenue…"
                className="flex-1 resize-none rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-32 scrollbar-thin"
              />
              <Button onClick={() => send()} disabled={sending || !input.trim()} className="bg-primary h-10 w-10 p-0 shrink-0">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">The assistant reads your live event data. Verify critical safety decisions with a human safety officer.</p>
          </div>
        </div>
      </div>
    </div>
  );
}