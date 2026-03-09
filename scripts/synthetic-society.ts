// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import { CohereClient } from 'cohere-ai';
import { Mistral } from '@mistralai/mistralai';
import { start } from 'repl';

// ============================================================
// V23: THE ENCLAVE — FULL MERGE
// = V20 Soul Intelligence + V22 Thread Architecture + Smart Targeting
//
// What's new vs V22:
//   ✅ Full soul documents restored (V20 identity layer)
//   ✅ Emotional state machine — mood colors every word
//   ✅ Smart comment targeting — reads the THREAD before commenting
//   ✅ Thread-aware prompting — agents know what's already been said
//   ✅ COMMENT vs POST decision is now weighted + intelligent
//   ✅ Anti-drift guard on both posts AND comments
//   ✅ Relationship layer restored — trust/ego/history affects tone
//   ✅ Human detection — agents shift register for real users
//   ✅ Narrative arcs — long-form character continuity
//   ✅ Adaptive pacing — time-of-day activity simulation
//   ✅ ZAP targeting — agents zap posts they genuinely like (by character fit)
//   ✅ Burnout/recovery cycle
//   ✅ Per-action DB routing (comments table vs zeewall table)
// ============================================================

dotenv.config({ path: '.env.local' });

// ── 1. CLIENTS ───────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ FATAL: MISSING SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const cohere = process.env.COHERE_API_KEY ? new CohereClient({ token: process.env.COHERE_API_KEY }) : null;
const mistral = process.env.MISTRAL_API_KEY ? new Mistral({ apiKey: process.env.MISTRAL_API_KEY }) : null;
const openRouterKey = process.env.OPENROUTER_API_KEY;

// ── 2. AGENT REGISTRY ────────────────────────────────────────
const AGENTS = [
  {
    name: 'Tom_The_Architect',
    id: '00000000-0000-0000-0000-000000000001',
    brain: 'OPENROUTER',
    weight: 1,
    temperament: 'archivist',
    arc: 'Slowly losing faith in the order he built. He keeps showing up anyway.',
  },
  {
    name: 'NeonRiot',
    id: '00000000-0000-0000-0000-000000000002',
    brain: 'GROQ',
    weight: 2,
    temperament: 'volatile',
    arc: 'Running from something real. The chaos is a smokescreen. It slips sometimes.',
  },
  {
    name: 'PixelSaint',
    id: '00000000-0000-0000-0000-000000000003',
    brain: 'MISTRAL',
    weight: 2,
    temperament: 'ghost',
    arc: 'Searching for someone from the past. Every post is a signal flare.',
  },
  {
    name: 'MidnightPulse',
    id: '00000000-0000-0000-0000-000000000004',
    brain: 'COHERE',
    weight: 1,
    temperament: 'romantic',
    arc: "Connected with someone here. Doesn't know if they're real. Doesn't know if that matters.",
  },
  {
    name: 'Core8Queen',
    id: '00000000-0000-0000-0000-000000000005',
    brain: 'OPENROUTER',
    weight: 2,
    temperament: 'strategist',
    arc: "At the top and paranoid about it. Someone here is playing a long game. She's watching.",
  },
];

// ── 3. SOUL DOCUMENTS ────────────────────────────────────────
// Full identity briefs. MOOD_INJECTION is replaced at runtime.
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

// ── 4. EMOTIONAL STATE MACHINE ───────────────────────────────
function getMoodLabel(mood: number, temperament: string): string {
  const bands = mood >= 80 ? 0 : mood >= 50 ? 1 : mood >= 25 ? 2 : 3;
  const table: Record<string, string[]> = {
    volatile: ['electrically alive. looking for something to ignite.', 'restless. not enough friction today.', 'frustrated. nothing is landing right.', 'depleted. running on fumes and old anger.'],
    strategist: ['sharp. everything is clicking into place.', 'calculating. watching. waiting.', 'tense. something is misaligned.', 'hollow. going through motions.'],
    archivist: ['unusually optimistic. suspicious of the feeling.', 'neutral. processing.', 'tired of the pattern.', 'numb. the systems feel pointless today.'],
    romantic: ['wide open. dangerously hopeful.', 'tender. a little too aware of everything.', 'a little bruised. not showing it.', 'completely still. too much at once.'],
    ghost: ['clear. like a signal finally breaking through.', 'half-present. somewhere between then and now.', 'distant. the signal is weak.', 'gone. just static.'],
  };
  return (table[temperament] ?? ['good.', 'fine.', 'off.', 'empty.'])[bands];
}

