import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessagesSquare, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import ChatRoomList from "@/components/chat/ChatRoomList";
import ChatConversation from "@/components/chat/ChatConversation";
import NewChatDialog from "@/components/chat/NewChatDialog";

const READ_KEY = "bb_connect_last_read";

export default function Chat() {
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState("list");
  const [lastRead, setLastRead] = useState({});

  const activeRef = useRef(null);
  useEffect(() => {
    activeRef.current = activeId;
  }, [activeId]);

  const markRead = useCallback((roomId) => {
    if (!roomId) return;
    setLastRead((prev) => {
      const next = { ...prev, [roomId]: new Date().toISOString() };
      localStorage.setItem(READ_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Bootstrap: current user, my chatrooms, and the people directory
  useEffect(() => {
    let alive = true;
    (async () => {
      const me = await base44.auth.me();
      if (!alive) return;
      setUser(me);
      setLastRead(JSON.parse(localStorage.getItem(READ_KEY) || "{}"));
      const [roomList, userList] = await Promise.all([
        base44.entities.ChatRoom.list("-last_message_at", 100),
        base44.entities.User.list(),
      ]);
      if (!alive) return;
      setRooms(roomList.filter((r) => (r.member_ids || []).includes(me.id)));
      setUsers(userList.filter((u) => u.id !== me.id));
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Messages for the open conversation
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    let alive = true;
    setMsgsLoading(true);
    base44.entities.ChatMessage.filter({ room_id: activeId }, "created_date", 300)
      .then((list) => {
        if (alive) {
          setMessages(list);
          setMsgsLoading(false);
        }
      })
      .catch(() => alive && setMsgsLoading(false));
    return () => {
      alive = false;
    };
  }, [activeId]);

  // Realtime: incoming messages across all my chatrooms
  useEffect(() => {
    const unsubscribe = base44.entities.ChatMessage.subscribe((event) => {
      if (event.type !== "create") return;
      const m = event.data;
      if (m.room_id === activeRef.current) {
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        markRead(m.room_id);
      }
      setRooms((prev) =>
        prev.map((r) =>
          r.id === m.room_id
            ? {
                ...r,
                last_message: m.body,
                last_message_at: m.created_date,
                last_sender_id: m.sender_id,
                last_sender_name: m.sender_name,
              }
            : r
        )
      );
    });
    return unsubscribe;
  }, [markRead]);

  const activeRoom = useMemo(
    () => rooms.find((r) => r.id === activeId) || null,
    [rooms, activeId]
  );

  const openRoom = useCallback(
    (id) => {
      setActiveId(id);
      setMobilePane("conversation");
      markRead(id);
    },
    [markRead]
  );

  const handleSend = useCallback(
    async (payload) => {
      const room = rooms.find((r) => r.id === activeRef.current);
      if (!room || !user) return;
      const body = (payload.body || "").trim();
      if (!body && !payload.attachment_url) return;

      const created = await base44.entities.ChatMessage.create({
        room_id: room.id,
        room_member_ids: room.member_ids || [],
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        body,
        attachment_url: payload.attachment_url,
        attachment_type: payload.attachment_type,
        attachment_name: payload.attachment_name,
      });

      setMessages((prev) => (prev.some((x) => x.id === created.id) ? prev : [...prev, created]));

      const preview =
        body || (payload.attachment_type === "image" ? "📷 Photo" : "📎 Attachment");
      const patch = {
        last_message: preview.slice(0, 120),
        last_message_at: created.created_date || new Date().toISOString(),
        last_sender_id: user.id,
        last_sender_name: user.full_name || user.email,
      };
      setRooms((prev) => prev.map((r) => (r.id === room.id ? { ...r, ...patch } : r)));
      await base44.entities.ChatRoom.update(room.id, patch);
    },
    [rooms, user]
  );

  const startDirect = useCallback(
    async (other) => {
      if (!user) return;
      const existing = rooms.find(
        (r) =>
          r.kind === "direct" &&
          (r.member_ids || []).length === 2 &&
          r.member_ids.includes(other.id) &&
          r.member_ids.includes(user.id)
      );
      if (existing) {
        setDialogOpen(false);
        openRoom(existing.id);
        return;
      }
      const created = await base44.entities.ChatRoom.create({
        name: other.full_name || other.email,
        kind: "direct",
        member_ids: [user.id, other.id],
        member_names: [user.full_name || user.email, other.full_name || other.email],
      });
      setRooms((prev) => [created, ...prev]);
      setDialogOpen(false);
      openRoom(created.id);
    },
    [rooms, user, openRoom]
  );

  const createGroup = useCallback(
    async (name, members) => {
      if (!user || !name.trim() || members.length === 0) return;
      const created = await base44.entities.ChatRoom.create({
        name: name.trim(),
        kind: "group",
        topic: "Created in Big Bay Connect",
        member_ids: [user.id, ...members.map((m) => m.id)],
        member_names: [
          user.full_name || user.email,
          ...members.map((m) => m.full_name || m.email),
        ],
      });
      setRooms((prev) => [created, ...prev]);
      setDialogOpen(false);
      openRoom(created.id);
    },
    [user, openRoom]
  );

  const unreadIds = useMemo(() => {
    const set = new Set();
    if (!user) return set;
    rooms.forEach((r) => {
      if (!r.last_message_at || r.last_sender_id === user.id) return;
      const seen = lastRead[r.id];
      if (!seen || new Date(r.last_message_at) > new Date(seen)) set.add(r.id);
    });
    return set;
  }, [rooms, lastRead, user]);

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col overflow-hidden lg:h-screen">
      {/* App bar — its own WhatsApp-style shell inside the platform */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <MessagesSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <div className="font-heading text-base font-bold leading-tight">Big Bay Connect</div>
            <div className="text-[11px] text-muted-foreground">Chatrooms &amp; private messages</div>
          </div>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New chat
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div
          className={cn(
            "min-h-0 w-full flex-col border-r border-border bg-card lg:flex lg:w-80 xl:w-96",
            mobilePane === "conversation" ? "hidden" : "flex"
          )}
        >
          <ChatRoomList
            rooms={rooms}
            activeId={activeId}
            onSelect={openRoom}
            loading={loading}
            unreadIds={unreadIds}
            currentUserId={user?.id}
          />
        </div>

        <div
          className={cn(
            "min-h-0 min-w-0 flex-1 flex-col",
            mobilePane === "list" ? "hidden lg:flex" : "flex"
          )}
        >
          <ChatConversation
            room={activeRoom}
            messages={messages}
            currentUser={user}
            loading={msgsLoading}
            onSend={handleSend}
            onBack={() => setMobilePane("list")}
          />
        </div>
      </div>

      <NewChatDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        users={users}
        onStartDirect={startDirect}
        onCreateGroup={createGroup}
      />
    </div>
  );
}