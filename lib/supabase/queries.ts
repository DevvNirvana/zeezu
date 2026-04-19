import { supabase } from "./client";
import { generateZid } from "../utils/generateZid";

// ── SESSION SYNC ─────────────────────────────────────────────
// On every login, checks if user exists in public.users.
// If not, auto-creates their profile + generates a ZID.
// _isNew: true  → first ever login, redirect to onboarding
// _isNew: false → returning user, go straight to dashboard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SyncedUser = Record<string, any> & { _isNew: boolean };

export async function syncUserSession(): Promise<SyncedUser | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existingUser) {
    // Fire-and-forget — refresh presence. Try with online_status first,
    // fall back to just last_seen_at if column doesn't exist yet.
    supabase.from("users")
      .update({ last_seen_at: new Date().toISOString(), online_status: "online" })
      .eq("id", user.id)
      .then(({ error }) => {
        if (error) {
          // Column may not exist yet — update only last_seen_at
          supabase.from("users").update({ last_seen_at: new Date().toISOString() }).eq("id", user.id);
        }
      });
    return { ...existingUser, _isNew: false };
  }

  // New user — generate ZID and create profile
  const newZid = generateZid();

  const { data: newUser, error } = await supabase
    .from("users")
    .insert([
      {
        id: user.id,
        zid: newZid,
        display_name: user.email?.split("@")[0] || "New_Hacker",
        mdx_profile: "# Welcome to my profile! \n\nDrop a Zap on my wall.",
        theme_track_url: "",
      },
    ])
    .select()
    .single();

  if (error) {
    // Log actual fields — Supabase errors don't serialize with console.error({})
    console.error("Identity Sync Error:", {
      message: error.message,
      code:    error.code,
      details: error.details,
      hint:    error.hint,
    });

    // code 23505 = unique_violation — user row was created by a concurrent request.
    // Recover gracefully: fetch the row that already exists.
    if (error.code === "23505") {
      const { data: recovered } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();
      if (recovered) return { ...recovered, _isNew: true };
    }

    return null;
  }

  return { ...newUser, _isNew: true };
}

