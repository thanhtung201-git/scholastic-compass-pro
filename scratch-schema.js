import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getColumnInfo() {
  try {
    // Query column information from information_schema
    const { data: cols, error } = await supabase.rpc("get_columns", {}, { head: false });
    if (error) {
      console.log("RPC get_columns failed. Trying direct query...");
      
      // Let's run a query to get column info if we can, or just inspect some system views
      const { data: usersCols, error: uErr } = await supabase
        .from("users")
        .select("*")
        .limit(1);
        
      if (usersCols && usersCols.length > 0) {
        console.log("Sample User record fields:", Object.keys(usersCols[0]));
      }
      
      const { data: bCols, error: bErr } = await supabase
        .from("branches")
        .select("*")
        .limit(1);
        
      if (bCols) {
        console.log("Sample Branch record fields:", bCols.length > 0 ? Object.keys(bCols[0]) : "Empty table");
      }
    } else {
      console.log("Columns:", cols);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

getColumnInfo();
