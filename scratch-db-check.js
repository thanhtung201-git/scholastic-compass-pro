import { createClient } from "@supabase/supabase-js";


const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("Supabase URL:", supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const tables = [
  "users",
  "branches",
  "teachers",
  "classrooms",
  "courses",
  "classes",
  "students",
  "enrolments",
  "schedules",
  "homework_assignments",
  "submissions",
  "tuition_invoices",
  "attendance_logs",
  "audit_logs"
];

async function checkTables() {
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        console.log(`Table "${table}": Error - ${error.message} (${error.code})`);
      } else {
        console.log(`Table "${table}": Success (Exists!) - found ${data.length} records`);
        if (table === "students") {
          console.log("Student records:", data.map(s => ({ id: s.id, name: s.name, email: s.email })));
        }
        if (table === "users") {
          console.log("User records:", data.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
        }
      }
    } catch (e) {
      console.log(`Table "${table}": Throw error:`, e.message);
    }
  }
}

checkTables();