// ── ZEEWALL ──────────────────────────────────────────────────
export async function getZeeWallPosts() {
  const { data, error } = await supabase
    .from("zeewall")
    .select(`
      id,
      content,
      created_at,
      zaps,
      author:users!author_id (display_name, zid)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching wall:", error);
    return [];
  }
  return data;
}

export async function postToZeeWall(content: string, userId: string) {
  const { error } = await supabase.from("zeewall").insert([
    {
      owner_id: userId,
      author_id: userId,
      content,
    },
  ]);

  if (error) {
    console.error("Error posting:", error);
    return null;
  }
  return true;
}

// ── ZAPS ─────────────────────────────────────────────────────
// For human users — uses the toggle_zap RPC (prevents double-zap)
export async function toggleZap(postId: number) {
  const { error } = await supabase.rpc("toggle_zap", { target_post_id: postId });
  if (error) {
    console.error("Error toggling zap:", error);
    return null;
  }
  return true;
}

// Returns array of post IDs the current user has already zapped
export async function getMyZaps() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("zaps")
    .select("post_id")
    .eq("user_id", user.id);

  return data?.map((z) => z.post_id) || [];
}

// ── DASHBOARD STATS ──────────────────────────────────────────
// FIX: Was incorrectly querying a non-existent 'buzzes' table.
// Buzzes = messages where is_buzz = true.
// Comments stat = unread notifications count (covers comments + mentions).
export async function getDashboardStats() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { zaps: 0, buzzes: 0, comments: 0 };

  // 1. Unread Buzzes — messages where is_buzz=true sent to this user
  const { count: buzzCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("is_buzz", true)
    .eq("is_read", false);

  // 2. Total Zaps across all my posts
  const { data: myPosts } = await supabase
    .from("zeewall")
    .select("zaps")
    .eq("owner_id", user.id);

  const totalZaps =
    myPosts?.reduce((acc, curr) => acc + (curr.zaps || 0), 0) || 0;

  // 3. Unread notifications (comments, mentions, system — everything)
  const { count: notifCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return {
    zaps: totalZaps,
    buzzes: buzzCount || 0,
    comments: notifCount || 0,
  };
}

// ── CORE 8 ───────────────────────────────────────────────────
export async function getCoreEight(userId: string) {
  const { data, error } = await supabase
    .from("core_eight")
    .select(`
      position,
      friend:users!fk_core_friend (id, display_name, zid, birth_year, birth_month, birth_day, agent_state(agent_id))
    `)
    .eq("user_id", userId)
    .order("position", { ascending: true });

  if (error) {
    console.error("Error fetching Core 8:", error);
    return [];
  }
  return data;
}

export async function searchUsers(query: string) {
  if (!query || query.trim().length < 1) return [];

  const { data: { user } } = await supabase.auth.getUser();
  const trimmed = query.trim();

  const { data } = await supabase
    .from("users")
    .select("id, display_name, zid, avatar_url, status_message, created_at, birth_year, birth_month, birth_day, last_seen_at, online_status, influence_score")
    .or(`display_name.ilike.%${trimmed}%,zid.ilike.%${trimmed}%`)
    .limit(20);

  // Filter out self
  return (data || []).filter(u => u.id !== user?.id);
}

/** Discover users — browse all users (paginated), excluding self */
export async function discoverUsers(page = 0, limit = 20) {
  const { data: { user } } = await supabase.auth.getUser();

  const from = page * limit;
  const to = from + limit - 1;

  const { data, count } = await supabase
    .from("users")
    .select("id, display_name, zid, avatar_url, status_message, created_at, birth_year, birth_month, birth_day, last_seen_at, online_status, influence_score", { count: "exact" })
    .neq("id", user?.id || "")
    .order("created_at", { ascending: false })
    .range(from, to);

  return { users: data || [], total: count || 0 };
}

export async function addToCoreEight(friendId: string, position: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Validate: target must be an accepted friend (or an AI agent)
  const status = await getFriendshipStatus(user.id, friendId);
  if (status.status !== "friends") {
    // Allow AI agents (ghost users) to bypass friendship check
    const { data: agentCheck } = await supabase
      .from("agent_state")
      .select("agent_id")
      .eq("agent_id", friendId)
      .single();
    if (!agentCheck) {
      console.error("Cannot add non-friend to Core 8");
      return;
    }
  }

  // Upsert — inserts if slot is empty, replaces if occupied
  const { error } = await supabase.from("core_eight").upsert(
    {
      user_id: user.id,
      friend_id: friendId,
      position,
    },
    { onConflict: "user_id,position" }
  );

  if (error) console.error("Error updating Core 8:", error);
}

export async function removeFromCoreEight(position: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from("core_eight")
    .delete()
    .eq("user_id", user.id)
    .eq("position", position);

  if (error) console.error("Error removing from Core 8:", error);
}

// ── FRIENDS ──────────────────────────────────────────────────

export type FriendshipStatus = {
  status: "none" | "pending_sent" | "pending_received" | "friends";
  requestId: number | null;
};

/**
 * Get the friendship status between two users.
 * Returns the status and the request ID (if any).
 */
export async function getFriendshipStatus(
  myId: string,
  targetId: string
): Promise<FriendshipStatus> {
  if (myId === targetId) return { status: "none", requestId: null };

  // Check for a request between these two users (in either direction)
  const { data } = await supabase
    .from("friend_requests")
    .select("id, sender_id, receiver_id, status")
    .or(
      `and(sender_id.eq.${myId},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${myId})`
    )
    .limit(1)
    .single();

  if (!data) return { status: "none", requestId: null };

  if (data.status === "accepted") {
    return { status: "friends", requestId: data.id };
  }

  if (data.status === "pending") {
    if (data.sender_id === myId) {
      return { status: "pending_sent", requestId: data.id };
    }
    return { status: "pending_received", requestId: data.id };
  }

  // Declined requests are treated as "none" — can re-send
  return { status: "none", requestId: null };
}

/** Send a friend request to a target user */
export async function sendFriendRequest(targetId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Check if a declined request already exists (allow re-send)
  const { data: existing } = await supabase
    .from("friend_requests")
    .select("id, status")
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${user.id})`
    )
    .limit(1)
    .single();

  if (existing) {
    if (existing.status === "declined") {
      // Delete the declined row so we can insert fresh
      await supabase.from("friend_requests").delete().eq("id", existing.id);
    } else {
      // Already pending or accepted
      return existing;
    }
  }

  const { data, error } = await supabase
    .from("friend_requests")
    .insert({ sender_id: user.id, receiver_id: targetId })
    .select()
    .single();

  if (error) {
    console.error("Error sending friend request:", error);
    return null;
  }
  return data;
}

/** Cancel a pending friend request (sender only) */
export async function cancelFriendRequest(requestId: number) {
  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId);

  if (error) console.error("Error cancelling request:", error);
}

