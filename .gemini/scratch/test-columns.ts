import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkColumns() {
  // Test if social_links exists
  const { data: users, error: uErr } = await supabase
    .from("users")
    .select("social_links")
    .limit(1);

  console.log("users table (social_links):", uErr ? "MISSING/ERROR" : "EXISTS");
  if (uErr) console.error(uErr.message);

  // Test profile_customization columns
  const { data: custom, error: cErr } = await supabase
    .from("profile_customization")
    .select("show_vibes, show_wall, wall_friends_only, show_online, show_zlogger, show_photos")
    .limit(1);

  console.log("profile_customization privacy columns:", cErr ? "MISSING/ERROR" : "EXISTS");
  if (cErr) console.error(cErr.message);
}

checkColumns();