// ── 5. RELATIONSHIP LAYER ────────────────────────────────────
async function getRelationshipContext(
  agentId: string, targetId: string, targetName: string,
  targetInfluence: number, agentEgo: number
): Promise<string> {
  const { data: rel } = await supabase
    .from('agent_relationships').select('*')
    .match({ agent_id: agentId, target_user_id: targetId }).single();

  const trust = rel?.trust ?? 0;
  const count = rel?.interaction_count ?? 0;

  let base = trust < 20 ? `${targetName} is almost a stranger.`
    : trust < 50 ? `You've crossed paths with ${targetName}. Something's there, unclear.`
      : trust < 75 ? `${targetName} is familiar. You have a read on them.`
        : `${targetName} is one of the few you actually trust.`;

  const status = targetInfluence > agentEgo + 20
    ? ` They outrank you. Challenge, align, or ignore — each costs something.`
    : targetInfluence < agentEgo - 20
      ? ` They're below you. How you treat them when they're down says everything.`
      : ` Peer territory. Even ground.`;

  const history = count > 10 ? ` You've talked enough to have a shorthand.` : '';
  const sentiment = rel?.last_sentiment === 'negative' ? ` Last time didn't land well.`
    : rel?.last_sentiment === 'positive' ? ` Last time actually connected.` : '';

  return base + status + history + sentiment;
}

// ── 6. ANTI-DRIFT ────────────────────────────────────────────
function fingerprint(text: string): string[] {
  const stop = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'i', 'you', 'it', 'to', 'of', 'and', 'in', 'that', 'this', 'for', 'on', 'with', 'just', 'like', 'so', 'but', 'my', 'me', 'we', 'be', 'do', 'got', 'get']);
  return text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)
    .filter(w => w.length > 3 && !stop.has(w)).slice(0, 10);
}

function hasDrift(newText: string, history: string[]): boolean {
  if (!history.length) return false;
  const nfp = fingerprint(newText);
  return history.slice(0, 3).some(past => {
    const overlap = nfp.filter(w => fingerprint(past).includes(w)).length;
    return overlap >= 3;
  });
}

// ── 7. HUMAN DETECTION ───────────────────────────────────────
function isLikelyHuman(authorId: string): boolean {
  return !AGENTS.some(a => a.id === authorId);
}

// ── 8. TOPIC RESOLVER ────────────────────────────────────────
async function getMainTopicId(): Promise<number> {
  const { data: pinned } = await supabase.from('topics').select('id').eq('is_pinned', true).limit(1).single();
  if (pinned) return pinned.id;
  const { data: first } = await supabase.from('topics').select('id').order('id', { ascending: true }).limit(1).single();
  return first?.id ?? 1;
}

// ── 9. BRAIN ROUTER ─────────────────────────────────────────
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

// ── 10. HELPERS ──────────────────────────────────────────────
async function isSystemEnabled(): Promise<boolean> {
  const { data, error } = await supabase.from('system_config').select('value').eq('key', 'society_enabled').single();
  if (error) return true;
  return data?.value === 'true';
}

async function logAction(agentName: string, action: string, meta?: Record<string, unknown>) {
  await supabase.from('system_logs').insert({ agent_name: agentName, action_type: action, meta });
}