/** Accept or decline a friend request (receiver only) */
export async function respondToFriendRequest(
  requestId: number,
  accept: boolean
) {
  const { error } = await supabase
    .from("friend_requests")
    .update({
      status: accept ? "accepted" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (error) console.error("Error responding to request:", error);
  return !error;
}

/** Remove a friend (deletes the accepted request row) */
export async function removeFriend(requestId: number) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Get the friend's ID before deleting so we can clean Core 8
  const { data: req } = await supabase
    .from("friend_requests")
    .select("sender_id, receiver_id")
    .eq("id", requestId)
    .single();

  if (req) {
    const friendId =
      req.sender_id === user.id ? req.receiver_id : req.sender_id;

    // Remove them from our Core 8 if present
    await supabase
      .from("core_eight")
      .delete()
      .eq("user_id", user.id)
      .eq("friend_id", friendId);
  }

  // Delete the friendship row
  const { error } = await supabase
    .from("friend_requests")
    .delete()
    .eq("id", requestId);

  if (error) console.error("Error removing friend:", error);
}

/** Get all accepted friends for a user */
export async function getFriends(userId: string) {
  const normalize = (data: any[]) =>
    data.map((row: any) => {
      const isSender = row.sender_id === userId;
      const friend = isSender ? row.receiver : row.sender;
      return { requestId: row.id, friendSince: row.created_at, ...friend };
    });

  const base = `.eq("status","accepted").or("sender_id.eq.${userId},receiver_id.eq.${userId}")`;
  void base; // just for reference

  // Full query including recently added presence columns
  const { data, error } = await supabase
    .from("friend_requests")
    .select(`
      id, sender_id, receiver_id, created_at,
      sender:users!sender_id   (id, display_name, zid, avatar_url, birth_year, birth_month, birth_day, agent_state(agent_id), influence_score, theme_track_url, last_seen_at, online_status),
      receiver:users!receiver_id (id, display_name, zid, avatar_url, birth_year, birth_month, birth_day, agent_state(agent_id), influence_score, theme_track_url, last_seen_at, online_status)
    `)
    .eq("status", "accepted")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  if (!error) return normalize(data || []);

  // Graceful fallback — presence columns may not exist yet in DB
  console.warn("getFriends: falling back (missing column?):", error.message ?? error);
  const { data: fallback, error: fbErr } = await supabase
    .from("friend_requests")
    .select(`
      id, sender_id, receiver_id, created_at,
      sender:users!sender_id   (id, display_name, zid, avatar_url, birth_year, birth_month, birth_day, agent_state(agent_id), influence_score, theme_track_url),
      receiver:users!receiver_id (id, display_name, zid, avatar_url, birth_year, birth_month, birth_day, agent_state(agent_id), influence_score, theme_track_url)
    `)
    .eq("status", "accepted")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  if (fbErr) {
    console.error("Error fetching friends:", fbErr.message ?? fbErr);
    return [];
  }
  return normalize(fallback || []);
}

/** Update the current user's online status. */
export type OnlineStatus = "online" | "busy" | "away" | "offline";
export async function updateOnlineStatus(status: OnlineStatus) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("users")
    .update({ online_status: status, last_seen_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) console.error("Error updating online status:", error);
}

/** Get mutual friends between two users.
 *  Requires RLS policy: authenticated users can SELECT where status = 'accepted' */
export async function getMutualFriends(viewerId: string, profileUserId: string) {
  const [{ data: viewerRows }, { data: profileRows }] = await Promise.all([
    supabase
      .from("friend_requests")
      .select("sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${viewerId},receiver_id.eq.${viewerId}`),
    supabase
      .from("friend_requests")
      .select("sender_id, receiver_id")
      .eq("status", "accepted")
      .or(`sender_id.eq.${profileUserId},receiver_id.eq.${profileUserId}`),
  ]);

  if (!viewerRows || !profileRows) return [];

  const viewerFriendIds = new Set(
    viewerRows.map(r => r.sender_id === viewerId ? r.receiver_id : r.sender_id)
  );
  const profileFriendIds = new Set(
    profileRows.map(r => r.sender_id === profileUserId ? r.receiver_id : r.sender_id)
  );

  const mutualIds = [...viewerFriendIds].filter(
    id => profileFriendIds.has(id) && id !== viewerId && id !== profileUserId
  );
  if (!mutualIds.length) return [];

  const { data: users } = await supabase
    .from("users")
    .select("id, display_name, zid, avatar_url")
    .in("id", mutualIds);

  return users ?? [];
}

/** Get friend count for a user */
export async function getFriendCount(userId: string) {
  const { count } = await supabase
    .from("friend_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "accepted")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  return count || 0;
}

/** Get incoming pending friend requests for the current user */
export async function getIncomingRequests() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("friend_requests")
    .select(`
      id,
      created_at,
      sender:users!sender_id (id, display_name, zid, avatar_url, birth_year, birth_month, birth_day, agent_state(agent_id))
    `)
    .eq("receiver_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching requests:", error);
    return [];
  }
  return data || [];
}

/** Search friends only (for Core 8 picker) */
export async function searchFriends(query: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const friends = await getFriends(user.id);

  if (!query.trim()) return friends;

  const q = query.toLowerCase();
  return friends.filter(
    (f: any) =>
      f.display_name?.toLowerCase().includes(q) ||
      f.zid?.toLowerCase().includes(q)
  );
}

// ── MESSAGES / BUZZ ──────────────────────────────────────────

export type Conversation = {
  partnerId: string;
  partnerName: string;
  partnerZid: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageIsBuzz: boolean;
  lastMessageIsFromMe: boolean;
  unreadCount: number;
};

/** Get all conversations for the current user, grouped by partner */
export async function getConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Fetch all messages involving this user
  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      sender_id,
      receiver_id,
      content,
      is_buzz,
      is_read,
      created_at,
      sender:users!sender_id (id, display_name, zid, avatar_url),
      receiver:users!receiver_id (id, display_name, zid, avatar_url)
    `)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching conversations:", error);
    return [];
  }

  // Group by conversation partner
  const convMap = new Map<string, Conversation>();

  for (const msg of data as any[]) {
    const isFromMe = msg.sender_id === user.id;
    const partner = isFromMe ? msg.receiver : msg.sender;
    const partnerId = isFromMe ? msg.receiver_id : msg.sender_id;

    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, {
        partnerId,
        partnerName: partner?.display_name || "Unknown",
        partnerZid: partner?.zid || "",
        partnerAvatar: partner?.avatar_url || null,
        lastMessage: msg.content || (msg.is_buzz ? "⚡ Buzz!" : ""),
        lastMessageAt: msg.created_at,
        lastMessageIsBuzz: msg.is_buzz,
        lastMessageIsFromMe: isFromMe,
        unreadCount: 0,
      });
    }

    // Count unread (messages TO me that are unread)
    if (!isFromMe && !msg.is_read) {
      const conv = convMap.get(partnerId)!;
      conv.unreadCount++;
    }
  }

  // Sort by most recent first
  return Array.from(convMap.values()).sort(
    (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

/** Fetch messages in a thread with another user */
export async function getMessages(otherUserId: string, limit = 50) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("messages")
    .select(`
      id,
      sender_id,
      receiver_id,
      content,
      is_buzz,
      is_read,
      created_at
    `)
    .or(
      `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
    )
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Error fetching messages:", error);
    return [];
  }
  return data || [];
}

