import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://znixlexboebnxsaddexr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuaXhsZXhib2VibnhzYWRkZXhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzgyMjMsImV4cCI6MjA5NDc1NDIyM30.qRNFG8C4qWRtUCk8ifAUwSEXYHneAPvcXaXH_KKwEBw";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkDepartments() {
  const { data, error } = await supabase.from('department').select('*');
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Departments:", data);
  }
}

checkDepartments();
