import { supabase } from "./client";
import { generateZid } from "../utils/generateZid";

// ── SESSION SYNC ─────────────────────────────────────────────
// On every login, checks if user exists in public.users.
// If not, auto-creates their profile + generates a ZID.
export async function syncUserSession() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (existingUser) return existingUser;

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
    console.error("Identity Sync Error:", error);
    return null;
  }

  return newUser;
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
      friend:users!fk_core_friend (id, display_name, zid)
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
  if (!query) return [];

  const { data } = await supabase
    .from("users")
    .select("id, display_name, zid")
    .ilike("display_name", `%${query}%`)
    .limit(5);

  return data || [];
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
    { onConflict: "user_id, position" }
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
  // Fetch requests where this user is sender OR receiver and status is accepted
  const { data, error } = await supabase
    .from("friend_requests")
    .select(`
      id,
      sender_id,
      receiver_id,
      created_at,
      sender:users!sender_id (id, display_name, zid, avatar_url),
      receiver:users!receiver_id (id, display_name, zid, avatar_url)
    `)
    .eq("status", "accepted")
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

  if (error) {
    console.error("Error fetching friends:", error);
    return [];
  }

  // Normalize: always return the "other" person
  return (data || []).map((row: any) => {
    const isSender = row.sender_id === userId;
    const friend = isSender ? row.receiver : row.sender;
    return {
      requestId: row.id,
      friendSince: row.created_at,
      ...friend,
    };
  });
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
      sender:users!sender_id (id, display_name, zid, avatar_url)
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