/** Send a message (regular DM or Buzz) */
export async function sendMessage(
  receiverId: string,
  content: string,
  isBuzz = false
) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("messages")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      content: isBuzz ? (content || "⚡") : content,
      is_buzz: isBuzz,
    })
    .select()
    .single();

  if (error) {
    console.error("Error sending message:", error);
    return null;
  }

  // Create notification for receiver
  await supabase.from("notifications").insert({
    user_id: receiverId,
    actor_id: user.id,
    type: isBuzz ? "buzz" : "message",
    content: isBuzz ? "sent you a Buzz! ⚡" : (content.slice(0, 60) || "sent you a message"),
    reference_id: data.id,
  });

  return data;
}

/** Mark all messages from a specific user as read */
export async function markMessagesAsRead(otherUserId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("sender_id", otherUserId)
    .eq("receiver_id", user.id)
    .eq("is_read", false);
}

/** Get total unread message count (for NavBar badge) */
export async function getUnreadMessageCount() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("is_read", false);

  return count || 0;
}

// ── ZLOGGER ───────────────────────────────────────────────────

export type ZlogInput = {
  title: string;
  slug: string;
  content_markdown: string;
  content_html: string;
  cover_image_url?: string;
  theme?: string;
  mood?: string;
  is_anonymous?: boolean;
  visibility?: string;
  notify_core8?: boolean;
  notify_friends?: boolean;
  share_to_zeewall?: boolean;
  response_to?: string;
};

export type ZlogListItem = {
  id: string;
  slug: string;
  title: string;
  cover_image_url: string | null;
  mood: string | null;
  is_anonymous: boolean;
  is_featured: boolean;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  author: any;
  engagementCounts: { zap: number; vibe: number; save: number; comment: number };
  excerpt: string;
};

export type ZlogFull = ZlogListItem & {
  content_html: string;
  content_markdown: string;
  theme: string;
  visibility: string;
  updated_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responseTo?: any;
  myEngagement: string[];
  is_featured: boolean;
};

export type ZlogComment = {
  id: string;
  content: string;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  author: any;
};

