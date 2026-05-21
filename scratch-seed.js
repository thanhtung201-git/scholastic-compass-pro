import { createClient } from "@supabase/supabase-js";
import * as mock from "./src/lib/mock-data.ts";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runSeed() {
  try {
    console.log("Seeding branches...");
    const { error: bErr } = await supabase.from("branches").insert(mock.branches);
    if (bErr) throw bErr;
    console.log("Branches seeded successfully.");

    console.log("Seeding courses...");
    const { error: cErr } = await supabase.from("courses").insert(mock.courses);
    if (cErr) throw cErr;
    console.log("Courses seeded successfully.");

    console.log("Seeding teachers...");
    const { error: tErr } = await supabase.from("teachers").insert(mock.teachers);
    if (tErr) throw tErr;
    console.log("Teachers seeded successfully.");

    console.log("Seeding classrooms...");
    const { error: crErr } = await supabase.from("classrooms").insert(mock.classrooms);
    if (crErr) throw crErr;
    console.log("Classrooms seeded successfully.");

    console.log("Seeding classes...");
    const { error: clsErr } = await supabase.from("classes").insert(mock.classes);
    if (clsErr) throw clsErr;
    console.log("Classes seeded successfully.");

    console.log("Seeding students...");
    const { error: sErr } = await supabase.from("students").insert(mock.students);
    if (sErr) throw sErr;
    console.log("Students seeded successfully.");

    console.log("Seeding enrolments...");
    const { error: eErr } = await supabase.from("enrolments").insert(mock.enrolments);
    if (eErr) throw eErr;
    console.log("Enrolments seeded successfully.");

    console.log("Seeding schedules...");
    const { error: schErr } = await supabase.from("schedules").insert(mock.schedules);
    if (schErr) throw schErr;
    console.log("Schedules seeded successfully.");
    
    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Error during seeding:", err);
  }
}

runSeed();
