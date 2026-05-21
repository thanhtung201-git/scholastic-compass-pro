import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRoleUpdate() {
  // Let's update a dummy user role or one of the test users, e.g. "Nguyen Van B" whose id is "02f0ae46-db82-49c6-9c0e-6821dfdee878"
  const testUserId = "02f0ae46-db82-49c6-9c0e-6821dfdee878";
  
  console.log("Attempting to update user role in Supabase...");
  const { data, error, status, statusText } = await supabase
    .from("users")
    .update({ role: "Teacher" })
    .eq("id", testUserId)
    .select();
    
  console.log("Update status:", status, statusText);
  console.log("Update data:", data);
  console.error("Update error:", error);
}

testRoleUpdate();