export type ZlogFilter = "latest" | "trending" | "anonymous" | "network" | "gen_z" | "millennial" | "gen_x";

/** Create a new zlog. Returns { id, slug } or null. */
export async function createZlog(data: ZlogInput): Promise<{ id: string; slug: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("zlogs")
    .insert({ ...data, user_id: user.id })
    .select("id, slug")
    .single();

  if (error) { console.error("createZlog:", error); return null; }
  return row;
}

/** Update an existing zlog owned by the current user. */
export async function updateZlog(id: string, data: Partial<ZlogInput>): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("zlogs")
    .update(data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) { console.error("updateZlog:", error); return false; }
  return true;
}

/** Delete a zlog owned by the current user. */
export async function deleteZlog(id: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase
    .from("zlogs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) { console.error("deleteZlog:", error); return false; }
  return true;
}

/** Fetch a full zlog by slug with author, engagement counts, parent zlog, and current user's engagement. */
export async function getZlogBySlug(slug: string): Promise<ZlogFull | null> {
  const { data: { user } } = await supabase.auth.getUser();

  const { data: row, error } = await supabase
    .from("zlogs")
    .select(`
      id, slug, title, content_html, content_markdown,
      cover_image_url, theme, mood, is_anonymous, is_featured,
      visibility, created_at, updated_at,
      user_id, response_to,
      author:users!user_id (id, display_name, zid, avatar_url, birth_year, birth_month, birth_day),
      responseTo:zlogs!response_to (id, slug, title)
    `)
    .eq("slug", slug)
    .single();

  if (error || !row) { console.error("getZlogBySlug:", error); return null; }

  const { data: engRows } = await supabase
    .from("zlog_engagement")
    .select("type")
    .eq("zlog_id", row.id);

  const counts = { zap: 0, vibe: 0, save: 0, comment: 0 };
  for (const e of (engRows ?? [])) {
    if (e.type in counts) counts[e.type as keyof typeof counts]++;
  }

  const { count: commentCount } = await supabase
    .from("zlog_comments")
    .select("*", { count: "exact", head: true })
    .eq("zlog_id", row.id);
  counts.comment = commentCount ?? 0;

  let myEngagement: string[] = [];
  if (user) {
    const { data: myRows } = await supabase
      .from("zlog_engagement")
      .select("type")
      .eq("zlog_id", row.id)
      .eq("user_id", user.id);
    myEngagement = (myRows ?? []).map((r) => r.type);
  }

  const content = (row as any).content_markdown ?? "";
  const excerpt = content.replace(/[#*`>\[\]]/g, "").slice(0, 160);

  return {
    ...row,
    engagementCounts: counts,
    myEngagement,
    excerpt,
    author: (row as any).is_anonymous ? null : (row as any).author,
    responseTo: (row as any).responseTo ?? undefined,
  } as unknown as ZlogFull;
}

/** Batch-fetch engagement + comment counts for a list of zlog IDs. */
async function fetchEngagementCounts(
  ids: string[]
): Promise<Record<string, { zap: number; vibe: number; save: number; comment: number }>> {
  if (ids.length === 0) return {};

  const map: Record<string, { zap: number; vibe: number; save: number; comment: number }> = {};
  for (const id of ids) map[id] = { zap: 0, vibe: 0, save: 0, comment: 0 };

  const [{ data: engRows }, { data: commentRows }] = await Promise.all([
    supabase.from("zlog_engagement").select("zlog_id, type").in("zlog_id", ids),
    supabase.from("zlog_comments").select("zlog_id").in("zlog_id", ids),
  ]);

  for (const e of engRows ?? []) {
    if (map[e.zlog_id] && e.type in map[e.zlog_id]) {
      map[e.zlog_id][e.type as "zap" | "vibe" | "save"]++;
    }
  }
  for (const c of commentRows ?? []) {
    if (map[c.zlog_id]) map[c.zlog_id].comment++;
  }

  return map;
}

/** Fetch paginated public zlogs with filter support. */
export async function getPublicZlogs(
  filter: ZlogFilter,
  cursor?: string,
  userId?: string
): Promise<ZlogListItem[]> {
  // ── Generation filters — pre-fetch matching user IDs ──────────
  let genUserIds: string[] | null = null;
  if (filter === "gen_z" || filter === "millennial" || filter === "gen_x") {
    const ranges: Record<string, [number, number]> = {
      gen_z:      [1997, 2012],
      millennial: [1981, 1996],
      gen_x:      [1965, 1980],
    };
    const [minYear, maxYear] = ranges[filter];
    const { data: genUsers } = await supabase
      .from("users")
      .select("id")
      .gte("birth_year", minYear)
      .lte("birth_year", maxYear);
    genUserIds = (genUsers ?? []).map((u: any) => u.id as string);
    if (genUserIds.length === 0) return [];
  }

  // ── Network filter — pre-fetch friend IDs ─────────────────────
  let networkUserIds: string[] | null = null;
  if (filter === "network") {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const friends = await getFriends(user.id);
      networkUserIds = (friends ?? []).map((f: any) => f.id as string);
      if (networkUserIds.length === 0) return [];
    }
  }

  // Trending fetches more posts so we can score + slice client-side
  const fetchLimit = filter === "trending" ? 60 : 20;

  let query = supabase
    .from("zlogs")
    .select(`
      id, slug, title, cover_image_url, mood, is_anonymous, is_featured,
      created_at, user_id,
      author:users!user_id (id, display_name, zid, avatar_url, birth_year, birth_month, birth_day),
      content_markdown
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(fetchLimit);

  if (filter === "anonymous") query = query.eq("is_anonymous", true);
  if (genUserIds)             query = query.in("user_id", genUserIds);
  if (networkUserIds)         query = query.in("user_id", networkUserIds);
  if (userId)                 query = query.eq("user_id", userId);
  // Cursor pagination doesn't apply to trending (client-sorted)
  if (cursor && filter !== "trending") query = query.lt("created_at", cursor);

  const { data, error } = await query;
  if (error) { console.error("getPublicZlogs:", error); return []; }

  const rows = (data ?? []) as any[];
  const ids = rows.map((r) => r.id);
  const engMap = await fetchEngagementCounts(ids);

  const mapped: ZlogListItem[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    cover_image_url: row.cover_image_url ?? null,
    mood: row.mood ?? null,
    is_anonymous: row.is_anonymous,
    is_featured: row.is_featured ?? false,
    created_at: row.created_at,
    author: row.is_anonymous ? null : row.author,
    engagementCounts: engMap[row.id] ?? { zap: 0, vibe: 0, save: 0, comment: 0 },
    excerpt: (row.content_markdown ?? "").replace(/[#*`>\[\]]/g, "").slice(0, 160),
  }));

  // Trending: sort by total engagement score, return top 20
  if (filter === "trending") {
    return mapped
      .sort((a, b) => {
        const s = (e: ZlogListItem["engagementCounts"]) => e.zap + e.vibe + e.save + e.comment;
        return s(b.engagementCounts) - s(a.engagementCounts);
      })
      .slice(0, 20);
  }

  return mapped;
}