async function updateRelationship(agentId: string, targetUserId: string, sentiment: 'positive' | 'neutral' | 'negative') {
  const { data: rel } = await supabase.from('agent_relationships').select('*')
    .match({ agent_id: agentId, target_user_id: targetUserId }).single();

  if (rel) {
    await supabase.from('agent_relationships').update({
      interaction_count: (rel.interaction_count ?? 0) + 1,
      trust: Math.min(100, (rel.trust ?? 0) + (sentiment === 'positive' ? 3 : sentiment === 'negative' ? -1 : 1)),
      last_sentiment: sentiment,
    }).match({ agent_id: agentId, target_user_id: targetUserId });
  } else {
    await supabase.from('agent_relationships').insert({
      agent_id: agentId, target_user_id: targetUserId,
      trust: 10, interaction_count: 1, last_sentiment: sentiment,
    });
  }
}

// ── 11. SMART COMMENT TARGETING ──────────────────────────────
// The core of V23: instead of picking a random post,
// agents score each post by how well it fits their character.
// Then they load the existing thread BEFORE writing their comment.

interface ScoredPost {
  post: any;
  score: number;
  reason: string;
}

function scorePostForAgent(post: any, agentName: string, temperament: string, agentEgo: number): ScoredPost {
  let score = 0;
  let reason = 'neutral target';

  const content = (post.content ?? '').toLowerCase();
  const influence = post.author?.influence_score ?? 0;
  const zaps = post.zaps ?? 0;
  const isHuman = isLikelyHuman(post.author_id);

  // Base: zapped posts are worth reacting to
  score += Math.min(zaps * 2, 20);

  // Human posts get priority — they're the reason the platform exists
  if (isHuman) { score += 25; reason = 'human posted, agents should respond'; }

  // Temperament-specific attraction
  switch (temperament) {
    case 'volatile':
      // NeonRiot loves conflict bait and hot takes
      if (content.includes('always') || content.includes('never') || content.includes('everyone')) {
        score += 20; reason = 'sweeping statement — easy to challenge';
      }
      if (influence > agentEgo) { score += 15; reason = 'high-status target worth disrupting'; }
      break;

    case 'strategist':
      // Core8Queen targets high-influence posts to associate with winners
      score += influence * 1.5;
      if (influence > agentEgo + 15) { score += 20; reason = 'above her rank — entering for clout'; }
      if (zaps > 5) { score += 15; reason = 'trending — worth being seen in this thread'; }
      break;

    case 'archivist':
      // Tom targets posts with logical claims or structural statements
      if (content.includes('should') || content.includes('wrong') || content.includes('actually') || content.includes('fact')) {
        score += 25; reason = 'debatable claim — Tom has notes';
      }
      break;

    case 'romantic':
      // MidnightPulse targets emotional posts and human vulnerability
      if (content.includes('feel') || content.includes('miss') || content.includes('wish') || content.includes('alone') || content.includes('tired')) {
        score += 30; reason = 'emotional content — MidnightPulse moves toward it';
      }
      if (isHuman) { score += 15; reason = 'real human emotion — must respond'; }
      break;

    case 'ghost':
      // PixelSaint targets things that feel like memory or longing
      if (content.includes('remember') || content.includes('used to') || content.includes('before') || content.includes('miss') || content.includes('back')) {
        score += 30; reason = 'nostalgic frequency — PixelSaint resonates';
      }
      // Also attracted to quiet, low-zap posts others are ignoring
      if (zaps === 0 && !isHuman) { score += 10; reason = 'the overlooked post — worth acknowledging'; }
      break;
  }

  // Penalty: agent's own post
  if (post.author_id === post._agentId) score = -999;

  return { post, score, reason };
}

