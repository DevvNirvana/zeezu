"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase/client";
import { X, MessageSquare, Zap, UserPlus, UserCheck, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

type Toast = {
    id: string;
    type: "message" | "buzz" | "friend_request" | "friend_accept" | "zap" | "system";
    title: string;
    body: string;
    link?: string;
    timestamp: number;
};

const TOAST_ICONS: Record<string, React.ReactNode> = {
    message: <MessageSquare className="w-4 h-4" />,
    buzz: <Zap className="w-4 h-4 fill-current" />,
    friend_request: <UserPlus className="w-4 h-4" />,
    friend_accept: <UserCheck className="w-4 h-4" />,
    zap: <Zap className="w-4 h-4" />,
    system: <Bell className="w-4 h-4" />,
};

const TOAST_COLORS: Record<string, string> = {
    message: "#00F7FF",
    buzz: "#8A2EFF",
    friend_request: "#FF007A",
    friend_accept: "#B4FF00",
    zap: "#B4FF00",
    system: "#8A2EFF",
};

const TOAST_DURATION = 5000;

export default function ToastProvider() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => setMounted(true), []);

    const addToast = useCallback((toast: Omit<Toast, "id" | "timestamp">) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts((prev) => [...prev.slice(-4), { ...toast, id, timestamp: Date.now() }]);

        // Auto-remove
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
                // Listen to all notification inserts, filter client-side
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                    },
                    async (payload: any) => {
                        const notif = payload.new;
                        // Client-side filter: only this user's notifications
                        if (notif.user_id !== user.id) return;
                        // Fetch actor info
                        const { data: actor } = await supabase
                            .from("users")
                            .select("display_name, zid")
                            .eq("id", notif.actor_id)
                            .single();

                        const name = actor?.display_name || "Someone";
                        const typeLabels: Record<string, string> = {
                            zap: "zapped your post",
                            comment: "commented on your post",
                            mention: "mentioned you",
                            friend_request: "sent you a friend request",
                            friend_accept: "accepted your friend request",
                            message: "sent you a message",
                            buzz: "sent you a Buzz! ⚡",
                            system: "System update",
                        };

                        // Determine toast link based on type
                        let link: string | undefined;
                        if (notif.type === "friend_request" || notif.type === "friend_accept") {
                            link = "/friends";
                        } else if (notif.type === "message" || notif.type === "buzz") {
                            link = `/messages/${notif.actor_id}`;
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

    return createPortal(
        <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[calc(100vw-2rem)] pointer-events-none">
            {toasts.map((toast, i) => (
                <div
                    key={toast.id}
                    className="pointer-events-auto cursor-pointer rounded-xl border backdrop-blur-xl shadow-2xl overflow-hidden"
                    style={{
                        animation: "toastSlideIn 0.3s ease-out",
                        borderColor: `${TOAST_COLORS[toast.type]}40`,
                        background: `linear-gradient(135deg, ${TOAST_COLORS[toast.type]}15, rgba(11,11,18,0.95))`,
                        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px ${TOAST_COLORS[toast.type]}20`,
                    }}
                    onClick={() => {
                        if (toast.link) router.push(toast.link);
                        removeToast(toast.id);
                    }}
                >
                    {/* Color accent bar at top */}
                    <div className="h-[2px] w-full" style={{ background: TOAST_COLORS[toast.type] }} />

                    <div className="p-3 flex items-start gap-3">
                        {/* Icon */}
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{
                                backgroundColor: `${TOAST_COLORS[toast.type]}20`,
                                color: TOAST_COLORS[toast.type],
                            }}
                        >
                            {TOAST_ICONS[toast.type]}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white truncate">{toast.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{toast.body}</p>
                        </div>

                        {/* Close */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeToast(toast.id);
                            }}
                            className="text-gray-600 hover:text-white transition-colors p-0.5 flex-shrink-0"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Auto-dismiss progress bar */}
                    <div className="h-[2px] w-full bg-gray-800">
                        <div
                            className="h-full"
                            style={{
                                background: TOAST_COLORS[toast.type],
                                animation: `toastProgress ${TOAST_DURATION}ms linear`,
                            }}
                        />
                    </div>
                </div>
            ))}

            <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
        </div>,
        document.body
    );
}
