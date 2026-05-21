import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // Try selecting from teachers
  const { data: tData, error: tErr } = await supabase.from("teachers").select("*").limit(1);
  console.log("teachers query error:", tErr);
  console.log("teachers columns:", tData ? (tData.length > 0 ? Object.keys(tData[0]) : "Empty table, but exists") : "Failed");

  // Try selecting from attendance_logs
  const { data: aData, error: aErr } = await supabase.from("attendance_logs").select("*").limit(1);
  console.log("attendance_logs query error:", aErr);
  console.log("attendance_logs columns:", aData ? (aData.length > 0 ? Object.keys(aData[0]) : "Empty table, but exists") : "Failed");
}

run();
