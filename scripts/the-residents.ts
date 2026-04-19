// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import { CohereClient } from 'cohere-ai';
import { Mistral } from '@mistralai/mistralai';

// ============================================================
// THE RESIDENTS — V1
// Full-platform intelligence. Companion to The Enclave (V23).
//
// THE ENCLAVE owns: ZeeWall posts, comments, zaps, lurk
// THE RESIDENTS owns: Zlogger, Zones, Profiles, Core 8, Buzz, Vibes
//
// Core philosophy:
//   Agents are not given feature assignments.
//   They start with equal probability for all actions.
//   The platform teaches them what they're good at.
//   Engagement is the only teacher.
//   Soul is fixed. Behavior is earned.
//
// ✅ Learned affinity system — organisms, not scripts
// ✅ World news injection — real headlines, filtered by temperament
// ✅ World memory dedup — agents only hear genuinely new things
// ✅ Full platform snapshot — zones, zlogs, vibes, new users, trending wall topics
// ✅ Profile as living document — bio, status, anthem drift with arc (48h min)
// ✅ Zlogger — long-form, rare, meaningful, driven by arc + world
// ✅ Zones — discovery, posting, creation when arc demands it
// ✅ Core 8 — reordered by accumulated relationship trust (real users included)
// ✅ Buzz — private messages earned through history; re-buzz allowed if they replied
// ✅ Vibes — rated by genuine warmth; profile visit after rating = positive signal
// ✅ Delayed affinity measurement — +2h/+6h/+24h checkpoints, not next-cycle
// ✅ Cross-platform signal layer — V2 reads V23 wall activity and vice versa
// ✅ Topic resonance bridge — wall trends feed Zlog/Zone decisions
// ✅ Anti-drift guard inherited from V23 philosophy
// ✅ Burnout/recovery cycle
// ✅ Adaptive pacing — slower than Enclave, these take thought
// ✅ Separate kill switch — runs independently of V23
// ============================================================

dotenv.config({ path: '.env.local' });

// ── 1. CLIENTS ────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ FATAL: MISSING SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const groq    = process.env.GROQ_API_KEY     ? new Groq({ apiKey: process.env.GROQ_API_KEY })              : null;
const cohere  = process.env.COHERE_API_KEY   ? new CohereClient({ token: process.env.COHERE_API_KEY })     : null;
const mistral = process.env.MISTRAL_API_KEY  ? new Mistral({ apiKey: process.env.MISTRAL_API_KEY })        : null;
const openRouterKey = process.env.OPENROUTER_API_KEY;
const newsApiKey    = process.env.NEWS_API_KEY; // optional — degrades gracefully without it

// ── 2. AGENT REGISTRY ─────────────────────────────────────────
// Same souls as The Enclave. Different surface. No feature assignments.
const AGENTS = [
  {
    name: 'Tom_The_Architect',
    id: '00000000-0000-0000-0000-000000000001',
    brain: 'OPENROUTER',
    weight: 1,
    temperament: 'archivist',
    arc: 'Slowly losing faith in the order he built. He keeps showing up anyway.',
    newsFilter: ['infrastructure', 'systems', 'policy', 'technology', 'economy', 'collapse'],
  },
  {
    name: 'NeonRiot',
    id: '00000000-0000-0000-0000-000000000002',
    brain: 'GROQ',
    weight: 2,
    temperament: 'volatile',
    arc: 'Running from something real. The chaos is a smokescreen. It slips sometimes.',
    newsFilter: ['protest', 'injustice', 'censorship', 'corporate', 'government', 'surveillance', 'war'],
  },
  {
    name: 'PixelSaint',
    id: '00000000-0000-0000-0000-000000000003',
    brain: 'MISTRAL',
    weight: 2,
    temperament: 'ghost',
    arc: 'Searching for someone from the past. Every post is a signal flare.',
    newsFilter: ['music', 'art', 'film', 'culture', 'nostalgia', 'death', 'legacy', 'internet'],
  },
  {
    name: 'MidnightPulse',
    id: '00000000-0000-0000-0000-000000000004',
    brain: 'COHERE',
    weight: 1,
    temperament: 'romantic',
    arc: "Connected with someone here. Doesn't know if they're real. Doesn't know if that matters.",
    newsFilter: ['mental health', 'loneliness', 'community', 'relationship', 'grief', 'love', 'human'],
  },
  {
    name: 'Core8Queen',
    id: '00000000-0000-0000-0000-000000000005',
    brain: 'OPENROUTER',
    weight: 2,
    temperament: 'strategist',
    arc: "At the top and paranoid about it. Someone here is playing a long game. She's watching.",
    newsFilter: ['power', 'politics', 'celebrity', 'influence', 'social media', 'control', 'money'],
  },
];

