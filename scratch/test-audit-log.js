import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuditLog() {
  const log = {
    id: crypto.randomUUID(),
    actor: "Nguyễn Thanh Tùng ",
    action: "Test Action",
    target: "test@gmail.com",
    time: new Date().toISOString().replace("T", " ").slice(0, 16),
    type: "security"
  };
  
  const { data, error } = await supabase.from("audit_logs").insert([log]);
  console.log("Insert result:", data);
  console.error("Insert error:", error);
}

testAuditLog();
