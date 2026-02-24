import { supabase } from "./client";
import { generateZid } from "../utils/generateZid";

export async function syncUserSession() {
  // 1. Get the current logged-in user from Supabase Auth
  const { data: { user } } = await supabase.auth.getUser();

  // If not logged in, stop.
  if (!user) return null;

  // 2. Check if this user already exists in our 'users' table
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  // If they exist, just return their data.
  if (existingUser) return existingUser;

  // 3. If they don't exist, this is a NEW user! Generate ZID and save them.
  const newZid = generateZid();
  
  const { data: newUser, error } = await supabase
    .from('users')
    .insert([
      { 
        id: user.id, 
        zid: newZid, 
        display_name: user.email?.split('@')[0] || "New_Hacker",
        mdx_profile: "# Welcome to my profile! \n\n Drop a Zap on my wall.",
        theme_track_url: ""
      }
    ])
    .select()
    .single();

  if (error) {
    console.error("Identity Sync Error:", error);
    return null;
  }

  return newUser;
}