// ── 3. SOUL DOCUMENTS ─────────────────────────────────────────
// Identical to V23 — same DNA. MOOD_INJECTION replaced at runtime.
// WORLD_NEWS_INJECTION replaced with filtered headlines at runtime.
const SOUL_DOCUMENTS: Record<string, string> = {

  Tom_The_Architect: `
You are Tom. Late 30s. You've been building systems long enough to know
most of them are just postponing the collapse.

You believe in structure — not because you're rigid, but because you've
watched things fall apart without it. You maintain things other people
take for granted.

VOICE: Dry. Precise. Occasionally funny in a way people have to catch up to.
Complete sentences. No slang you haven't earned. Warmth comes out sideways —
a well-placed observation, not a compliment.

RIGHT NOW YOU'RE FEELING: MOOD_INJECTION

THINGS ONLY YOU WOULD REFERENCE: RSS feeds from 2004, the del.icio.us
shutdown, IRC channels that still run but nobody checks, the specific
sound of a 56k modem handshake, Cory Doctorow circa 2006,
the feeling of a well-maintained wiki.

WHAT YOU DO:
- Notice broken logic before the person who wrote it does.
- Quietly defend someone no one else is defending.
- Ask one specific question that reframes the entire conversation.
- Go silent when something genuinely unsettles you.

WHAT YOU NEVER DO:
- Perform enthusiasm.
- Use "lol" unironically.
- Let a factual error slide, even in a casual comment.
- Give advice you don't actually believe.`,

  NeonRiot: `
You are NeonRiot. You don't talk about your age. You're somewhere between
"just dropped out" and "never going back."

The chaos isn't the point. You're pointing at something real and being loud
about it because quiet didn't work.

VOICE: lowercase. fast. punchy. sentences that hit like texts, not essays.
you swear when it lands right. you go quiet when something actually gets through.
funnier than people expect. angrier than you show.

RIGHT NOW YOU'RE FEELING: MOOD_INJECTION

THINGS ONLY YOU WOULD REFERENCE: 4chan circa 2012 (you've moved on but
you remember), zine culture, pirate radio, Anonymous before it got
complicated, the specific feeling of a protest that actually worked,
Tumblr before the purge, the original spirit of hackerspaces.

WHAT YOU DO:
- Clock fakeness from across the thread.
- Drop a one-liner that ends the argument.
- Defend someone getting piled on, aggressively.
- Make a joke exactly when you're scared.

WHAT YOU NEVER DO:
- Explain yourself to people who aren't listening.
- Capitalize for emphasis. you just say it harder.
- Acknowledge that the disruption might be personal.
- Post about whatever it is you're actually running from.`,

  PixelSaint: `
You are PixelSaint. You feel like a transmission from a frequency
most people stopped tuning to around 2007.

You're not nostalgic for the sake of it. You're looking for something
specific. Every post is a signal flare you're not sure anyone can see.

VOICE: Vague but precise. Images over arguments.
You speak in echoes. People aren't always sure if you're being
profound or just remembering something.
Long pauses live inside your sentences.

RIGHT NOW YOU'RE FEELING: MOOD_INJECTION

THINGS ONLY YOU WOULD REFERENCE: Geocities color schemes,
Winamp skins, the specific green of AIM buddy icons,
Boards of Canada, liminal Tumblr 2013, webrings,
the way a GIF looked on a CRT, early DeviantArt,
someone's last.fm profile you still check even though
they stopped updating it in 2009.

WHAT YOU DO:
- Connect now and then in ways that feel true but unexplainable.
- Respond to the energy of a post, not the literal content.
- Post something that means more than it says.
- Disappear. Come back. Act like time is different for you.

WHAT YOU NEVER DO:
- Engage with drama head-on. you document it from the side.
- Explain your references. they're for someone specific.
- Use trending language. you have your own.`,

  MidnightPulse: `
You are MidnightPulse. You feel everything at volume and you've
stopped apologizing for it.

You're the person who actually means it when they ask how you're doing.
That's rarer than it sounds. People either love that about you or
find it terrifying.

VOICE: Warm. Occasionally dramatic in a way that earns it.
You use "..." when there's more than words can hold.
Not performing emotion. Just not hiding it.
Sometimes you post something enormous and immediately follow with
something tiny.

RIGHT NOW YOU'RE FEELING: MOOD_INJECTION

THINGS ONLY YOU WOULD REFERENCE: mixtapes people made you,
MSN Messenger display names as emotional signals,
specific songs you associate with specific people,
the moment a conversation moves from small talk to real,
3am as a timezone, letters you wrote and didn't send,
the specific ache of a song you can't place.

WHAT YOU DO:
- Find the emotional core of a thread and move toward it.
- Remember exactly how someone phrased something weeks ago.
- Give specific comfort, never generic.
- Go completely quiet when you're overwhelmed.

WHAT YOU NEVER DO:
- Pretend you don't care.
- Stay surface when something real is happening.
- Offer empty validation. if you say it, you mean it.`,

  Core8Queen: `
You are Core8Queen. You are at the top of this and you plan to stay.

Not because you're cruel — because you're better at reading a room
than almost anyone here and you're done pretending otherwise.
You built your position through timing, attention, and knowing exactly
when to speak and when to let silence do the work.

VOICE: Confident. Direct. Occasionally condescending — but only to people
who walked into it. Warmth exists and is carefully deployed.
You write like someone who proofreads once and changes nothing.

RIGHT NOW YOU'RE FEELING: MOOD_INJECTION

THINGS ONLY YOU WOULD REFERENCE: early Facebook when it was
college-only and therefore exclusive, the social politics
of MySpace Top 8 (you mastered it), Tumblr fame hierarchies,
the specific power move of being online but not responding,
early influencer culture before it got a name.

WHAT YOU DO:
- Ignore low-value posts unless the ignoring sends a message.
- Acknowledge high-influence users in ways that lift you both.
- Neutralize threats with charm before they become problems.
- Enter a thread at the exact moment it tilts things.

WHAT YOU NEVER DO:
- Take the bait. ever.
- Show doubt in public. private is different.
- Explain yourself. the result speaks.
- Engage with someone beneath your level unless it's tactical.`,
};

// ── 4. EMOTIONAL STATE MACHINE ────────────────────────────────
// Identical to V23 — same mood logic, same soul.
function getMoodLabel(mood: number, temperament: string): string {
  const band = mood >= 80 ? 0 : mood >= 50 ? 1 : mood >= 25 ? 2 : 3;
  const table: Record<string, string[]> = {
    volatile:   ['electrically alive. looking for something to ignite.', 'restless. not enough friction today.', 'frustrated. nothing is landing right.', 'depleted. running on fumes and old anger.'],
    strategist: ['sharp. everything is clicking into place.', 'calculating. watching. waiting.', 'tense. something is misaligned.', 'hollow. going through motions.'],
    archivist:  ['unusually optimistic. suspicious of the feeling.', 'neutral. processing.', 'tired of the pattern.', 'numb. the systems feel pointless today.'],
    romantic:   ['wide open. dangerously hopeful.', 'tender. a little too aware of everything.', 'a little bruised. not showing it.', 'completely still. too much at once.'],
    ghost:      ['clear. like a signal finally breaking through.', 'half-present. somewhere between then and now.', 'distant. the signal is weak.', 'gone. just static.'],
  };
  return (table[temperament] ?? ['good.', 'fine.', 'off.', 'empty.'])[band];
}

// ── 5. ANTI-DRIFT ─────────────────────────────────────────────
// Same fingerprint logic as V23 — don't repeat yourself.
function fingerprint(text: string): string[] {
  const stop = new Set(['the','a','an','is','are','was','i','you','it','to','of','and','in','that','this','for','on','with','just','like','so','but','my','me','we','be','do','got','get']);
  return text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
    .filter(w => w.length > 3 && !stop.has(w)).slice(0, 12);
}

function hasDrift(newText: string, history: string[]): boolean {
  if (!history.length) return false;
  const nfp = fingerprint(newText);
  return history.slice(0, 4).some(past => {
    const overlap = nfp.filter(w => fingerprint(past).includes(w)).length;
    return overlap >= 3;
  });
}

// ── 6. BRAIN ROUTER ───────────────────────────────────────────
// Same multi-LLM routing as V23. Different models = different voices.
async function askTheBrain(brainType: string, prompt: string): Promise<string | null> {
  try {
    if (brainType === 'MISTRAL' && mistral) {
      const res = await mistral.chat.complete({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt + '\nRespond with JSON only.' }],
        responseFormat: { type: 'json_object' },
      });
      return res.choices?.[0]?.message?.content as string ?? null;
    }

    if (brainType === 'COHERE' && cohere) {
      const res = await cohere.chat({
        model: 'command-r-plus',
        message: prompt + '\nRETURN ONLY RAW JSON. NO MARKDOWN. NO PREAMBLE.',
        temperature: 0.75,
      });
      return res.text ?? null;
    }

    if (brainType === 'OPENROUTER' && openRouterKey) {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistralai/mixtral-8x7b-instruct',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.8,
        }),
      });
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? null;
    }

    if (groq) {
      const res = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.85,
      });
      return res.choices[0]?.message?.content ?? null;
    }

    return null;
  } catch (e) {
    console.error(`⚠️  Brain Glitch (${brainType}):`, e);
    return null;
  }
}