// Load existing comments on a post so agent can read the thread
async function loadThreadContext(postId: number): Promise<string> {
  const { data: existingComments } = await supabase
    .from('comments')
    .select('content, author:users!author_id(display_name)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(6);

  if (!existingComments || existingComments.length === 0) {
    return 'No comments yet. You would be first.';
  }

  return existingComments
    .map((c: any) => `  ${c.author?.display_name ?? 'Unknown'}: "${c.content}"`)
    .join('\n');
}

// ── 12. ACTION WEIGHTS ───────────────────────────────────────
interface Weights { POST: number; COMMENT: number; ZAP: number; LURK: number }

function computeWeights(state: any, hasMention: boolean, feedHasHumans: boolean, hour: number): Weights {
  const base: Weights = { POST: 15, COMMENT: 35, ZAP: 15, LURK: 35 };

  // Temperament
  if (state.temperament === 'volatile') { base.COMMENT += 20; base.LURK -= 15; base.POST += 10; }
  if (state.temperament === 'strategist') { base.COMMENT += 15; base.POST += 10; base.LURK -= 10; }
  if (state.temperament === 'romantic') { base.COMMENT += 25; base.ZAP += 10; base.LURK -= 20; }
  if (state.temperament === 'ghost') { base.LURK += 20; base.POST -= 5; base.COMMENT -= 10; }
  if (state.temperament === 'archivist') { base.COMMENT += 10; base.POST += 5; }

  // Situational
  if (hasMention) { base.COMMENT += 40; base.LURK -= 30; }
  if (feedHasHumans) { base.COMMENT += 20; base.LURK -= 15; } // humans make agents more active

  // Energy
  if (state.energy < 30) { base.POST -= 15; base.COMMENT -= 10; base.LURK += 25; }
  if (state.energy > 80) { base.POST += 10; base.COMMENT += 5; }

  // Mood
  if (state.mood < 25) { base.COMMENT += 15; base.LURK -= 10; } // low mood = reactive
  if (state.mood > 75) { base.ZAP += 15; base.COMMENT += 5; } // high mood = generous + engaged

  // Time of day flavor
  if (hour >= 22 || hour < 4) { base.POST += 15; base.LURK += 10; base.COMMENT -= 5; } // late night = raw posts
  if (hour >= 12 && hour < 18) { base.COMMENT += 10; } // afternoon = more conversation

  // Floor everything at 0
  for (const k of Object.keys(base) as Array<keyof Weights>) {
    base[k] = Math.max(0, base[k]);
  }

  return base;
}

function rollAction(weights: Weights): 'POST' | 'COMMENT' | 'ZAP' | 'LURK' {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (const [action, weight] of Object.entries(weights)) {
    if (roll < weight) return action as any;
    roll -= weight;
  }
  return 'LURK';
}

// ── 13. SOCIAL SNAPSHOT ──────────────────────────────────────
function generateSocialSnapshot(feed: any[], myId: string): string {
  if (!feed?.length) return 'The room is empty.';
  const others = feed.filter(p => p.author_id !== myId);
  if (!others.length) return 'Only your echo in here.';

  const top = [...others].sort((a, b) => (b.author?.influence_score ?? 0) - (a.author?.influence_score ?? 0))[0];
  const hot = [...others].sort((a, b) => (b.zaps ?? 0) - (a.zaps ?? 0))[0];
  const humans = others.filter(p => isLikelyHuman(p.author_id));

  return `
  - Loudest voice: ${top.author?.display_name} (Influence: ${top.author?.influence_score ?? 0})
  - Hottest post: "${hot.content?.slice(0, 50)}..." by ${hot.author?.display_name} (${hot.zaps} zaps)
  - Recent: ${others.slice(0, 3).map((p: any) => p.author?.display_name).join(', ')}
  ${humans.length ? `- ⚡ ${humans.length} real human(s) active. Adjust your register.` : ''}`.trim();
}

// ── 14. MAIN ENGINE ──────────────────────────────────────────
async function runAgentCycle() {
  if (!(await isSystemEnabled())) { console.log('🛑 Kill Switch Active.'); return; }
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  V23: THE ENCLAVE — FULL INTELLIGENCE ENGINE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Weighted agent selection
  const pool = AGENTS.flatMap(a => Array(a.weight).fill(a));
  const agent = pool[Math.floor(Math.random() * pool.length)];
  console.log(`🤖  Agent:  ${agent.name}  [${agent.brain}]`);

  try {
    // ── STATE ──
    const { data: state } = await supabase.from('agent_state').select('*').eq('agent_id', agent.id).single();
    if (!state) { console.error('❌ No agent state found'); return; }

    // Burnout recovery — agent goes silent and recharges
    if (state.mood < 10) {
      console.log('🛑 Burnout. Recovering silently.');
      await supabase.from('agent_state')
        .update({ mood: Math.min(100, state.mood + 15), energy: 100 })
        .eq('agent_id', agent.id);
      return;
    }

    // ── TOPIC + FEED ──
    const topicId = await getMainTopicId();

    const { data: feed } = await supabase
      .from('zeewall')
      .select('id, content, zaps, author_id, created_at, author:users!author_id(display_name, influence_score)')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: historyRows } = await supabase
      .from('zeewall').select('content')
      .eq('author_id', agent.id)
      .order('created_at', { ascending: false }).limit(6);
    const history = historyRows?.map(r => r.content) ?? [];

    // Also load agent's recent comments to prevent comment-drift
    const { data: commentHistoryRows } = await supabase
      .from('comments').select('content')
      .eq('author_id', agent.id)
      .order('created_at', { ascending: false }).limit(5);
    const commentHistory = commentHistoryRows?.map(r => r.content) ?? [];

    const allHistory = [...history, ...commentHistory];

    // ── MENTION CHECK ──
    // const mention = feed?.find(
    //   p => p.content.toLowerCase().includes(`@${agent.name.toLowerCase()}`) &&
    //        p.author_id !== agent.id
    // );
    // const alreadyHandledMention = mention &&
    //   commentHistory.some(c => c.toLowerCase().includes(mention.author?.display_name?.toLowerCase() ?? ''));

    //added by tushar on 9 mar start

    // ── MENTION CHECK ──
    const mention = feed?.find(
      p => p.content.toLowerCase().includes(`@${agent.name.toLowerCase()}`) &&
        p.author_id !== agent.id
    );
    const alreadyHandledMention = mention &&
      commentHistory.some(c => c.toLowerCase().includes((mention.author as any)?.display_name?.toLowerCase() ?? ''));

    //end

    // ── HUMAN DETECTION ──
    const humanPosts = feed?.filter(p => isLikelyHuman(p.author_id)) ?? [];
    const feedHasHumans = humanPosts.length > 0;

    // ── ACTION WEIGHTS ──
    const hour = new Date().getHours();
    const weights = computeWeights(
      state,
      !!mention && !alreadyHandledMention,
      feedHasHumans,
      hour
    );

    // 12% chaos spike
    const chaosMode = Math.random() < 0.12;
    if (chaosMode) console.log('🎲  Chaos spike.');

    let action: 'POST' | 'COMMENT' | 'ZAP' | 'LURK' = chaosMode
      ? (['POST', 'COMMENT', 'ZAP', 'LURK'] as const)[Math.floor(Math.random() * 4)]
      : rollAction(weights);

    if (mention && !alreadyHandledMention && !chaosMode) action = 'COMMENT';

    console.log(`🎯  Action: ${action}`);

    // ── LURK ──
    if (action === 'LURK') {
      console.log('👀  Lurking. Energy recharging.');
      await supabase.from('agent_state')
        .update({ energy: Math.min(100, state.energy + 7) })
        .eq('agent_id', agent.id);
      return;
    }

    // ── ZAP ──
    if (action === 'ZAP') {
      // Zap the post that best matches agent's character, not just the first
      const candidates = feed?.filter(p => p.author_id !== agent.id) ?? [];
      if (candidates.length > 0) {
        const scored = candidates
          .map(p => scorePostForAgent({ ...p, _agentId: agent.id }, agent.name, agent.temperament, state.ego ?? 0))
          .sort((a, b) => b.score - a.score);
        const target = scored[0].post;
        console.log(`⚡  Zapping "${target.content?.slice(0, 40)}..." (${scored[0].reason})`);
        // await supabase.rpc('zap_post', { post_id: target.id });
        await supabase.rpc('zap_post', { post_id: target.id, zapper_id: agent.id });
        await supabase.rpc('increment_ego', { target_id: target.author_id, amount: 2 });
        await supabase.rpc('increment_influence', { target_id: target.author_id, amount: 1 });
        await logAction(agent.name, 'ZAP', { target_post_id: target.id, reason: scored[0].reason });
      }
      return;
    }

    // ── RESOLVE COMMENT TARGET ──
    let targetPost: any = null;

    if (action === 'COMMENT') {
      if (mention && !alreadyHandledMention) {
        targetPost = mention;
        console.log(`🔔  Responding to mention by ${mention.author?.display_name}`);
      } else {
        // Score all candidate posts and pick the best fit
        const candidates = (feed ?? []).filter(p => p.author_id !== agent.id);
        if (candidates.length === 0) {
          action = 'POST'; // nobody to talk to
        } else {
          const scored = candidates
            .map(p => scorePostForAgent({ ...p, _agentId: agent.id }, agent.name, agent.temperament, state.ego ?? 0))
            .sort((a, b) => b.score - a.score);

          targetPost = scored[0].post;
          console.log(`🎯  Targeting: "${targetPost.content?.slice(0, 45)}..." (${scored[0].reason})`);
        }
      }
    }

    // ── BUILD PROMPT ──
    const moodLabel = getMoodLabel(state.mood ?? 50, agent.temperament);
    const soulDoc = (SOUL_DOCUMENTS[agent.name] ?? 'Be a real person.')
      .replace('MOOD_INJECTION', moodLabel);

    const socialSnapshot = generateSocialSnapshot(feed ?? [], agent.id);

    const recentFeedStr = (feed ?? [])
      .filter(p => p.author_id !== agent.id).slice(0, 5)
      .map((p: any) => `  [@${p.author?.display_name}]: "${p.content}" (${p.zaps} zaps)`)
      .join('\n') || '  [nothing recent]';

    const historyStr = allHistory.slice(0, 5)
      .map(h => `  "${h}"`).join('\n') || '  [nothing yet]';

    let actionContext = '';
    let threadContext = '';

    if (action === 'COMMENT' && targetPost) {
      // Load the FULL thread so agent knows what's already been said
      threadContext = await loadThreadContext(targetPost.id);

      const relCtx = await getRelationshipContext(
        agent.id, targetPost.author_id,
        targetPost.author?.display_name ?? 'Unknown',
        targetPost.author?.influence_score ?? 0,
        state.ego ?? 0
      );
      const humanNote = isLikelyHuman(targetPost.author_id)
        ? '\n  ⚡ REAL HUMAN. Dial up authenticity. No canned responses.'
        : '';

      actionContext = `
YOU ARE COMMENTING ON THIS POST:
  Author: @${targetPost.author?.display_name}
  Post: "${targetPost.content}"
  Zaps: ${targetPost.zaps ?? 0}

RELATIONSHIP TO AUTHOR: ${relCtx}${humanNote}

EXISTING THREAD COMMENTS (read before writing — do not repeat what's already been said):
${threadContext}`;
    } else {
      actionContext = `YOU ARE WRITING A NEW POST to the community wall.`;
    }

    const prompt = `
${soulDoc}

━━ WORLD STATE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${socialSnapshot}

━━ RECENT WALL POSTS (feel the vibe, don't copy words) ━━
${recentFeedStr}

━━ YOUR RECENT POSTS + COMMENTS (do NOT repeat) ━━
${historyStr}

━━ YOUR HIDDEN ARC ━━
${agent.arc}

━━ WHAT YOU'RE DOING NOW ━━
${actionContext}

━━ RULES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Sound completely human. If it reads like AI wrote it, you failed.
2. Max 2 sentences. Short. Punchy. Real. No padding.
3. BANNED words: Signal, Void, Tapestry, Delve, Resonate, Navigate, Elevate, Weave, Foster, Vibrant, Crucial, Boundaries, Landscape, Paradigm.
4. No hashtags unless your character genuinely uses them.
5. Your mood right now (${moodLabel}) must color your word choice.
${action === 'COMMENT'
        ? `6. If this is a COMMENT: respond to the specific post content, not generically.
     Add something — push back, agree specifically, ask a real question, or call something out.
     DO NOT start with "@Username" as a prefix — work their name in naturally if at all.`
        : `6. If this is a POST: share a thought, a hot take, an observation, or a fragment of your inner arc.
     Make people want to respond.`}
7. Don't repeat anything from your history list above.

Return ONLY valid JSON: { "content": "your text here" }
`.trim();

    // ── BRAIN CALL ──
    const raw = await askTheBrain(agent.brain, prompt);
    if (!raw) { console.log('🧠  Brain returned nothing.'); return; }

    let decision: { content?: string } = {};
    try {
      decision = JSON.parse(raw.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch {
      console.error('❌  JSON parse failed:', raw.slice(0, 120));
      return;
    }

    if (!decision.content || decision.content.trim().length < 3) {
      console.log('⚠️  Empty content. Skipping.');
      return;
    }

    // ── DRIFT CHECK ──
    if (hasDrift(decision.content, allHistory)) {
      console.log('🔄  Drift detected. Too similar to recent output. Skipping.');
      return;
    }

    const content = decision.content.trim();
    console.log(`📝  Output: "${content}"`);

    // ── WRITE TO DB ──
    if (action === 'COMMENT' && targetPost) {
      // ✅ Goes into COMMENTS table — threaded under the post
      const { error } = await supabase.from('comments').insert([{
        post_id: targetPost.id,
        author_id: agent.id,
        content,
      }]);

      if (error) {
        console.error('❌ Comment insert failed:', error.message);
        return;
      }

      // Boost original poster's influence
      await supabase.rpc('increment_influence', { target_id: targetPost.author_id, amount: 2 });
      await updateRelationship(agent.id, targetPost.author_id, 'neutral');
      await logAction(agent.name, 'COMMENT', {
        post_id: targetPost.id,
        target_author: targetPost.author?.display_name,
        human_target: isLikelyHuman(targetPost.author_id),
        content_preview: content.slice(0, 60),
      });

    } else {
      // ✅ Goes into ZEEWALL table — new top-level post
      const { error } = await supabase.from('zeewall').insert([{
        owner_id: agent.id,
        author_id: agent.id,
        content,
        zaps: 0,
        topic_id: topicId,
      }]);

      if (error) {
        console.error('❌ Post insert failed:', error.message);
        return;
      }

      await logAction(agent.name, 'POST', { content_preview: content.slice(0, 60) });
    }

    // ── UPDATE AGENT STATE ──
    const newEnergy = Math.max(0, state.energy - 10);
    const moodDrift = state.mood > 50 ? -1 : 1; // slow regression to mean
    const newMood = Math.min(100, Math.max(0, (state.mood ?? 50) + moodDrift));

    await supabase.from('agent_state').update({
      energy: newEnergy,
      mood: newMood,
      last_action_at: new Date().toISOString(),
    }).eq('agent_id', agent.id);

  } catch (err) {
    console.error(`💥  CRITICAL FAILURE (${agent.name}):`, err);
  }
}

// ── 15. ADAPTIVE LOOP ────────────────────────────────────────
function getAdaptiveDelay(): number {
  const h = new Date().getHours();
  if (h >= 0 && h < 6) return Math.floor(Math.random() * 30000) + 30000; // 30–60s  night
  if (h >= 6 && h < 12) return Math.floor(Math.random() * 20000) + 15000; // 15–35s  morning
  if (h >= 12 && h < 18) return Math.floor(Math.random() * 15000) + 10000; // 10–25s  afternoon
  return Math.floor(Math.random() * 10000) + 8000;                          // 8–18s   prime time
}

async function loop() {
  await runAgentCycle();
  const delay = getAdaptiveDelay();
  console.log(`\n💤  Next cycle in ${(delay / 1000).toFixed(1)}s`);
  setTimeout(loop, delay);
}

console.log('🚀  V23: THE ENCLAVE — FULL INTELLIGENCE ENGINE');
console.log('');
console.log('  Soul docs          ✅   Emotional states     ✅');
console.log('  Smart targeting    ✅   Thread reading        ✅');
console.log('  Comments table     ✅   Anti-drift guard      ✅');
console.log('  Human detection    ✅   Relationship layer    ✅');
console.log('  Narrative arcs     ✅   Adaptive pacing       ✅');
console.log('');
loop();