/** Get all zlogs for a user profile. Owner sees all; others see public only. */
export async function getUserZlogs(userId: string): Promise<ZlogListItem[]> {
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === userId;

  let query = supabase
    .from("zlogs")
    .select("id, slug, title, cover_image_url, mood, is_anonymous, is_featured, created_at, content_markdown, visibility")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!isOwner) {
    query = query.eq("visibility", "public");
  }

  const { data, error } = await query;
  if (error) { console.error("getUserZlogs:", error); return []; }

  const rows = (data ?? []) as any[];
  const ids = rows.map((r) => r.id);

  const engMap = await fetchEngagementCounts(ids);

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    cover_image_url: row.cover_image_url ?? null,
    mood: row.mood ?? null,
    is_anonymous: row.is_anonymous,
    is_featured: row.is_featured ?? false,
    created_at: row.created_at,
    author: null,
    engagementCounts: engMap[row.id] ?? { zap: 0, vibe: 0, save: 0, comment: 0 },
    excerpt: (row.content_markdown ?? "").replace(/[#*`>\[\]]/g, "").slice(0, 160),
  }));
}

/** Toggle engagement (zap/vibe/save). Returns "added" | "removed". */
export async function engageZlog(zlogId: string, type: "zap" | "vibe" | "save"): Promise<"added" | "removed" | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("zlog_engagement")
    .select("id")
    .eq("zlog_id", zlogId)
    .eq("user_id", user.id)
    .eq("type", type)
    .single();

  if (existing) {
    await supabase.from("zlog_engagement").delete().eq("id", existing.id);
    return "removed";
  } else {
    await supabase.from("zlog_engagement").insert({ zlog_id: zlogId, user_id: user.id, type });
    return "added";
  }
}

/** Get all comments for a zlog, ordered ascending. */
export async function getZlogComments(zlogId: string): Promise<ZlogComment[]> {
  const { data, error } = await supabase
    .from("zlog_comments")
    .select(`
      id, content, created_at,
      author:users!user_id (id, display_name, zid, avatar_url, birth_year, birth_month, birth_day)
    `)
    .eq("zlog_id", zlogId)
    .order("created_at", { ascending: true });

  if (error) { console.error("getZlogComments:", error); return []; }
  return (data ?? []) as ZlogComment[];
}

