"use client";
import { useState, useRef, useEffect } from "react";
import { Search, X, Loader2, Image as ImageIcon } from "lucide-react";

type GifResult = {
    id: string;
    title: string;
    previewUrl: string;
    url: string;
};

export default function GifPicker({
    onSelect,
    onClose,
}: {
    onSelect: (url: string) => void;
    onClose: () => void;
}) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<GifResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [trending, setTrending] = useState<GifResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "GlVGYHkr3WSBnllca54iNt0yFTz7dtmV";

    const mapResults = (data: any[]): GifResult[] =>
        data.map((g: any) => ({
            id: g.id,
            title: g.title || "",
            previewUrl: g.images?.fixed_height_small?.url || g.images?.fixed_height?.url || "",
            url: g.images?.fixed_height?.url || g.images?.original?.url || "",
        }));

    useEffect(() => {
        inputRef.current?.focus();
        (async () => {
            try {
                const r = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${API_KEY}&limit=20&rating=pg`);
                const d = await r.json();
                if (d.data) setTrending(mapResults(d.data));
            } catch { /* ignore */ }
        })();
    }, []);

    const handleSearch = (q: string) => {
        setQuery(q);
        if (timerRef.current) clearTimeout(timerRef.current);
        if (!q.trim()) { setResults([]); return; }
        timerRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const r = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(q)}&limit=20&rating=pg`);
                const d = await r.json();
                if (d.data) setResults(mapResults(d.data));
            } catch { /* ignore */ }
            setLoading(false);
        }, 400);
    };

    const gifs = query.trim() ? results : trending;

    return (
        <div className="mt-2 pt-2 border-t border-gray-800/30">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono font-bold text-electric/70 uppercase tracking-widest">
                    <ImageIcon className="w-3 h-3 inline mr-1" />Search GIFs
                </span>
                <button onClick={onClose} className="text-gray-700 hover:text-white"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-600" />
                <input ref={inputRef} type="text" value={query} onChange={e => handleSearch(e.target.value)}
                    placeholder="Search GIFs..."
                    className="w-full bg-black/40 border border-gray-800/60 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-white outline-none placeholder:text-gray-700 focus:border-electric/30" />
                {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-electric animate-spin" />}
            </div>
            <div className="grid grid-cols-3 gap-1 max-h-[200px] overflow-y-auto rounded-lg" style={{ scrollbarWidth: "thin" }}>
                {gifs.map(g => (
                    <button key={g.id} onClick={() => onSelect(g.url)}
                        className="relative aspect-square overflow-hidden rounded-md border border-gray-800/40 hover:border-electric/50 transition-colors group">
                        <img src={g.previewUrl} alt={g.title} className="w-full h-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-electric/0 group-hover:bg-electric/10 transition-colors" />
                    </button>
                ))}
                {gifs.length === 0 && !loading && (
                    <div className="col-span-3 py-6 text-center text-[10px] text-gray-700 font-mono">
                        {query ? "No GIFs found" : "Loading trending..."}
                    </div>
                )}
            </div>
            <p className="text-[7px] text-gray-800 mt-1.5 text-right font-mono">Powered by GIPHY</p>
        </div>
    );
}
