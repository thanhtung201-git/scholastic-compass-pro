import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectConstraints() {
  try {
    // Query pg_constraint to see foreign keys on 'students' table
    const query = `
      SELECT
        tc.table_schema, 
        tc.constraint_name, 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_schema AS foreign_table_schema,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='students';
    `;
    
    // We don't have SQL execution directly via REST, but we can query standard table metadata using PostgREST if permitted,
    // or we can run an RPC if available. Let's see if we can get all foreign keys by querying get_columns or similar.
    // Wait, let's try querying information_schema if enabled, but PostgREST doesn't expose information_schema directly.
    // Let's try querying a dummy query or check if there is an RPC we can use, or try inserting a dummy student to see.
    // Actually, let's query the `users` table to see if there is any user with student emails.
    console.log("Inspecting students and users tables...");
    
    // Let's fetch one record from 'students' if any exist (there are 0)
    const { data: students, error: sErr } = await supabase.from("students").select("*").limit(1);
    console.log("Students sample:", students, sErr);
    
    // Let's fetch one record from 'users'
    const { data: users, error: uErr } = await supabase.from("users").select("*").limit(5);
    console.log("Users sample:", users, uErr);
    
  } catch (err) {
    console.error("Error:", err);
  }
}

inspectConstraints();