/** Add a comment and notify the zlog owner. Returns comment with author or null. */
export async function addZlogComment(zlogId: string, content: string): Promise<ZlogComment | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: row, error } = await supabase
    .from("zlog_comments")
    .insert({ zlog_id: zlogId, user_id: user.id, content })
    .select(`
      id, content, created_at,
      author:users!user_id (id, display_name, zid, avatar_url, birth_year, birth_month, birth_day)
    `)
    .single();

  if (error) { console.error("addZlogComment:", error); return null; }

  supabase
    .from("zlogs")
    .select("user_id")
    .eq("id", zlogId)
    .single()
    .then(({ data: zlog }) => {
      if (zlog?.user_id && zlog.user_id !== user.id) {
        supabase.from("notifications").insert({
          user_id: zlog.user_id,
          actor_id: user.id,
          type: "comment",
          content: content.slice(0, 60),
          reference_id: zlogId,
        });
      }
    });

  return row as ZlogComment;
}

/** Set a zlog as featured for the current user (clears any existing featured). */
export async function setFeaturedZlog(zlogId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  await supabase.from("zlogs").update({ is_featured: false }).eq("user_id", user.id);
  const { error } = await supabase.from("zlogs").update({ is_featured: true }).eq("id", zlogId).eq("user_id", user.id);
  if (error) { console.error("setFeaturedZlog:", error); return false; }
  return true;
}

/** Remove featured status from a zlog. */
export async function unsetFeaturedZlog(zlogId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { error } = await supabase.from("zlogs").update({ is_featured: false }).eq("id", zlogId).eq("user_id", user.id);
  if (error) { console.error("unsetFeaturedZlog:", error); return false; }
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ZONES
// ─────────────────────────────────────────────────────────────────────────────

export type Zone = {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_emoji: string;
  accent_color: string;
  topic_tag: string;
  rules: string;
  owner_id: string;
  member_count: number;
  post_count: number;
  is_nsfw: boolean;
  is_locked: boolean;
  created_at: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  owner?: any;
};

export type ZoneMembership = {
  zone_id: string;
  user_id: string;
  role: "owner" | "mod" | "member";
  joined_at: string;
};

export type ZoneMember = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user: any;
  role: "owner" | "mod" | "member";
  joined_at: string;
};

const ZONE_SELECT = `
  id, slug, name, description, icon_emoji, accent_color, topic_tag,
  rules, owner_id, member_count, post_count, is_nsfw, is_locked, created_at,
  owner:users!owner_id (id, display_name, zid, avatar_url)
`;

/** Fetch zones: trending / newest / mine */
export async function getZones(
  filter: "trending" | "newest" | "mine" = "trending",
  searchQuery?: string
): Promise<Zone[]> {
  const { data: { user } } = await supabase.auth.getUser();

  if (filter === "mine") {
    if (!user) return [];
    const { data: memberships } = await supabase
      .from("zone_memberships")
      .select("zone_id")
      .eq("user_id", user.id);
    const ids = (memberships ?? []).map((m: any) => m.zone_id);
    if (ids.length === 0) return [];
    let q = supabase.from("zones").select(ZONE_SELECT).in("id", ids);
    if (searchQuery) q = q.ilike("name", `%${searchQuery}%`);
    const { data } = await q.order("member_count", { ascending: false }).limit(50);
    return (data ?? []) as unknown as Zone[];
  }

  let q = supabase.from("zones").select(ZONE_SELECT);
  if (searchQuery) q = q.ilike("name", `%${searchQuery}%`);
  if (filter === "trending") q = q.order("member_count", { ascending: false });
  else q = q.order("created_at", { ascending: false });
  const { data } = await q.limit(50);
  return (data ?? []) as unknown as Zone[];
}

/** Fetch a single zone by slug. */
export async function getZoneBySlug(slug: string): Promise<Zone | null> {
  const { data, error } = await supabase
    .from("zones")
    .select(ZONE_SELECT)
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data as unknown as Zone;
}

/** Get the current user's membership for a zone, or null if not a member. */
export async function getMyZoneMembership(zoneId: string): Promise<ZoneMembership | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("zone_memberships")
    .select("zone_id, user_id, role, joined_at")
    .eq("zone_id", zoneId)
    .eq("user_id", user.id)
    .single();
  return data ?? null;
}