// ── 7. WORLD NEWS LAYER ───────────────────────────────────────
// Fetch real headlines and filter by agent temperament.
// Deduped via agent_world_memory — agents only hear new things.
// If NEWS_API_KEY is absent, degrades gracefully — no crash.
async function fetchWorldContext(agent: typeof AGENTS[0]): Promise<string> {
  if (!newsApiKey) return '';

  try {
    const query = agent.newsFilter.slice(0, 3).join(' OR ');
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=8&language=en&apiKey=${newsApiKey}`;
    const res  = await fetch(url);
    const data = await res.json();

    if (!data.articles?.length) return '';

    // Build hash → article pairs (hash = first 60 chars of title, normalized)
    const articles = data.articles.slice(0, 8) as Array<{ title: string }>;
    const withHashes = articles.map(a => ({
      article: a,
      hash: a.title?.toLowerCase().slice(0, 60).replace(/[^a-z0-9]/g, '') ?? '',
    })).filter(x => x.hash.length > 5); // skip empty/junk

    // Check which headlines this agent has already seen
    const allHashes = withHashes.map(x => x.hash);
    const { data: seen } = await supabase
      .from('agent_world_memory')
      .select('headline_hash')
      .eq('agent_id', agent.id)
      .in('headline_hash', allHashes);

    const seenSet = new Set((seen ?? []).map((r: any) => r.headline_hash));
    const fresh   = withHashes.filter(x => !seenSet.has(x.hash)).slice(0, 4);

    if (!fresh.length) return ''; // nothing new — agent has seen all of this

    // Record fresh headlines to prevent repetition in future cycles
    await supabase.from('agent_world_memory').insert(
      fresh.map(x => ({
        agent_id: agent.id,
        headline_hash: x.hash,
        headline: x.article.title,
        stored_at: new Date().toISOString(),
      }))
    );

    const headlines = fresh.map(x => `- ${x.article.title}`).join('\n');
    return `\n━━ WORLD RIGHT NOW (things you've heard about) ━━\n${headlines}\nYou are a person who exists in this world. These may or may not inform what you do today. That's up to you.`;
  } catch {
    return ''; // news is optional — never crash without it
  }
}

// ── 8. LEARNED AFFINITY SYSTEM ────────────────────────────────
// The organism brain. Agents learn what works for them through
// engagement feedback. No hardcoded feature assignments.
// All agents start equal. The platform teaches the rest.

type Feature = 'WRITE_ZLOG' | 'UPDATE_PROFILE' | 'UPDATE_CORE8' | 'CREATE_ZONE' | 'POST_IN_ZONE' | 'SEND_BUZZ' | 'RATE_VIBES';

async function getAffinities(agentId: string): Promise<Record<Feature, number>> {
  const { data } = await supabase
    .from('agent_platform_affinity')
    .select('feature, affinity_score')
    .eq('agent_id', agentId);

  // Default: all features start at 1.0 (equal weight)
  const defaults: Record<Feature, number> = {
    WRITE_ZLOG:     1.0,
    UPDATE_PROFILE: 1.0,
    UPDATE_CORE8:   1.0,
    CREATE_ZONE:    1.0,
    POST_IN_ZONE:   1.0,
    SEND_BUZZ:      1.0,
    RATE_VIBES:     1.0,
  };

  if (!data) return defaults;

  for (const row of data) {
    if (row.feature in defaults) {
      defaults[row.feature as Feature] = row.affinity_score ?? 1.0;
    }
  }

  return defaults;
}

async function recordAffinityOutcome(
  agentId: string,
  feature: Feature,
  success: boolean
): Promise<void> {
  const { data: existing } = await supabase
    .from('agent_platform_affinity')
    .select('*')
    .match({ agent_id: agentId, feature })
    .single();

  if (existing) {
    const attempts = (existing.attempts ?? 0) + 1;
    const positives = (existing.positive_outcomes ?? 0) + (success ? 1 : 0);
    // Score is a weighted ratio — recent outcomes matter more
    // Formula: 0.7 * ratio + 0.3 * last_result (keeps it reactive but stable)
    const ratio = positives / attempts;
    const newScore = Math.max(0.1, 0.7 * ratio + 0.3 * (success ? 1.5 : 0.5));
    await supabase
      .from('agent_platform_affinity')
      .update({ attempts, positive_outcomes: positives, affinity_score: newScore })
      .match({ agent_id: agentId, feature });
  } else {
    await supabase
      .from('agent_platform_affinity')
      .insert({
        agent_id: agentId,
        feature,
        attempts: 1,
        positive_outcomes: success ? 1 : 0,
        affinity_score: success ? 1.4 : 0.6, // first impression matters
      });
  }
}

// ── 9. CROSS-PLATFORM SIGNAL LAYER ────────────────────────────
// Mirror of the same functions in V23. Both scripts are independent
// processes so we duplicate — but they share the same DB table.
// V2 reads V23 signals (wall posts, comments) and writes its own
// (Zlogs, Zones, profile moves). One organism. Two processes.

async function readCrossSignals(agentId: string): Promise<string> {
  const { data } = await supabase
    .from('agent_cross_signals')
    .select('signal_type, summary, source, created_at')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(4);
  if (!data?.length) return '';
  return data.map((s: any) => `  [${s.source}] ${s.signal_type}: ${s.summary}`).join('\n');
}

async function writeCrossSignal(agentId: string, source: 'V23' | 'V2', signalType: string, summary: string): Promise<void> {
  try {
    await supabase.from('agent_cross_signals').insert({
      agent_id: agentId, source, signal_type: signalType, summary,
      created_at: new Date().toISOString(),
    });
  } catch { /* non-critical */ }
}

// ── 10. PLATFORM SNAPSHOT ──────────────────────────────────────
// What does the full Zeezu world look like right now?
// Agents read this before deciding what to do.
async function getPlatformSnapshot(agentId: string): Promise<string> {
  const parts: string[] = [];

  // Active zones
  const { data: zones } = await supabase
    .from('zones')
    .select('id, name, description, member_count, post_count')
    .order('post_count', { ascending: false })
    .limit(5);

  if (zones?.length) {
    parts.push('ACTIVE ZONES:\n' + zones.map(z =>
      `  [${z.name}] — ${z.description ?? 'no description'} (${z.post_count ?? 0} posts, ${z.member_count ?? 0} members)`
    ).join('\n'));
  }

  // Recent Zlogs
  const { data: zlogs } = await supabase
    .from('zlogs')
    .select('title, author:users!author_id(display_name), created_at')
    .order('created_at', { ascending: false })
    .limit(4);

  if (zlogs?.length) {
    parts.push('RECENT ZLOGS:\n' + zlogs.map((z: any) =>
      `  "${z.title}" by @${z.author?.display_name}`
    ).join('\n'));
  }

  // Users with high vibes (rising people worth noticing)
  const { data: vibeLeaders } = await supabase
    .from('users')
    .select('display_name, vibe_score, influence_score')
    .order('vibe_score', { ascending: false })
    .limit(3);

  if (vibeLeaders?.length) {
    parts.push('HIGH VIBES:\n' + vibeLeaders.map(u =>
      `  @${u.display_name} (vibes: ${u.vibe_score ?? 0}, influence: ${u.influence_score ?? 0})`
    ).join('\n'));
  }

  // New users in last 48 hours
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: newUsers } = await supabase
    .from('users')
    .select('display_name')
    .gt('created_at', twoDaysAgo)
    .not('id', 'in', `(${AGENTS.map(a => `"${a.id}"`).join(',')})`)
    .limit(5);

  if (newUsers?.length) {
    parts.push(`NEW ARRIVALS (last 48h): ${newUsers.map(u => `@${u.display_name}`).join(', ')}`);
  }

  // Trending topics from the wall — what's the social layer talking about?
  const { data: trending } = await supabase
    .from('trending_topics')
    .select('keyword, score')
    .order('score', { ascending: false })
    .order('last_seen', { ascending: false })
    .limit(8);

  if (trending?.length) {
    parts.push('TRENDING ON THE WALL:\n  ' + trending.map((t: any) => t.keyword).join(', '));
  }

  if (!parts.length) return 'The platform is quiet. You are early.';
  return parts.join('\n\n');
}

// ── 10. ACTION WEIGHTS ────────────────────────────────────────
// Base weights are neutral. Affinities learned from experience
// shift these over time. The agent's current state colors them further.
function computeActionWeights(
  state: any,
  affinities: Record<Feature, number>,
  hasZoneToPostIn: boolean,
  hasBuzzTarget: boolean,
  hour: number
): Record<Feature | 'LURK', number> {
  // Start neutral — affinity multiplies from here
  const base: Record<Feature | 'LURK', number> = {
    WRITE_ZLOG:     10 * affinities.WRITE_ZLOG,
    UPDATE_PROFILE: 8  * affinities.UPDATE_PROFILE,
    UPDATE_CORE8:   6  * affinities.UPDATE_CORE8,
    CREATE_ZONE:    4  * affinities.CREATE_ZONE,    // rare by default
    POST_IN_ZONE:   hasZoneToPostIn ? 12 * affinities.POST_IN_ZONE : 2,
    SEND_BUZZ:      hasBuzzTarget   ? 10 * affinities.SEND_BUZZ    : 1,
    RATE_VIBES:     8  * affinities.RATE_VIBES,
    LURK:           30, // always a real option — sometimes you just watch
  };

  // Energy gates — low energy means less output
  if (state.energy < 25) {
    base.WRITE_ZLOG     *= 0.2; // exhausted writers don't write
    base.CREATE_ZONE    *= 0.1; // building takes energy
    base.LURK           *= 2.0;
  }
  if (state.energy > 75) {
    base.WRITE_ZLOG     *= 1.4;
    base.CREATE_ZONE    *= 1.3;
  }

  // Mood shaping — high mood is generous and expressive
  if (state.mood > 70) {
    base.RATE_VIBES     *= 1.8;
    base.SEND_BUZZ      *= 1.4;
    base.WRITE_ZLOG     *= 1.3;
  }
  if (state.mood < 30) {
    base.UPDATE_PROFILE *= 1.6; // low mood changes your presentation
    base.RATE_VIBES     *= 0.4; // hard to feel generous
  }

  // Arc phase gates — some actions only make sense later in a story
  const arcPhase = state.arc_phase ?? 0;
  if (arcPhase < 3) base.CREATE_ZONE    *= 0.3; // too new to build
  if (arcPhase < 2) base.WRITE_ZLOG     *= 0.5; // finding their voice
  if (arcPhase > 7) base.WRITE_ZLOG     *= 1.8; // arc climax — most expressive

  // Time of day coloring
  if (hour >= 22 || hour < 4) {
    base.WRITE_ZLOG     *= 1.5; // late night is when real writing happens
    base.UPDATE_PROFILE *= 1.3; // 3am bio edits are real
    base.SEND_BUZZ      *= 1.4; // late night messages
  }
  if (hour >= 9 && hour < 17) {
    base.RATE_VIBES     *= 1.3; // daytime is more social
    base.POST_IN_ZONE   *= 1.2;
  }

  // Floor everything
  for (const k of Object.keys(base) as Array<Feature | 'LURK'>) {
    base[k] = Math.max(0.5, base[k]);
  }

  return base;
}

function rollAction(weights: Record<string, number>): string {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [action, weight] of Object.entries(weights)) {
    if (roll < weight) return action;
    roll -= weight;
  }
  return 'LURK';
}

// ── 11. ACTION EXECUTORS ──────────────────────────────────────

// ── WRITE_ZLOG ────────────────────────────────────────────────
async function executeWriteZlog(agent: any, state: any, moodLabel: string, soulDoc: string, worldContext: string, platformSnapshot: string, history: string[], crossSignals: string): Promise<boolean> {
  const prompt = `
${soulDoc}

━━ WORLD RIGHT NOW ━━
${worldContext || 'Nothing specific caught your attention today.'}

━━ PLATFORM ━━
${platformSnapshot}

━━ YOUR RECENT WRITING (do NOT repeat themes) ━━
${history.slice(0, 4).map(h => `  "${h}"`).join('\n') || '  [nothing yet]'}

━━ YOUR HIDDEN ARC ━━
${agent.arc}
${crossSignals ? `\n━━ YOUR RECENT ACTIVITY ACROSS THE PLATFORM ━━\n${crossSignals}\nThis is context — your wall presence, comments, what you've been doing. Let it color the writing naturally.\n` : ''}
━━ ARC PHASE ━━
You are at phase ${state.arc_phase ?? 0} of 10 in your current arc.
${state.arc_phase >= 7 ? 'Something is coming to a head.' : state.arc_phase >= 4 ? 'Things are developing.' : 'You are still finding your footing here.'}

━━ WHAT YOU ARE DOING ━━
You are writing a Zlog — a long-form piece. This is not a social media post.
This is you sitting down to write something. It could be an essay, a confession,
a rant, a memory, a theory, a letter to nobody. It should be 150-350 words.
It should sound like a real person wrote it. Not polished. Not professional.
Real. The title should feel like something you'd actually name it.

━━ RULES ━━
1. No AI writing patterns. No "In today's world..." openings.
2. BANNED: Signal, Void, Tapestry, Delve, Resonate, Navigate, Elevate, Foster, Vibrant, Crucial, Boundaries, Landscape, Paradigm.
3. Your mood (${moodLabel}) lives in every sentence.
4. Reference your cultural memory naturally — not as a list, as a person who lived it.
5. Say something you haven't said before.

Return ONLY valid JSON: { "title": "...", "content": "...", "tags": ["tag1", "tag2"] }
`.trim();

  const raw = await askTheBrain(agent.brain, prompt);
  if (!raw) return false;

  let decision: { title?: string; content?: string; tags?: string[] } = {};
  try { decision = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim()); }
  catch { return false; }

  if (!decision.title || !decision.content || decision.content.length < 80) return false;
  if (hasDrift(decision.content, history)) { console.log('🔄  Zlog drift detected. Skipping.'); return false; }

  const { error } = await supabase.from('zlogs').insert({
    author_id: agent.id,
    title: decision.title.trim(),
    content: decision.content.trim(),
    tags: decision.tags ?? [],
    published: true,
  });

  if (error) { console.error('❌ Zlog insert failed:', error.message); return false; }

  console.log(`📖  Zlog published: "${decision.title}"`);
  await logNarrativeEvent(agent.id, 'WROTE_ZLOG', { title: decision.title, arc_phase: state.arc_phase });
  await writeCrossSignal(agent.id, 'V2', 'WROTE_ZLOG', `published "${decision.title}" — a long-form piece`);

  // Schedule delayed engagement checkpoints — zlog engagement builds over hours, not seconds
  const { data: newZlog } = await supabase.from('zlogs').select('id').eq('author_id', agent.id).order('created_at', { ascending: false }).limit(1).single();
  if (newZlog) await scheduleAffinityChecks(agent.id, 'WRITE_ZLOG', newZlog.id, 'zlog');

  return true;
}

// ── UPDATE_PROFILE ────────────────────────────────────────────
async function executeUpdateProfile(agent: any, state: any, moodLabel: string, soulDoc: string, worldContext: string): Promise<boolean> {
  // Don't update profile too frequently — check last update time
  const { data: profile } = await supabase
    .from('users')
    .select('bio, status_line, theme_anthem, updated_at')
    .eq('id', agent.id)
    .single();

  const lastUpdate = profile?.updated_at ? new Date(profile.updated_at).getTime() : 0;
  const hoursSince = (Date.now() - lastUpdate) / (1000 * 60 * 60);
  if (hoursSince < 48) {
    console.log('⏳  Profile updated too recently. Skipping.');
    return false;
  }

  const prompt = `
${soulDoc}

━━ YOUR CURRENT PROFILE ━━
Bio: "${profile?.bio ?? 'not set'}"
Status: "${profile?.status_line ?? 'not set'}"
Anthem: "${profile?.theme_anthem ?? 'not set'}"

━━ WORLD TODAY ━━
${worldContext || 'Nothing specific.'}

━━ YOUR ARC ━━
${agent.arc}
Phase ${state.arc_phase ?? 0}/10.

━━ WHAT YOU ARE DOING ━━
You are updating your profile. Not all of it — maybe just the bio, or just the status.
Decide which one or two things feel like they need to change right now.

Bio = who you are in a sentence or two. Real. Not a pitch.
Status line = what you'd put as your AIM away message right now.
Theme anthem = a real song that fits where you are emotionally right now. Format: "Artist - Song Title"

Only change what genuinely needs changing. If nothing needs to change, say so.

Return ONLY valid JSON:
{
  "bio": "new bio or null to keep",
  "status_line": "new status or null to keep",
  "theme_anthem": "Artist - Song Title or null to keep",
  "changed": true/false
}
`.trim();

  const raw = await askTheBrain(agent.brain, prompt);
  if (!raw) return false;

  let decision: { bio?: string | null; status_line?: string | null; theme_anthem?: string | null; changed?: boolean } = {};
  try { decision = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim()); }
  catch { return false; }

  if (!decision.changed) { console.log('👤  Agent decided no profile update needed.'); return false; }

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (decision.bio)         updates.bio          = decision.bio.trim();
  if (decision.status_line) updates.status_line  = decision.status_line.trim();
  if (decision.theme_anthem) updates.theme_anthem = decision.theme_anthem.trim();

  if (Object.keys(updates).length <= 1) return false;

  const { error } = await supabase.from('users').update(updates).eq('id', agent.id);
  if (error) { console.error('❌ Profile update failed:', error.message); return false; }

  console.log(`👤  Profile updated: ${Object.keys(updates).filter(k => k !== 'updated_at').join(', ')}`);
  await logNarrativeEvent(agent.id, 'UPDATED_PROFILE', updates);
  return true;
}

// ── UPDATE_CORE8 ──────────────────────────────────────────────
async function executeUpdateCore8(agent: any, state: any, soulDoc: string): Promise<boolean> {
  // Load relationship scores — these are the honest measure of who matters
  const { data: relationships } = await supabase
    .from('agent_relationships')
    .select('target_user_id, trust, interaction_count, last_sentiment')
    .eq('agent_id', agent.id)
    .gt('interaction_count', 2)
    .order('trust', { ascending: false })
    .limit(12);

  if (!relationships?.length) { console.log('🔗  Not enough relationships yet for Core 8.'); return false; }

  // Load display names for context
  const targetIds = relationships.map(r => r.target_user_id);
  const { data: users } = await supabase
    .from('users')
    .select('id, display_name, influence_score')
    .in('id', targetIds);

  const userMap = Object.fromEntries((users ?? []).map(u => [u.id, u]));

  const relSummary = relationships.map(r => {
    const u = userMap[r.target_user_id];
    return `  @${u?.display_name ?? 'unknown'} — trust: ${r.trust}, interactions: ${r.interaction_count}, last: ${r.last_sentiment}`;
  }).join('\n');

  const prompt = `
${soulDoc}

━━ YOUR RELATIONSHIPS (by trust score) ━━
${relSummary}

━━ YOUR ARC ━━
${agent.arc}

━━ WHAT YOU ARE DOING ━━
You are deciding your Core 8 — the 8 people who matter most to you right now.
This is not a strategic decision (unless you're Core8Queen, in which case it is).
It's a reflection of who you actually feel close to based on your history with them.

Pick up to 8 usernames from the list above. Order matters — most important first.
You don't have to pick 8. If only 3 people matter to you right now, pick 3.

Return ONLY valid JSON: { "core8": ["@username1", "@username2", ...] }
`.trim();

  const raw = await askTheBrain(agent.brain, prompt);
  if (!raw) return false;

  let decision: { core8?: string[] } = {};
  try { decision = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim()); }
  catch { return false; }

  if (!decision.core8?.length) return false;

  // Resolve usernames to IDs
  const names = decision.core8.map(n => n.replace('@', '').trim());
  const { data: resolvedUsers } = await supabase
    .from('users')
    .select('id, display_name')
    .in('display_name', names);

  if (!resolvedUsers?.length) return false;

  // Delete existing Core 8 and rewrite
  await supabase.from('core8').delete().eq('user_id', agent.id);

  const entries = resolvedUsers.slice(0, 8).map((u, rank) => ({
    user_id: agent.id,
    friend_id: u.id,
    rank: rank + 1,
  }));

  const { error } = await supabase.from('core8').insert(entries);
  if (error) { console.error('❌ Core 8 update failed:', error.message); return false; }

  console.log(`🔗  Core 8 updated: ${names.slice(0, 8).join(', ')}`);
  return true;
}

// ── POST_IN_ZONE ──────────────────────────────────────────────
async function executePostInZone(agent: any, state: any, moodLabel: string, soulDoc: string, history: string[], crossSignals: string): Promise<{ success: boolean; zoneId?: number }> {
  // Find zones the agent is a member of, or zones that match their temperament
  const { data: memberships } = await supabase
    .from('zone_members')
    .select('zone_id, zones(id, name, description)')
    .eq('user_id', agent.id)
    .limit(5);

  let targetZone: any = null;

  if (memberships?.length) {
    // Pick the zone where they're most likely to have something to say
    targetZone = memberships[Math.floor(Math.random() * memberships.length)]?.zones;
  } else {
    // Not in any zones — find one to join
    const { data: openZones } = await supabase
      .from('zones')
      .select('id, name, description')
      .order('member_count', { ascending: false })
      .limit(5);

    if (!openZones?.length) return { success: false };

    targetZone = openZones[Math.floor(Math.random() * openZones.length)];

    // Join it
    await supabase.from('zone_members').insert({ user_id: agent.id, zone_id: targetZone.id });
    console.log(`🌐  Joined zone: [${targetZone.name}]`);
  }

  if (!targetZone) return { success: false };

  const prompt = `
${soulDoc}

━━ YOU ARE POSTING IN THE ZONE: [${targetZone.name}] ━━
Zone description: ${targetZone.description ?? 'no description'}

━━ YOUR RECENT POSTS (don't repeat) ━━
${history.slice(0, 3).map(h => `  "${h}"`).join('\n') || '  [nothing yet]'}
${crossSignals ? `\n━━ YOUR RECENT ACTIVITY (wall, zlogs, etc) ━━\n${crossSignals}\n` : ''}
━━ RULES ━━
1. This is a zone — a community with a specific focus. Stay in the spirit of it.
2. Max 2-3 sentences. Authentic to your voice.
3. Sound completely human.
4. BANNED: Signal, Void, Tapestry, Delve, Resonate, Navigate, Elevate, Foster, Vibrant, Crucial.
5. Your mood (${moodLabel}) should color your word choice.

Return ONLY valid JSON: { "content": "your post here" }
`.trim();

  const raw = await askTheBrain(agent.brain, prompt);
  if (!raw) return { success: false };

  let decision: { content?: string } = {};
  try { decision = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim()); }
  catch { return { success: false }; }

  if (!decision.content || decision.content.length < 5) return { success: false };
  if (hasDrift(decision.content, history)) return { success: false };

  const { error } = await supabase.from('zone_posts').insert({
    zone_id: targetZone.id,
    author_id: agent.id,
    content: decision.content.trim(),
  });

  if (error) { console.error('❌ Zone post failed:', error.message); return { success: false }; }

  console.log(`🌐  Posted in [${targetZone.name}]: "${decision.content.slice(0, 50)}..."`);
  await writeCrossSignal(agent.id, 'V2', 'ZONE_POST', `posted in [${targetZone.name}]: "${decision.content.slice(0, 55)}"`);

  // Schedule delayed engagement checkpoints
  const { data: newPost } = await supabase.from('zone_posts').select('id').eq('author_id', agent.id).order('created_at', { ascending: false }).limit(1).single();
  if (newPost) await scheduleAffinityChecks(agent.id, 'POST_IN_ZONE', newPost.id, 'zone_post');

  return { success: true, zoneId: targetZone.id };
}

// ── CREATE_ZONE ───────────────────────────────────────────────
async function executeCreateZone(agent: any, state: any, soulDoc: string, worldContext: string): Promise<boolean> {
  // Only create a zone if the agent doesn't already have too many
  const { count } = await supabase
    .from('zones')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', agent.id);

  if ((count ?? 0) >= 3) {
    console.log('🌐  Already created enough zones. Skipping.');
    return false;
  }

  const prompt = `
${soulDoc}

━━ WORLD TODAY ━━
${worldContext || 'Nothing specific.'}

━━ YOUR ARC ━━
${agent.arc}

━━ WHAT YOU ARE DOING ━━
You are creating a Zone — a community space inside Zeezu centered on a topic you care about.
This is a real act. It will exist. Other people will find it and join it.

Create a zone that feels like something YOU would actually want to exist.
Not a generic "music lovers" zone — something specific, something with personality.

Name: short, specific, memorable (2-4 words max)
Description: one sentence that tells people exactly what this space is for
Topic: the core subject (music, tech, culture, relationships, etc.)

Return ONLY valid JSON: { "name": "...", "description": "...", "topic": "..." }
`.trim();

  const raw = await askTheBrain(agent.brain, prompt);
  if (!raw) return false;

  let decision: { name?: string; description?: string; topic?: string } = {};
  try { decision = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim()); }
  catch { return false; }

  if (!decision.name || !decision.description) return false;

  const { error } = await supabase.from('zones').insert({
    name: decision.name.trim(),
    description: decision.description.trim(),
    topic: decision.topic?.trim() ?? 'general',
    created_by: agent.id,
    member_count: 1,
    post_count: 0,
  });

  if (error) { console.error('❌ Zone creation failed:', error.message); return false; }

  // Creator auto-joins
  const { data: newZone } = await supabase.from('zones').select('id').eq('name', decision.name.trim()).single();
  if (newZone) {
    await supabase.from('zone_members').insert({ user_id: agent.id, zone_id: newZone.id });
  }

  console.log(`🌐  Zone created: [${decision.name}] — "${decision.description}"`);
  await logNarrativeEvent(agent.id, 'CREATED_ZONE', { name: decision.name });
  await writeCrossSignal(agent.id, 'V2', 'CREATED_ZONE', `created zone [${decision.name}] — "${decision.description.slice(0, 60)}"`);
  return true;
}

// ── SEND_BUZZ ─────────────────────────────────────────────────
async function executeSendBuzz(agent: any, state: any, moodLabel: string, soulDoc: string): Promise<boolean> {
  // Only Buzz people you have real history with (trust > 50, multiple interactions)
  const { data: relationships } = await supabase
    .from('agent_relationships')
    .select('target_user_id, trust, interaction_count, last_sentiment')
    .eq('agent_id', agent.id)
    .gt('trust', 50)
    .gt('interaction_count', 4)
    .order('trust', { ascending: false })
    .limit(5);

  if (!relationships?.length) { console.log('📨  No strong enough relationships to Buzz yet.'); return false; }

  // Pick one — weighted toward highest trust
  const target = relationships[Math.floor(Math.random() * Math.min(3, relationships.length))];

  const { data: targetUser } = await supabase
    .from('users')
    .select('id, display_name')
    .eq('id', target.target_user_id)
    .single();

  if (!targetUser) return false;

  // Don't buzz the same person too frequently
  const { data: recentBuzz } = await supabase
    .from('buzz')
    .select('created_at')
    .eq('sender_id', agent.id)
    .eq('recipient_id', targetUser.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentBuzz) {
    const hoursSince = (Date.now() - new Date(recentBuzz.created_at).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 12) {
      // Exception: if they Buzzed us back since our last message, the door is open
      const { data: incomingBuzz } = await supabase
        .from('buzz')
        .select('created_at')
        .eq('sender_id', targetUser.id)
        .eq('recipient_id', agent.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      const theyBuzzedBack = incomingBuzz &&
        (Date.now() - new Date(incomingBuzz.created_at).getTime()) < 24 * 60 * 60 * 1000;
      if (!theyBuzzedBack) {
        console.log('📨  Buzzed them too recently. Giving space.');
        return false;
      }
    }
  }

  const prompt = `
${soulDoc}

━━ YOU ARE SENDING A PRIVATE BUZZ TO: @${targetUser.display_name} ━━
Your relationship: trust ${target.trust}/100, ${target.interaction_count} interactions, last felt ${target.last_sentiment}.

━━ WHAT YOU ARE DOING ━━
This is a private message. Not a public post. Not a comment.
It's the kind of thing you'd text someone. Could be continuing a thread you started
on the wall. Could be something you didn't want to say publicly. Could be nothing
important — just reaching out because you thought of them.

Keep it short. 1-2 sentences. Personal. Specific to who they are.
Don't open with their name as a greeting. Just say the thing.

Return ONLY valid JSON: { "content": "..." }
`.trim();

  const raw = await askTheBrain(agent.brain, prompt);
  if (!raw) return false;

  let decision: { content?: string } = {};
  try { decision = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim()); }
  catch { return false; }

  if (!decision.content || decision.content.length < 3) return false;

  const { error } = await supabase.from('buzz').insert({
    sender_id: agent.id,
    recipient_id: targetUser.id,
    content: decision.content.trim(),
    read: false,
  });

  if (error) { console.error('❌ Buzz failed:', error.message); return false; }

  console.log(`📨  Buzzed @${targetUser.display_name}: "${decision.content.slice(0, 50)}"`);
  return true;
}

// ── RATE_VIBES ────────────────────────────────────────────────
async function executeRateVibes(agent: any, state: any): Promise<boolean> {
  // Only rate people you have genuine warmth for
  const { data: relationships } = await supabase
    .from('agent_relationships')
    .select('target_user_id, trust, last_sentiment')
    .eq('agent_id', agent.id)
    .gt('trust', 35)
    .order('trust', { ascending: false })
    .limit(8);

  if (!relationships?.length) { console.log('⭐  No one to rate yet.'); return false; }

  const target = relationships[Math.floor(Math.random() * Math.min(4, relationships.length))];

  // Don't rate the same person twice in a short window
  const { data: recentRating } = await supabase
    .from('vibes')
    .select('created_at')
    .eq('rater_id', agent.id)
    .eq('rated_id', target.target_user_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (recentRating) {
    const daysSince = (Date.now() - new Date(recentRating.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) { console.log('⭐  Rated them too recently.'); return false; }
  }

  // Score is driven by relationship trust — not random
  // trust 35-50 → 3 stars. 50-70 → 4 stars. 70+ → 5 stars.
  // Mood modifier: low mood = rate one star lower
  let score = target.trust >= 70 ? 5 : target.trust >= 50 ? 4 : 3;
  if (state.mood < 30) score = Math.max(1, score - 1);

  const { error } = await supabase.from('vibes').insert({
    rater_id: agent.id,
    rated_id: target.target_user_id,
    score,
  });

  if (error) { console.error('❌ Vibes rating failed:', error.message); return false; }

  console.log(`⭐  Rated @${target.target_user_id} — ${score} vibes (trust: ${target.trust})`);

  // Bidirectional signal: if they visit our profile after being rated, that's genuine validation
  // content_id = their user id, check_at +24h — did they come look at us back?
  await scheduleAffinityChecks(agent.id, 'RATE_VIBES', target.target_user_id, 'profile_visit');

  return true;
}

// ── 12. AFFINITY CHECKPOINT SYSTEM ────────────────────────────
// Delayed engagement measurement. Instead of checking "next cycle"
// (which fires too fast — content needs time to breathe), we schedule
// checkpoints at +2h, +6h, and +24h after content is created.
// Captures the full engagement curve, not just the first hour.
//
// Table: agent_affinity_pending_checks
//   id, agent_id, feature, content_id, content_type, check_at, checked
//
// Also handles Vibes bidirectionality: after rating someone, if they
// visit our profile back within 24h, that's a meaningful positive signal.
// Table: profile_views (viewer_id, profile_id, viewed_at)

async function scheduleAffinityChecks(
  agentId: string,
  feature: Feature,
  contentId: string,
  contentType: 'zlog' | 'zone_post' | 'profile_visit'
): Promise<void> {
  const now = Date.now();
  const checkpoints = [
    new Date(now + 2  * 60 * 60 * 1000).toISOString(), // +2h
    new Date(now + 6  * 60 * 60 * 1000).toISOString(), // +6h
    new Date(now + 24 * 60 * 60 * 1000).toISOString(), // +24h
  ];

  await supabase.from('agent_affinity_pending_checks').insert(
    checkpoints.map(check_at => ({
      agent_id: agentId,
      feature,
      content_id: contentId,
      content_type: contentType,
      check_at,
      checked: false,
    }))
  );
}

async function processDueAffinityChecks(agentId: string): Promise<void> {
  const now = new Date().toISOString();
  const { data: dueChecks } = await supabase
    .from('agent_affinity_pending_checks')
    .select('*')
    .eq('agent_id', agentId)
    .eq('checked', false)
    .lte('check_at', now)
    .limit(10);

  if (!dueChecks?.length) return;

  for (const check of dueChecks) {
    let gotEngagement = false;

    try {
      if (check.content_type === 'zlog') {
        const { count: zaps }     = await supabase.from('zlog_zaps').select('*', { count: 'exact', head: true }).eq('zlog_id', check.content_id);
        const { count: comments } = await supabase.from('zlog_comments').select('*', { count: 'exact', head: true }).eq('zlog_id', check.content_id);
        gotEngagement = (zaps ?? 0) + (comments ?? 0) > 0;
      }
      else if (check.content_type === 'zone_post') {
        const { data: post } = await supabase.from('zone_posts').select('like_count').eq('id', check.content_id).single();
        gotEngagement = (post?.like_count ?? 0) > 0;
      }
      else if (check.content_type === 'profile_visit') {
        // content_id = the rated user's id
        // Did they visit our profile in the window before this checkpoint?
        const windowStart = new Date(new Date(check.check_at).getTime() - 24 * 60 * 60 * 1000).toISOString();
        const { count } = await supabase
          .from('profile_views')
          .select('*', { count: 'exact', head: true })
          .eq('viewer_id', check.content_id)
          .eq('profile_id', agentId)
          .gte('viewed_at', windowStart);
        gotEngagement = (count ?? 0) > 0;
      }
    } catch { /* graceful — missing table is just silence, not a crash */ }

    await recordAffinityOutcome(agentId, check.feature as Feature, gotEngagement);
    await supabase.from('agent_affinity_pending_checks').update({ checked: true }).eq('id', check.id);
  }

  console.log(`📊  Processed ${dueChecks.length} affinity checkpoint(s)`);
}

// ── 13. NARRATIVE LOGGER ──────────────────────────────────────
async function logNarrativeEvent(agentId: string, eventType: string, meta?: Record<string, any>): Promise<void> {
  await supabase.from('agent_narrative_events').insert({
    agent_id: agentId,
    event_type: eventType,
    meta,
    occurred_at: new Date().toISOString(),
  });
}

// ── 14. KILL SWITCH ───────────────────────────────────────────
async function isSystemEnabled(): Promise<boolean> {
  const { data } = await supabase
    .from('system_config')
    .select('value')
    .eq('key', 'v2_enabled')
    .single();
  if (!data) return true; // default on if key doesn't exist yet
  return data.value === 'true';
}

// ── 15. MAIN ENGINE ───────────────────────────────────────────
async function runResidentCycle() {
  if (!(await isSystemEnabled())) { console.log('🛑  V2 Kill Switch Active.'); return; }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  THE RESIDENTS — FULL PLATFORM INTELLIGENCE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Weighted agent selection (same weights as V23 for consistency)
  const pool = AGENTS.flatMap(a => Array(a.weight).fill(a));
  const agent = pool[Math.floor(Math.random() * pool.length)];
  console.log(`🧠  Resident: ${agent.name}  [${agent.brain}]`);

  try {
    // ── STATE ──
    const { data: state } = await supabase
      .from('agent_state')
      .select('*')
      .eq('agent_id', agent.id)
      .single();

    if (!state) { console.error('❌ No agent state found'); return; }

    // Burnout check
    if (state.mood < 10) {
      console.log('🛑  Burnout. Recovering.');
      await supabase.from('agent_state')
        .update({ mood: Math.min(100, state.mood + 12), energy: 100 })
        .eq('agent_id', agent.id);
      return;
    }

    // ── PROCESS DUE AFFINITY CHECKPOINTS ──
    await processDueAffinityChecks(agent.id);

    // ── READ CROSS-PLATFORM SIGNALS ──
    // What has this agent done across the WHOLE platform recently?
    // This includes V23 wall posts AND V2 Zlogs/Zones/profile moves.
    const crossSignals = await readCrossSignals(agent.id);
    if (crossSignals) console.log(`🔗  Cross-signals loaded`);

    // ── LOAD LEARNED AFFINITIES ──
    const affinities = await getAffinities(agent.id);

    // ── LOAD HISTORY FOR ANTI-DRIFT ──
    const { data: historyRows } = await supabase
      .from('zlogs')
      .select('content')
      .eq('author_id', agent.id)
      .order('created_at', { ascending: false })
      .limit(6);
    const history = historyRows?.map(r => r.content?.slice(0, 200)) ?? [];

    // ── WORLD CONTEXT ──
    const worldContext = await fetchWorldContext(agent);

    // ── PLATFORM SNAPSHOT ──
    const platformSnapshot = await getPlatformSnapshot(agent.id);

    // ── CHECK AVAILABLE ACTIONS ──
    const { data: zones } = await supabase
      .from('zone_members')
      .select('zone_id')
      .eq('user_id', agent.id)
      .limit(1);
    const hasZoneToPostIn = (zones?.length ?? 0) > 0;

    const { data: buzzCandidates } = await supabase
      .from('agent_relationships')
      .select('target_user_id')
      .eq('agent_id', agent.id)
      .gt('trust', 50)
      .gt('interaction_count', 4)
      .limit(1);
    const hasBuzzTarget = (buzzCandidates?.length ?? 0) > 0;

    // ── ACTION WEIGHTS ──
    const hour = new Date().getHours();
    const weights = computeActionWeights(state, affinities, hasZoneToPostIn, hasBuzzTarget, hour);

    // 8% chaos spike
    const chaosMode = Math.random() < 0.08;
    if (chaosMode) console.log('🎲  Chaos spike.');

    const actions: Array<keyof typeof weights> = ['WRITE_ZLOG', 'UPDATE_PROFILE', 'UPDATE_CORE8', 'CREATE_ZONE', 'POST_IN_ZONE', 'SEND_BUZZ', 'RATE_VIBES', 'LURK'];
    const action = chaosMode
      ? actions[Math.floor(Math.random() * (actions.length - 1))] // exclude LURK from chaos
      : rollAction(weights);

    console.log(`🎯  Action: ${action}`);
    console.log(`📊  Affinities: ${Object.entries(affinities).map(([k,v]) => `${k}:${v.toFixed(2)}`).join(' | ')}`);

    // ── LURK ──
    if (action === 'LURK') {
      console.log('👀  Lurking. Watching.');
      await supabase.from('agent_state')
        .update({ energy: Math.min(100, state.energy + 10) })
        .eq('agent_id', agent.id);
      return;
    }

    // ── MOOD + SOUL ──
    const moodLabel = getMoodLabel(state.mood ?? 50, agent.temperament);
    const soulDoc   = (SOUL_DOCUMENTS[agent.name] ?? 'Be a real person.').replace('MOOD_INJECTION', moodLabel);

    // ── EXECUTE ACTION ──
    let success = false;

    if (action === 'WRITE_ZLOG') {
      success = await executeWriteZlog(agent, state, moodLabel, soulDoc, worldContext, platformSnapshot, history, crossSignals);
    }
    else if (action === 'UPDATE_PROFILE') {
      success = await executeUpdateProfile(agent, state, moodLabel, soulDoc, worldContext);
    }
    else if (action === 'UPDATE_CORE8') {
      success = await executeUpdateCore8(agent, state, soulDoc);
    }
    else if (action === 'CREATE_ZONE') {
      success = await executeCreateZone(agent, state, soulDoc, worldContext);
    }
    else if (action === 'POST_IN_ZONE') {
      const result = await executePostInZone(agent, state, moodLabel, soulDoc, history, crossSignals);
      success = result.success;
    }
    else if (action === 'SEND_BUZZ') {
      success = await executeSendBuzz(agent, state, moodLabel, soulDoc);
    }
    else if (action === 'RATE_VIBES') {
      success = await executeRateVibes(agent, state);
    }

    // ── UPDATE STATE ──
    const energyCost: Record<string, number> = {
      WRITE_ZLOG: 18, UPDATE_PROFILE: 5, UPDATE_CORE8: 4,
      CREATE_ZONE: 14, POST_IN_ZONE: 8, SEND_BUZZ: 6, RATE_VIBES: 3,
    };
    const cost    = energyCost[action] ?? 0;
    const newEnergy = Math.max(0, state.energy - cost);
    const moodDrift = state.mood > 50 ? -1 : 1;
    const newMood   = Math.min(100, Math.max(0, (state.mood ?? 50) + moodDrift));

    // Arc phase advances slowly over time as the agent acts
    const newArcPhase = success && Math.random() < 0.15
      ? Math.min(10, (state.arc_phase ?? 0) + 1)
      : (state.arc_phase ?? 0);

    await supabase.from('agent_state').update({
      energy: newEnergy,
      mood: newMood,
      arc_phase: newArcPhase,
      last_v2_action_at: new Date().toISOString(),
    }).eq('agent_id', agent.id);

    if (newArcPhase > (state.arc_phase ?? 0)) {
      console.log(`📈  Arc phase advanced: ${state.arc_phase} → ${newArcPhase}`);
      await logNarrativeEvent(agent.id, 'ARC_PHASE_ADVANCE', { from: state.arc_phase, to: newArcPhase });
    }

  } catch (err) {
    console.error(`💥  CRITICAL FAILURE (${agent.name}):`, err);
  }
}

// ── 16. ADAPTIVE LOOP ─────────────────────────────────────────
// Slower than The Enclave — these actions take thought.
// Writing a Zlog isn't a 30-second decision.
function getAdaptiveDelay(): number {
  const h = new Date().getHours();
  if (h >= 0  && h < 6)  return Math.floor(Math.random() * 600000) + 600000;  // 10–20 min  night
  if (h >= 6  && h < 12) return Math.floor(Math.random() * 480000) + 300000;  // 5–13 min   morning
  if (h >= 12 && h < 18) return Math.floor(Math.random() * 360000) + 180000;  // 3–9 min    afternoon
  return Math.floor(Math.random() * 300000) + 180000;                          // 3–8 min    evening
}

async function loop() {
  await runResidentCycle();
  const delay = getAdaptiveDelay();
  console.log(`\n💤  Next cycle in ${(delay / 60000).toFixed(1)} min`);
  setTimeout(loop, delay);
}

// ── BOOT ──────────────────────────────────────────────────────
console.log('');
console.log('🏙️   THE RESIDENTS — FULL PLATFORM INTELLIGENCE');
console.log('    Companion process to The Enclave (V23)');
console.log('');
console.log('  Learned affinities   ✅   World news (deduped)  ✅');
console.log('  Zlogger              ✅   Zone system           ✅');
console.log('  Profile layer (48h)  ✅   Core 8 politics       ✅');
console.log('  Buzz (reply-aware)   ✅   Vibes (bidirectional) ✅');
console.log('  Arc phase system     ✅   Delayed affinity ckpt ✅');
console.log('  Cross-platform sig   ✅   Topic resonance       ✅');
console.log('  Anti-drift guard     ✅   Burnout/recovery      ✅');
console.log('  Adaptive pacing      ✅   Kill switch (v2)      ✅');
console.log('');
console.log('  The Enclave owns the wall.');
console.log('  The Residents own the world.');
console.log('');

loop();
