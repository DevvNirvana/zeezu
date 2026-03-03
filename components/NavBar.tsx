"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Users, MessageSquare, LayoutDashboard, UserCircle, Disc3, Search } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import NotificationBell from "./NotificationBell";

export default function NavBar() {
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // ── Fetch unread message count ────────────────────────────────
  const fetchUnread = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("receiver_id", user.id)
      .eq("is_read", false);
    setUnreadMsgCount(count || 0);
  }, []);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread]);

  // ── Realtime: listen for message changes to update badge ──────
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function setup() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel("navbar_msg_count")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload: any) => {
            // Client-side filter: only this user's incoming messages
            if (payload.new?.receiver_id !== user.id) return;
            setUnreadMsgCount(prev => prev + 1);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages" },
          (payload: any) => {
            // Only re-fetch if it's related to this user
            const msg = payload.new;
            if (msg?.receiver_id === user.id || msg?.sender_id === user.id) {
              fetchUnread();
            }
          }
        )
        .subscribe();

      cleanup = () => supabase.removeChannel(channel);
    }
    setup();
    return () => cleanup?.();
  }, [fetchUnread]);

  return (
    <>
      {/* ── TOP NAV (always visible) ── */}
      <nav className="w-full bg-indigo border-b-2 border-electric/50 shadow-[0_4px_20px_rgba(138,46,255,0.2)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 md:h-16 flex items-center justify-between">

          {/* ── LOGO ── */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="bg-void border border-electric/50 p-1.5 rounded-md group-hover:bg-electric/20 transition-colors">
              <Zap className="text-cyan w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tighter lowercase bg-gradient-to-b from-white to-gray-400 bg-clip-text text-transparent group-hover:from-cyan group-hover:to-electric transition-all">
              zeezu
            </span>
          </Link>

          {/* ── NAV LINKS (Desktop only) ── */}
          <div className="hidden md:flex items-center gap-2">
            <NavButton href="/dashboard" icon={<LayoutDashboard size={18} />} text="Home" />
            <NavButton href="/search" icon={<Search size={18} />} text="Search" />
            <NavButton href="/friends" icon={<Users size={18} />} text="Friends" />
            <NavButton href="/messages" icon={<MessageSquare size={18} />} text="Messages" badge={unreadMsgCount} />
            <NavButton href="/zeewall" icon={<MessageSquare size={18} />} text="ZeeWall" />
          </div>

          {/* ── RIGHT CLUSTER ── */}
          <div className="flex items-center gap-2">
            {/* 🔔 Notification Bell */}
            <NotificationBell />

            {/* 🎵 Radio indicator for mobile (replaces ZID status dot) */}
            <div className="md:hidden flex items-center gap-1.5 bg-void px-2.5 py-1.5 border border-gray-800 rounded-lg">
              <Disc3 className="w-4 h-4 text-cyan animate-spin" style={{ animationDuration: "3s" }} />
              <span className="text-[9px] font-mono text-cyan tracking-wider">FM</span>
            </div>

            {/* Desktop: minimal status dot */}
            {/* <div className="hidden md:flex items-center gap-2 bg-void px-3 py-1.5 border border-gray-800 rounded-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-lime shadow-[0_0_8px_#B4FF00] animate-pulse" />
              <span className="text-xs font-mono text-gray-300">ZID: ACTIVE</span>
            </div> */}
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV ── */}
      <MobileBottomNav unreadMsgCount={unreadMsgCount} />
    </>
  );
}

// ── Mobile bottom navigation bar ──────────────────────────────
function MobileBottomNav({ unreadMsgCount }: { unreadMsgCount: number }) {
  const pathname = usePathname();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0B12]/95 backdrop-blur-lg border-t border-electric/20"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around h-16 px-2">
        <MobileNavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Home" active={pathname === "/dashboard"} />
        <MobileNavItem href="/search" icon={<Search size={20} />} label="Search" active={pathname === "/search"} />
        <MobileNavItem href="/messages" icon={<MessageSquare size={20} />} label="Messages" active={pathname?.startsWith("/messages") ?? false} badge={unreadMsgCount} />
        <MobileNavItem href="/zeewall" icon={<Zap size={20} />} label="Wall" active={pathname === "/zeewall"} />
        <MobileNavItem href="/profile" icon={<UserCircle size={20} />} label="Profile" active={pathname === "/profile"} />
      </div>
    </div>
  );
}

// Mobile nav item with active state + optional badge
function MobileNavItem({
  href,
  icon,
  label,
  active,
  badge = 0,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${active ? "text-electric" : "text-gray-600 hover:text-gray-400"
        }`}
    >
      <div className={`relative transition-all ${active ? "scale-110" : ""}`}>
        {icon}
        {badge > 0 && (
          <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 bg-electric text-white text-[8px] font-black flex items-center justify-center rounded-full shadow-[0_0_8px_rgba(138,46,255,0.8)]">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <span className={`text-[9px] font-mono uppercase tracking-wider ${active ? "text-electric" : ""
        }`}>
        {label}
      </span>
      {active && (
        <div className="w-1 h-1 rounded-full bg-electric shadow-[0_0_6px_#8A2EFF] mt-0.5" />
      )}
    </Link>
  );
}

// Desktop nav button component with optional badge
function NavButton({
  href,
  icon,
  text,
  badge = 0,
}: {
  href: string;
  icon: React.ReactNode;
  text: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-indigo to-void border border-gray-700 hover:border-electric hover:from-electric/20 hover:to-void text-gray-300 hover:text-white rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-all font-semibold text-sm"
    >
      {icon}
      {text}
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-electric text-white text-[9px] font-black flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(138,46,255,0.8)]">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}