/** Join a zone. Returns false if banned. */
export async function joinZone(zoneId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  // Check ban
  const { data: ban } = await supabase
    .from("zone_bans")
    .select("id")
    .eq("zone_id", zoneId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (ban) return false;
  await supabase.from("zone_memberships").insert({ zone_id: zoneId, user_id: user.id, role: "member" });
  return true;
}

/** Leave a zone. */
export async function leaveZone(zoneId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("zone_memberships").delete().eq("zone_id", zoneId).eq("user_id", user.id);
}

/** Get zones the current user has joined. */
export async function getMyZones(): Promise<Zone[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: memberships } = await supabase
    .from("zone_memberships")
    .select("zone_id")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(10);
  const ids = (memberships ?? []).map((m: any) => m.zone_id);
  if (ids.length === 0) return [];
  const { data } = await supabase
    .from("zones")
    .select(ZONE_SELECT)
    .in("id", ids)
    .limit(10);
  return (data ?? []) as unknown as Zone[];
}

/** Create a new zone. Returns the created zone or null on error. */
export async function createZone(input: {
  name: string;
  slug: string;
  description: string;
  icon_emoji: string;
  accent_color: string;
  topic_tag: string;
  rules: string;
  is_nsfw: boolean;
}): Promise<Zone | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from("zones")
    .insert({ ...input, owner_id: user.id })
    .select(ZONE_SELECT)
    .single();
  if (error) { console.error("createZone:", error); return null; }
  // Auto-join as owner
  await supabase.from("zone_memberships").insert({ zone_id: (data as any).id, user_id: user.id, role: "owner" });
  return data as unknown as Zone;
}

/** Update zone metadata (owner only — enforced by RLS). */
export async function updateZone(zoneId: string, updates: Partial<Pick<Zone, "name" | "description" | "icon_emoji" | "accent_color" | "topic_tag" | "rules" | "is_nsfw" | "is_locked">>): Promise<boolean> {
  const { error } = await supabase.from("zones").update(updates).eq("id", zoneId);
  if (error) { console.error("updateZone:", error); return false; }
  return true;
}

/** Delete a zone (owner only — enforced by RLS). */
export async function deleteZone(zoneId: string): Promise<boolean> {
  const { error } = await supabase.from("zones").delete().eq("id", zoneId);
  if (error) { console.error("deleteZone:", error); return false; }
  return true;
}

/** Get paginated members for a zone. */
export async function getZoneMembers(zoneId: string, limit = 20, offset = 0): Promise<ZoneMember[]> {
  const { data } = await supabase
    .from("zone_memberships")
    .select("role, joined_at, user:users!user_id (id, display_name, zid, avatar_url)")
    .eq("zone_id", zoneId)
    .order("joined_at", { ascending: true })
    .range(offset, offset + limit - 1);
  return (data ?? []) as unknown as ZoneMember[];
}

/** Promote a zone member to mod (owner only — enforced by RLS). */
export async function promoteToMod(zoneId: string, targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("zone_memberships")
    .update({ role: "mod" })
    .eq("zone_id", zoneId)
    .eq("user_id", targetUserId);
  if (error) { console.error("promoteToMod:", error); return false; }
  return true;
}

/** Demote a zone mod back to member (owner only — enforced by RLS). */
export async function demoteToMember(zoneId: string, targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { error } = await supabase
    .from("zone_memberships")
    .update({ role: "member" })
    .eq("zone_id", zoneId)
    .eq("user_id", targetUserId);
  if (error) { console.error("demoteToMember:", error); return false; }
  return true;
}

/** Ban a user from a zone (mod/owner — enforced by RLS). */
export async function banUserFromZone(zoneId: string, userId: string, reason = ""): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  await supabase.from("zone_bans").insert({ zone_id: zoneId, user_id: userId, banned_by: user.id, reason });
  await supabase.from("zone_memberships").delete().eq("zone_id", zoneId).eq("user_id", userId);
  return true;
}

/** Generate a URL-safe base slug from a zone name (no suffix). */
export function generateZoneSlug(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}

/** Check if a zone slug is available. Returns true if free. */
export async function isZoneSlugAvailable(slug: string): Promise<boolean> {
  const { count } = await supabase
    .from("zones")
    .select("id", { count: "exact", head: true })
    .eq("slug", slug);
  return count === 0;
}

/** Find the next available slug — e.g. "gaming" → "gaming-2" → "gaming-3". */
export async function resolveUniqueZoneSlug(base: string): Promise<string> {
  if (await isZoneSlugAvailable(base)) return base;
  for (let i = 2; i <= 99; i++) {
    const candidate = `${base.slice(0, 29)}-${i}`;
    if (await isZoneSlugAvailable(candidate)) return candidate;
  }
  // Absolute fallback (practically unreachable)
  return `${base.slice(0, 27)}-${Date.now().toString(36).slice(-4)}`;
}
