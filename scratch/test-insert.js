import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  const dummyStudent = {
    id: crypto.randomUUID(),
    name: "Test Student",
    email: "test_student@mcnaedu.vn",
    phone: "0123456789",
    parent_name: "Test Parent",
    enrolled_class: "e183a001-3456-4b6b-b86b-e2aee83afdc7", // From classes table
    branch_id: "e181a001-3456-4b6b-b86b-e2aee83afdc7" // From branches table
  };
  
  const { data, error } = await supabase.from("students").insert([dummyStudent]);
  console.log("Insert result:", data);
  console.error("Insert error:", error);
}

testInsert();
