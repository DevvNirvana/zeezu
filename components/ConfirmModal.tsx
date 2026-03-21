"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";

export type ConfirmOptions = {
    title: string;
    message: string;
    danger?: boolean;
    confirmText?: string;
    cancelText?: string;
};

// ── Singleton bridge ───────────────────────────────────────────
let _open: ((opts: ConfirmOptions) => void) | null = null;
let _resolve: ((value: boolean) => void) | null = null;

/** Drop-in replacement for window.confirm() — returns a Promise<boolean> */
export async function confirmModal(opts: ConfirmOptions): Promise<boolean> {
    if (!_open) return window.confirm(opts.message); // fallback if portal not mounted
    return new Promise<boolean>((resolve) => {
        _resolve = resolve;
        _open!(opts);
    });
}

// ── Modal component (mount once in layout.tsx) ─────────────────
export default function ConfirmModal() {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [opts, setOpts] = useState<ConfirmOptions>({ title: "", message: "" });

    useEffect(() => {
        setMounted(true);
        _open = (o) => {
            setOpts(o);
            setVisible(true);
        };
        return () => { _open = null; };
    }, []);

    const handleConfirm = () => {
        setVisible(false);
        _resolve?.(true);
        _resolve = null;
    };

    const handleCancel = () => {
        setVisible(false);
        _resolve?.(false);
        _resolve = null;
    };

    if (!mounted || !visible) return null;

    const accent = opts.danger ? "#FF2D87" : "#00F7FF";
    const confirmBg = opts.danger
        ? "linear-gradient(135deg, #FF2D87, #ff0055)"
        : "linear-gradient(135deg, #00F7FF, #0099ff)";

    return createPortal(
        <div
            onClick={handleCancel}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 99999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(6px)",
                animation: "cfadeIn 0.15s ease-out",
                padding: "16px",
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "380px",
                    background: "linear-gradient(135deg, rgba(20,10,18,0.98), rgba(11,11,18,0.98))",
                    border: `1px solid ${accent}40`,
                    borderTop: `2px solid ${accent}`,
                    borderRadius: "16px",
                    boxShadow: `0 24px 64px rgba(0,0,0,0.8), 0 0 40px ${accent}18`,
                    overflow: "hidden",
                    animation: "cslideUp 0.18s ease-out",
                    fontFamily: "system-ui, sans-serif",
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "18px 20px 12px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                }}>
                    <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: `${accent}18`,
                        border: `1px solid ${accent}30`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        color: accent,
                    }}>
                        <AlertTriangle style={{ width: 18, height: 18 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <p style={{
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#fff",
                            letterSpacing: "0.5px",
                            lineHeight: 1.3,
                        }}>
                            {opts.title}
                        </p>
                        <p style={{
                            margin: "6px 0 0",
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.55)",
                            lineHeight: 1.5,
                        }}>
                            {opts.message}
                        </p>
                    </div>
                    <button
                        onClick={handleCancel}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "rgba(255,255,255,0.3)",
                            padding: "2px",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <X style={{ width: 14, height: 14 }} />
                    </button>
                </div>

                {/* Divider */}
                <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "0 20px" }} />

                {/* Buttons */}
                <div style={{
                    padding: "12px 20px 16px",
                    display: "flex",
                    gap: "8px",
                    justifyContent: "flex-end",
                }}>
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "1px solid rgba(255,255,255,0.12)",
                            background: "rgba(255,255,255,0.06)",
                            color: "rgba(255,255,255,0.6)",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            letterSpacing: "0.5px",
                            transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                            e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                        }}
                    >
                        {opts.cancelText ?? "CANCEL"}
                    </button>
                    <button
                        onClick={handleConfirm}
                        style={{
                            padding: "8px 20px",
                            borderRadius: "8px",
                            border: "none",
                            background: confirmBg,
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 800,
                            cursor: "pointer",
                            letterSpacing: "0.5px",
                            boxShadow: `0 4px 16px ${accent}40`,
                            transition: "opacity 0.15s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                    >
                        {opts.confirmText ?? "CONFIRM"}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes cfadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cslideUp { from { opacity: 0; transform: translateY(12px) scale(0.97) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
        </div>,
        document.body
    );
}
