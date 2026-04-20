import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error } = await supabase.from("notifications").select("*").limit(1);
  if (data?.length) {
    console.log("Cols:", Object.keys(data[0]));
  } else {
    console.log("No rows, but error:", error);
  }
}
check();
