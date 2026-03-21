"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { BarChart3, Check } from "lucide-react";

const POLL_STYLE_ID = "poll-display-styles";
if (typeof document !== "undefined" && !document.getElementById(POLL_STYLE_ID)) {
    const s = document.createElement("style");
    s.id = POLL_STYLE_ID;
    s.textContent = `
    @keyframes pollBarFill { from { width: 0; } }
    .poll-bar-fill { animation: pollBarFill 0.6s ease-out forwards; }
  `;
    document.head.appendChild(s);
}

type PollOption = { text: string; index: number };

export default function PollDisplay({
    postId,
    options,
    userId,
}: {
    postId: number;
    options: string[];
    userId: string;
}) {
    const [votes, setVotes] = useState<Record<number, number>>({});
    const [myVote, setMyVote] = useState<number | null>(null);
    const [totalVotes, setTotalVotes] = useState(0);
    const [voting, setVoting] = useState(false);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.from("poll_votes").select("option_index, user_id").eq("post_id", postId);
            if (data) {
                const counts: Record<number, number> = {};
                let mine: number | null = null;
                data.forEach((v: any) => {
                    counts[v.option_index] = (counts[v.option_index] || 0) + 1;
                    if (v.user_id === userId) mine = v.option_index;
                });
                setVotes(counts);
                setMyVote(mine);
                setTotalVotes(data.length);
            }
        })();
    }, [postId, userId]);

    const handleVote = async (optionIndex: number) => {
        if (myVote !== null || voting) return;
        setVoting(true);
        // Optimistic
        setMyVote(optionIndex);
        setVotes(prev => ({ ...prev, [optionIndex]: (prev[optionIndex] || 0) + 1 }));
        setTotalVotes(prev => prev + 1);

        await supabase.from("poll_votes").insert({ post_id: postId, user_id: userId, option_index: optionIndex });
        setVoting(false);
    };

    const hasVoted = myVote !== null;
    const maxVotes = Math.max(...Object.values(votes), 1);

    // Bar colors cycling
    const barColors = [
        { bg: "rgba(255,45,135,0.15)", fill: "rgba(255,45,135,0.6)", text: "text-electric" },
        { bg: "rgba(0,247,255,0.12)", fill: "rgba(0,247,255,0.5)", text: "text-cyan" },
        { bg: "rgba(180,255,0,0.12)", fill: "rgba(180,255,0,0.5)", text: "text-lime" },
        { bg: "rgba(255,46,138,0.12)", fill: "rgba(255,46,138,0.5)", text: "text-magenta" },
        { bg: "rgba(255,200,0,0.12)", fill: "rgba(255,200,0,0.5)", text: "text-yellow-400" },
    ];

    return (
        <div className="mt-2 mb-1 rounded-lg border border-gray-800/40 bg-black/20 p-3">
            <div className="flex items-center gap-1.5 mb-2.5">
                <BarChart3 className="w-3 h-3 text-cyan/60" />
                <span className="text-[9px] font-mono text-gray-600 uppercase tracking-wider">Poll</span>
                {totalVotes > 0 && (
                    <span className="text-[8px] font-mono text-gray-700 ml-auto">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
                )}
            </div>

            <div className="space-y-1.5">
                {options.map((opt, i) => {
                    const count = votes[i] || 0;
                    const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const color = barColors[i % barColors.length];
                    const isMyVote = myVote === i;

                    return (
                        <button
                            key={i}
                            onClick={() => handleVote(i)}
                            disabled={hasVoted}
                            className={`w-full text-left rounded-lg border transition-all relative overflow-hidden ${hasVoted
                                ? `border-gray-800/30 cursor-default`
                                : `border-gray-800/40 hover:border-gray-600 cursor-pointer hover:bg-white/[0.02]`
                                } ${isMyVote ? "border-electric/30" : ""}`}
                            style={{ minHeight: "36px" }}
                        >
                            {/* Fill bar */}
                            {hasVoted && (
                                <div
                                    className="poll-bar-fill absolute inset-y-0 left-0 rounded-lg"
                                    style={{ width: `${pct}%`, background: color.fill, opacity: 0.3 }}
                                />
                            )}

                            <div className="relative flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    {isMyVote && <Check className="w-3 h-3 text-electric flex-shrink-0" />}
                                    <span className={`text-[11px] ${isMyVote ? "font-bold text-white" : "text-gray-300"}`}>
                                        {opt}
                                    </span>
                                </div>
                                {hasVoted && (
                                    <span className={`text-[10px] font-mono font-bold flex-shrink-0 ml-2 ${color.text}`}>
                                        {pct}%
                                    </span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
