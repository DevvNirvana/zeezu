"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Bell, Zap, MessageSquare, AtSign, UserPlus, Wifi } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: number;
  type: "zap" | "comment" | "mention" | "system";
  content: string;
  is_read: boolean;
  created_at: string;
  actor: {
    display_name: string;
    zid: string;
  };
};

// Type labels that match Zeezu brand language
const TYPE_LABEL: Record<string, string> = {
  zap:     "zapped your post",
  comment: "dropped a comment",
  mention: "mentioned you",
  system:  "updated your Core 8",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  zap:     <Zap className="w-3.5 h-3.5 text-lime fill-lime drop-shadow-[0_0_6px_#B4FF00]" />,
  comment: <MessageSquare className="w-3.5 h-3.5 text-cyan drop-shadow-[0_0_6px_#00F7FF]" />,
  mention: <AtSign className="w-3.5 h-3.5 text-orange-400 drop-shadow-[0_0_6px_#fb923c]" />,
  system:  <UserPlus className="w-3.5 h-3.5 text-electric drop-shadow-[0_0_6px_#8A2EFF]" />,
};

// Color stripe on the left of each notification card
const TYPE_STRIPE: Record<string, string> = {
  zap:     "border-l-lime",
  comment: "border-l-cyan",
  mention: "border-l-orange-400",
  system:  "border-l-electric",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [isOpen, setIsOpen]               = useState(false);
  const [userId, setUserId]               = useState<string | null>(null);
  const [pulse, setPulse]                 = useState(false); // Ring animation on new notif
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── FETCH HELPERS ────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async (uid: string) => {
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  }, []);

  const fetchNotifications = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("notifications")
      .select(`
        id, type, content, is_read, created_at,
        actor:users!actor_id (display_name, zid)
      `)
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(15);
    // @ts-ignore — Supabase join typing
    if (data) setNotifications(data);
  }, []);

  // ── INIT + REALTIME ──────────────────────────────────────────
  useEffect(() => {
    let channelCleanup: (() => void) | undefined;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      await fetchUnreadCount(user.id);

      // Subscribe to realtime inserts for THIS user only
      const channel = supabase
        .channel(`notifs_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (_payload) => {
            setUnreadCount((prev) => prev + 1);
            // Pulse the bell icon to get attention
            setPulse(true);
            setTimeout(() => setPulse(false), 2000);
            // If dropdown is open, refresh the list live
            setIsOpen((open) => {
              if (open) fetchNotifications(user.id);
              return open;
            });
          }
        )
        .subscribe();

      channelCleanup = () => supabase.removeChannel(channel);
    };

    init();

    // Click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      channelCleanup?.();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [fetchUnreadCount, fetchNotifications]);

  // ── TOGGLE DROPDOWN ──────────────────────────────────────────
  const toggleDropdown = async () => {
    if (!isOpen && userId) {
      setIsOpen(true);
      await fetchNotifications(userId);
      // Mark all as read instantly (optimistic)
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", userId)
        .eq("is_read", false);
      setUnreadCount(0);
    } else {
      setIsOpen(false);
    }
  };

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>

      {/* ── BELL BUTTON ── */}
      <button
        onClick={toggleDropdown}
        className={`
          relative p-2 rounded-full transition-all duration-200
          text-gray-400 hover:text-white hover:bg-gray-800/60
          ${pulse ? "animate-[wiggle_0.4s_ease-in-out_2]" : ""}
        `}
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 transition-colors ${unreadCount > 0 ? "text-white" : ""}`} />

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="
            absolute -top-0.5 -right-0.5
            min-w-[18px] h-[18px] px-1
            bg-red-500 text-white text-[9px] font-black
            flex items-center justify-center rounded-full
            shadow-[0_0_10px_rgba(239,68,68,0.8)]
            animate-bounce
          ">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* Live pulse ring — shows when realtime is active */}
        {userId && (
          <span className="
            absolute -bottom-0.5 -right-0.5
            w-2 h-2 bg-lime rounded-full
            shadow-[0_0_6px_#B4FF00]
          " />
        )}
      </button>

      {/* ── DROPDOWN ── */}
      {isOpen && (
        <div className="
          absolute right-0 mt-3 w-[340px]
          bg-[#0B0B12] border border-gray-800
          rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_20px_rgba(138,46,255,0.1)]
          overflow-hidden z-[100]
          animate-in slide-in-from-top-2 fade-in-0 duration-150
        ">

          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/30">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-electric" />
              <span className="text-[11px] font-black text-gray-300 uppercase tracking-[0.15em]">
                Buzz Activity
              </span>
            </div>
            {/* Realtime indicator */}
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3 text-lime" />
              <span className="text-[9px] text-lime font-mono uppercase tracking-wider">Live</span>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[380px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-3 text-center">
                <Bell className="w-8 h-8 text-gray-700" />
                <p className="text-xs text-gray-600 font-mono">No signals yet.</p>
                <p className="text-[10px] text-gray-700">When someone zaps or comments,<br/>it shows up here.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-900">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`
                      flex gap-3 px-4 py-3 transition-colors
                      border-l-2 ${TYPE_STRIPE[notif.type] || "border-l-gray-700"}
                      ${!notif.is_read
                        ? "bg-gray-900/40 hover:bg-gray-900/60"
                        : "bg-transparent hover:bg-gray-900/20"
                      }
                    `}
                  >
                    {/* Icon */}
                    <div className="mt-0.5 w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-900 border border-gray-800">
                      {TYPE_ICON[notif.type] || <Bell className="w-3 h-3 text-gray-500" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">
                            {notif.actor?.display_name || "System"}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {TYPE_LABEL[notif.type] || notif.type}
                          </span>
                        </div>
                        <span className="text-[9px] text-gray-600 whitespace-nowrap flex-shrink-0">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Content preview — not for zaps (nothing to preview) */}
                      {notif.type !== "zap" && notif.content && (
                        <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
                          "{notif.content}"
                        </p>
                      )}

                      {/* ZID badge */}
                      {notif.actor?.zid && (
                        <span className="inline-block mt-1 text-[9px] font-mono text-gray-600">
                          {notif.actor.zid}
                        </span>
                      )}
                    </div>

                    {/* Unread dot */}
                    {!notif.is_read && (
                      <div className="w-1.5 h-1.5 bg-electric rounded-full mt-1.5 flex-shrink-0 shadow-[0_0_6px_#8A2EFF]" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-900 bg-gray-950/50">
              <p className="text-[10px] text-gray-600 text-center font-mono">
                Showing last {notifications.length} signals
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}