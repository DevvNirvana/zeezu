"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";
import ThemeEngine from "@/components/ThemeEngine";
import ZoneCard from "@/components/ZoneCard";
import { getZones, getMyZones, type Zone } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { Plus, Search, Loader2, Zap, Clock, Radio } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  STYLES
// ─────────────────────────────────────────────────────────────────────────────

const STYLE_ID = "zee-zones-page-v1";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=VT323&family=Nunito:wght@400;600;700;800;900&display=swap');
    @keyframes zones-entry { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    .zone-card-enter { animation: zones-entry 0.3s ease both; }

    .zones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }
    @media (max-width: 600px) {
      .zones-grid { grid-template-columns: 1fr; }
    }

    .zones-tab {
      display: flex; align-items: center; gap: 5px;
      padding: 6px 14px; border-radius: 20px;
      font-family: 'Orbitron', sans-serif; font-size: 9px; font-weight: 900;
      letter-spacing: 1px; cursor: pointer; transition: all 0.15s;
      border: 1px solid transparent;
      background: transparent; color: rgba(255,255,255,.35);
    }
    .zones-tab:hover { color: rgba(255,255,255,.7); }
    .zones-tab.active {
      background: rgba(255,45,135,.12); border-color: rgba(255,45,135,.35);
      color: #FF2D87;
    }

    .zones-search {
      flex: 1; background: rgba(0,0,0,.3); border: 1px solid rgba(255,255,255,.08);
      border-radius: 10px; padding: 8px 12px; color: #fff; font-family: 'Nunito',sans-serif;
      font-size: 13px; outline: none; transition: border-color 0.15s;
    }
    .zones-search:focus { border-color: rgba(255,45,135,.4); }
    .zones-search::placeholder { color: rgba(255,255,255,.2); }

    /* Topic filter row — hide scrollbar on all browsers */
    .zones-topic-row {
      display: flex; gap: 6px; margin-bottom: 16px;
      overflow-x: auto; padding-bottom: 4px;
      scrollbar-width: none; -ms-overflow-style: none;
      -webkit-overflow-scrolling: touch;
    }
    .zones-topic-row::-webkit-scrollbar { display: none; }

    @media (max-width: 600px) {
      /* Controls row: stack tabs above search on mobile */
      .zones-controls {
        flex-direction: column !important;
        align-items: stretch !important;
      }
      .zones-controls > div:first-child {
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .zones-controls > div:first-child::-webkit-scrollbar { display: none; }
    }
  `;
  document.head.appendChild(s);
}

const TOPICS = ["all", "tech", "music", "art", "gaming", "film", "writing", "fashion", "sports", "science", "random"];

type Filter = "trending" | "newest" | "mine";

export default function ZonesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("trending");
  const [zones, setZones] = useState<Zone[]>([]);
  const [myZoneIds, setMyZoneIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTopic, setActiveTopic] = useState("all");
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async (f: Filter, q: string) => {
    setLoading(true);
    const [results, mine] = await Promise.all([
      getZones(f, q || undefined),
      getMyZones(),
    ]);
    setZones(results);
    setMyZoneIds(new Set(mine.map(z => z.id)));
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
    load(filter, "");
  }, [load, filter]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(filter, search), 350);
    return () => clearTimeout(t);
  }, [search, filter, load]);

  const filtered = activeTopic === "all"
    ? zones
    : zones.filter(z => z.topic_tag === activeTopic);

  return (
    <div style={{ minHeight: "100vh", background: "#070C1E", backgroundImage: "radial-gradient(ellipse 70% 40% at 50% 0%, rgba(255,45,135,.12) 0%, transparent 60%), url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='.65' fill='rgba(255,255,255,.04)'/%3E%3C/svg%3E\")", color: "#fff", fontFamily: "'Nunito',sans-serif", paddingBottom: "var(--mobile-dock-height)" }}>
      <ThemeEngine config={null} />
      <NavBar />

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "20px 16px 0" }}>

        {/* ── HEADER ── */}
        <div style={{ background: "linear-gradient(135deg,#6D10E8 0%,#3B0DA8 40%,#0B4B8F 100%)", borderRadius: "14px", padding: "18px 20px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(255,255,255,.02) 3px,rgba(255,255,255,.02) 4px)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <Radio size={16} style={{ color: "#FF2D87" }} />
              <h1 style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "16px", fontWeight: 900, color: "#fff", margin: 0, letterSpacing: "1px" }}>ZONES</h1>
            </div>
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "13px", color: "rgba(255,255,255,.45)", letterSpacing: "1.5px", margin: 0 }}>
              TUNE INTO COMMUNITIES · NO ALGORITHM · JUST SIGNAL
            </p>
          </div>
          {userId && (
            <button
              onClick={() => router.push("/zones/new")}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", background: "rgba(255,45,135,.2)", border: "1px solid rgba(255,45,135,.4)", color: "#FF2D87", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer", position: "relative", zIndex: 1, transition: "background 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,45,135,.32)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,45,135,.2)")}
            >
              <Plus size={12} /> CREATE ZONE
            </button>
          )}
        </div>

        {/* ── CONTROLS ── */}
        <div className="zones-controls" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button className={`zones-tab${filter === "trending" ? " active" : ""}`} onClick={() => setFilter("trending")}>
              <Zap size={10} /> TRENDING
            </button>
            <button className={`zones-tab${filter === "newest" ? " active" : ""}`} onClick={() => setFilter("newest")}>
              <Clock size={10} /> NEWEST
            </button>
            {userId && (
              <button className={`zones-tab${filter === "mine" ? " active" : ""}`} onClick={() => setFilter("mine")}>
                <Radio size={10} /> MY ZONES
              </button>
            )}
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", minWidth: "180px" }}>
            <Search size={13} style={{ color: "rgba(255,255,255,.25)", flexShrink: 0 }} />
            <input
              className="zones-search"
              placeholder="Search zones..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── TOPIC FILTER ── */}
        <div className="zones-topic-row">
          {TOPICS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTopic(t)}
              style={{ flexShrink: 0, padding: "3px 10px", borderRadius: "20px", fontFamily: "'VT323',monospace", fontSize: "11px", letterSpacing: "1px", cursor: "pointer", transition: "all 0.15s", background: activeTopic === t ? "rgba(0,229,255,.12)" : "transparent", border: activeTopic === t ? "1px solid rgba(0,229,255,.35)" : "1px solid rgba(255,255,255,.08)", color: activeTopic === t ? "#00E5FF" : "rgba(255,255,255,.3)" }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── GRID ── */}
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Loader2 size={24} style={{ color: "#FF2D87", animation: "spin 1s linear infinite" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📡</div>
            <p style={{ fontFamily: "'VT323',monospace", fontSize: "16px", color: "rgba(255,255,255,.25)", letterSpacing: "2px" }}>
              {filter === "mine" ? "YOU HAVEN'T TUNED IN TO ANY ZONES YET" : "NO ZONES FOUND · BE THE FIRST TO CREATE ONE"}
            </p>
            {userId && (
              <button onClick={() => router.push("/zones/new")} style={{ marginTop: "16px", padding: "8px 20px", borderRadius: "10px", background: "rgba(255,45,135,.15)", border: "1px solid rgba(255,45,135,.35)", color: "#FF2D87", fontFamily: "'Orbitron',sans-serif", fontSize: "9px", fontWeight: 900, letterSpacing: "1px", cursor: "pointer" }}>
                CREATE A ZONE
              </button>
            )}
          </div>
        ) : (
          <div className="zones-grid">
            {filtered.map((zone, i) => (
              <div key={zone.id} className="zone-card-enter" style={{ animationDelay: `${i * 0.04}s` }}>
                <ZoneCard zone={zone} isMember={myZoneIds.has(zone.id)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
