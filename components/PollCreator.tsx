"use client";
import { useState } from "react";
import { BarChart3, Plus, X, XCircle } from "lucide-react";

export type PollData = {
    options: string[];
};

export default function PollCreator({
    onSubmit,
    onClose,
}: {
    onSubmit: (poll: PollData) => void;
    onClose: () => void;
}) {
    const [options, setOptions] = useState(["", ""]);

    const updateOption = (i: number, val: string) => {
        setOptions(prev => prev.map((o, idx) => idx === i ? val.slice(0, 80) : o));
    };

    const addOption = () => {
        if (options.length < 5) setOptions([...options, ""]);
    };

    const removeOption = (i: number) => {
        if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i));
    };

    const canSubmit = options.filter(o => o.trim()).length >= 2;

    return (
        <div className="mt-2 pt-2 border-t border-gray-800/30">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono font-bold text-cyan/70 uppercase tracking-widest">
                    <BarChart3 className="w-3 h-3 inline mr-1" />Create Poll
                </span>
                <button onClick={onClose} className="text-gray-700 hover:text-white"><X className="w-3.5 h-3.5" /></button>
            </div>

            <div className="space-y-1.5">
                {options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <span className="text-[9px] font-mono text-gray-700 w-4 text-right">{i + 1}.</span>
                        <input
                            type="text" value={opt}
                            onChange={e => updateOption(i, e.target.value)}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1 bg-black/30 border border-gray-800/60 rounded-lg px-3 py-1.5 text-[11px] text-white outline-none placeholder:text-gray-700 focus:border-cyan/30 transition-colors"
                        />
                        {options.length > 2 && (
                            <button onClick={() => removeOption(i)} className="text-gray-700 hover:text-red-500 transition-colors">
                                <XCircle className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mt-2">
                {options.length < 5 ? (
                    <button onClick={addOption}
                        className="flex items-center gap-1 text-[9px] font-mono text-gray-600 hover:text-cyan transition-colors">
                        <Plus className="w-3 h-3" /> Add option ({options.length}/5)
                    </button>
                ) : (
                    <span className="text-[8px] font-mono text-gray-700">Max 5 options</span>
                )}
                <button onClick={() => canSubmit && onSubmit({ options: options.filter(o => o.trim()) })}
                    disabled={!canSubmit}
                    className="text-[10px] font-black text-cyan hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-cyan px-3 py-1">
                    ATTACH POLL
                </button>
            </div>
        </div>
    );
}
