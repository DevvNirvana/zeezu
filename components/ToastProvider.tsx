"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase/client";
import { X, MessageSquare, Zap, UserPlus, UserCheck, Bell, Reply, ArrowUp, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

type Toast = {
    id: string;
    type: "message" | "buzz" | "friend_request" | "friend_accept" | "zap" | "system" | "comment" | "reply" | "upvote" | "milestone";
    title: string;
    body: string;
    link?: string;
    timestamp: number;
};

const TOAST_ICONS: Record<string, React.ReactNode> = {
    message: <MessageSquare style={{ width: 16, height: 16 }} />,
    buzz: <Zap style={{ width: 16, height: 16 }} />,
    friend_request: <UserPlus style={{ width: 16, height: 16 }} />,
    friend_accept: <UserCheck style={{ width: 16, height: 16 }} />,
    zap: <Zap style={{ width: 16, height: 16 }} />,
    system: <Bell style={{ width: 16, height: 16 }} />,
    comment: <MessageSquare style={{ width: 16, height: 16 }} />,
    reply: <Reply style={{ width: 16, height: 16 }} />,
    upvote: <ArrowUp style={{ width: 16, height: 16 }} />,
    milestone: <Trophy style={{ width: 16, height: 16 }} />,
};

const TOAST_COLORS: Record<string, string> = {
    message: "#00F7FF",
    buzz: "#FF2D87",
    friend_request: "#FF007A",
    friend_accept: "#B4FF00",
    zap: "#B4FF00",
    system: "#FF2D87",
    comment: "#00F7FF",
    reply: "#818cf8",
    upvote: "#22c55e",
    milestone: "#fbbf24",
};

const TOAST_DURATION = 5000;

export default function ToastProvider() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [mounted, setMounted] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();
    const recentNotifIds = useRef<Set<number>>(new Set());

    useEffect(() => {
        setMounted(true);
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const addToast = useCallback((toast: Omit<Toast, "id" | "timestamp">) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev.slice(-4), { ...toast, id, timestamp: Date.now() }]);

        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, TOAST_DURATION);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    // ── Listen for realtime notifications ──────────────────────────
    useEffect(() => {
        let cleanup: (() => void) | undefined;

        async function setup() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const channel = supabase
                .channel("toast_notifications")
                .on(
                    "postgres_changes",
                    { event: "INSERT", schema: "public", table: "notifications" },
                    async (payload: any) => {
                        const notif = payload.new;
                        if (notif.user_id !== user.id) return;
                        if (recentNotifIds.current.has(notif.id)) return;
                        recentNotifIds.current.add(notif.id);
                        setTimeout(() => recentNotifIds.current.delete(notif.id), 10000);

                        const { data: actor } = await supabase
                            .from("users")
                            .select("display_name, zid")
                            .eq("id", notif.actor_id)
                            .single();

                        const name = actor?.display_name || "Someone";
                        const typeLabels: Record<string, string> = {
                            zap: "zapped your post ⚡",
                            comment: "commented on your post",
                            reply: "replied to your comment",
                            upvote: "upvoted your comment",
                            milestone: notif.content || "Your comment hit a milestone!",
                            mention: "mentioned you",
                            friend_request: "sent you a friend request",
                            friend_accept: "accepted your friend request",
                            message: "sent you a message",
                            buzz: "sent you a Buzz! ⚡",
                            system: "System update",
                        };

                        let link: string | undefined;
                        if (notif.type === "friend_request" || notif.type === "friend_accept") {
                            link = "/friends";
                        } else if (notif.type === "message" || notif.type === "buzz") {
                            link = `/messages/${notif.actor_id}`;
                        } else if (["comment", "reply", "zap", "upvote", "milestone"].includes(notif.type)) {
                            link = "/dashboard";
                        }

                        addToast({
                            type: notif.type || "system",
                            title: notif.type === "buzz" ? `⚡ BUZZ from ${name}` : name,
                            body: typeLabels[notif.type] || notif.content || "New notification",
                            link,
                        });
                    }
                )
                .subscribe();

            cleanup = () => supabase.removeChannel(channel);
        }

        setup();
        return () => cleanup?.();
    }, [addToast]);

    if (!mounted) return null;

    // ── Container positioning ─────────────────────────────────────
    // Mobile: full-width banners slide down from top of screen
    // Desktop: compact cards in top-right corner below NavBar
    const containerStyle: React.CSSProperties = isMobile
        ? {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: "auto",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: 0,
            pointerEvents: "none",
        }
        : {
            position: "fixed",
            top: "68px",
            right: "16px",
            left: "auto",
            bottom: "auto",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "320px",
            maxWidth: "calc(100vw - 32px)",
            pointerEvents: "none",
        };

    return createPortal(
        <div style={containerStyle}>
            {toasts.map((toast) => {
                const color = TOAST_COLORS[toast.type] ?? "#FF2D87";
                const toastStyle: React.CSSProperties = isMobile
                    ? {
                        // Full-width banner — no side rounding at top
                        width: "100%",
                        borderRadius: "0 0 12px 12px",
                        border: `1px solid ${color}40`,
                        borderTop: `2px solid ${color}`,
                        background: `linear-gradient(135deg, ${color}18, rgba(11,11,18,0.98))`,
                        boxShadow: `0 4px 24px rgba(0,0,0,0.6), 0 0 16px ${color}25`,
                        animation: "toastSlideDown 0.3s ease-out",
                        pointerEvents: "auto",
                        cursor: "pointer",
                        overflow: "hidden",
                        backdropFilter: "blur(20px)",
                    }
                    : {
                        borderRadius: "12px",
                        border: `1px solid ${color}40`,
                        background: `linear-gradient(135deg, ${color}15, rgba(11,11,18,0.95))`,
                        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${color}20`,
                        animation: "toastSlideIn 0.3s ease-out",
                        pointerEvents: "auto",
                        cursor: "pointer",
                        overflow: "hidden",
                        backdropFilter: "blur(16px)",
                    };

                return (
                    <div
                        key={toast.id}
                        style={toastStyle}
                        onClick={() => {
                            if (toast.link) router.push(toast.link);
                            removeToast(toast.id);
                        }}
                    >
                        {/* Color accent bar at top */}
                        <div style={{ height: "2px", width: "100%", background: color }} />

                        <div style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
                            {/* Icon */}
                            <div
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    backgroundColor: `${color}20`,
                                    color: color,
                                }}
                            >
                                {TOAST_ICONS[toast.type]}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    fontWeight: 800,
                                    color: "#fff",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontFamily: "system-ui, sans-serif",
                                }}>
                                    {toast.title}
                                </p>
                                <p style={{
                                    margin: "2px 0 0",
                                    fontSize: "11px",
                                    color: "rgba(255,255,255,.5)",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    fontFamily: "system-ui, sans-serif",
                                }}>
                                    {toast.body}
                                </p>
                            </div>

                            {/* Close */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    removeToast(toast.id);
                                }}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "rgba(255,255,255,.4)",
                                    padding: "2px",
                                    flexShrink: 0,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <X style={{ width: 12, height: 12 }} />
                            </button>
                        </div>

                        {/* Auto-dismiss progress bar */}
                        <div style={{ height: "2px", width: "100%", background: "rgba(255,255,255,.06)" }}>
                            <div
                                style={{
                                    height: "100%",
                                    background: color,
                                    animation: `toastProgress ${TOAST_DURATION}ms linear`,
                                }}
                            />
                        </div>
                    </div>
                );
            })}

            <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0)      scale(1);    }
        }
        @keyframes toastSlideDown {
          from { opacity: 0; transform: translateY(-100%); }
          to   { opacity: 1; transform: translateY(0);      }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%;   }
        }
      `}</style>
        </div>,
        document.body
    );
}
