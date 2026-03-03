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