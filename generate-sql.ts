import * as mock from "./src/lib/mock-data.ts";
import * as fs from "fs";

const mapId = (id: string, type: string): string => {
  if (!id || typeof id !== "string") return id;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(id)) return id;

  // Extract digits
  const numMatch = id.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0], 10) : 1;

  if (type === "user") {
    return `e18aa${num}00-3456-4b6b-b86b-e2aee83afdc7`;
  }

  // Custom mapping prefix codes:
  // branch -> 1, course -> 2, class -> 3, student -> 4, teacher -> 5
  // classroom -> 6, enrolment -> 7, homework -> 8, submission -> 9
  // invoice -> a, attendance -> b, audit -> c, schedule -> e
  let typeCode = "0";
  switch (type) {
    case "branch": typeCode = "1"; break;
    case "course": typeCode = "2"; break;
    case "class": typeCode = "3"; break;
    case "student": typeCode = "4"; break;
    case "teacher": typeCode = "5"; break;
    case "classroom": typeCode = "6"; break;
    case "enrolment": typeCode = "7"; break;
    case "homework": typeCode = "8"; break;
    case "submission": typeCode = "9"; break;
    case "invoice": typeCode = "a"; break;
    case "attendance": typeCode = "b"; break;
    case "audit": typeCode = "c"; break;
    case "schedule": typeCode = "e"; break;
  }

  const paddedNum = String(num).padStart(3, "0");
  return `e18${typeCode}a${paddedNum}-3456-4b6b-b86b-e2aee83afdc7`;
};

function generateSql() {
  const sqlLines: string[] = [];

  // Add cleanup and RLS disable header
  sqlLines.push("-- MCNAEdu CRM - Database Seeding Script");
  sqlLines.push("-- Copy and paste this code into your Supabase Dashboard -> SQL Editor and click 'RUN'");
  sqlLines.push("");
  sqlLines.push("-- 1. OPTIONAL: Disable RLS on all tables for easy local development read/write");
  const tables = [
    "branches", "courses", "teachers", "classrooms", "classes", "students", 
    "enrolments", "schedules", "homework_assignments", "submissions", 
    "tuition_invoices", "attendance_logs", "audit_logs"
  ];
  tables.forEach(table => {
    sqlLines.push(`ALTER TABLE IF EXISTS "${table}" DISABLE ROW LEVEL SECURITY;`);
  });
  sqlLines.push("");
  sqlLines.push("-- 2. Clean existing records to avoid duplicates");
  tables.reverse().forEach(table => {
    sqlLines.push(`DELETE FROM "${table}";`);
  });
  sqlLines.push("");
  sqlLines.push("BEGIN;");
  sqlLines.push("");

  // 1. Seed branches
  sqlLines.push("-- Seeding Branches");
  mock.branches.forEach(b => {
    sqlLines.push(`INSERT INTO "branches" (id, name) VALUES ('${mapId(b.id, "branch")}', '${b.name.replace(/'/g, "''")}');`);
  });
  sqlLines.push("");

  // 2. Seed courses
  sqlLines.push("-- Seeding Courses");
  mock.courses.forEach(c => {
    sqlLines.push(`INSERT INTO "courses" (id, name, price) VALUES ('${mapId(c.id, "course")}', '${c.name.replace(/'/g, "''")}', ${c.price});`);
  });
  sqlLines.push("");

  // 3. Seed teachers
  sqlLines.push("-- Seeding Teachers");
  mock.teachers.forEach(t => {
    sqlLines.push(`INSERT INTO "teachers" (id, name, subject, hourly_rate, branch_id) VALUES ('${mapId(t.id, "teacher")}', '${t.name.replace(/'/g, "''")}', '${t.subject.replace(/'/g, "''")}', ${t.hourly_rate}, '${mapId(t.branch_id, "branch")}');`);
  });
  sqlLines.push("");

  // 4. Seed classrooms
  sqlLines.push("-- Seeding Classrooms");
  mock.classrooms.forEach(cr => {
    sqlLines.push(`INSERT INTO "classrooms" (id, name, capacity, branch_id) VALUES ('${mapId(cr.id, "classroom")}', '${cr.name.replace(/'/g, "''")}', ${cr.capacity}, '${mapId(cr.branch_id, "branch")}');`);
  });
  sqlLines.push("");

  // 5. Seed classes
  sqlLines.push("-- Seeding Classes");
  mock.classes.forEach(cls => {
    sqlLines.push(`INSERT INTO "classes" (id, course_id, name, start_date, status, max_capacity, teacher_id, room_id, branch_id) VALUES ('${mapId(cls.id, "class")}', '${mapId(cls.course_id, "course")}', '${cls.name.replace(/'/g, "''")}', '${cls.start_date}', '${cls.status}', ${cls.max_capacity}, '${mapId(cls.teacher_id, "teacher")}', '${mapId(cls.room_id, "classroom")}', '${mapId(cls.branch_id, "branch")}');`);
  });
  sqlLines.push("");

  // 6. Seed students
  sqlLines.push("-- Seeding Students");
  mock.students.forEach(s => {
    sqlLines.push(`INSERT INTO "students" (id, name, email, phone, parent_name, enrolled_class, branch_id) VALUES ('${mapId(s.id, "student")}', '${s.name.replace(/'/g, "''")}', '${s.email}', '${s.phone}', '${s.parent_name.replace(/'/g, "''")}', '${mapId(s.enrolled_class, "class")}', '${mapId(s.branch_id, "branch")}');`);
  });
  sqlLines.push("");

  // 7. Seed enrolments
  sqlLines.push("-- Seeding Enrolments");
  mock.enrolments.forEach(e => {
    sqlLines.push(`INSERT INTO "enrolments" (id, student_id, class_id, status, tuition_status, amount_due, amount_paid, remaining_debt) VALUES ('${mapId(e.id, "enrolment")}', '${mapId(e.student_id, "student")}', '${mapId(e.class_id, "class")}', '${e.status}', '${e.tuition_status}', ${e.amount_due}, ${e.amount_paid}, ${e.remaining_debt});`);
  });
  sqlLines.push("");

  // 8. Seed schedules
  sqlLines.push("-- Seeding Schedules");
  mock.schedules.forEach((sch, i) => {
    sqlLines.push(`INSERT INTO "schedules" (id, class_id, classroom_id, teacher_id, lesson_date, start_time, end_time) VALUES ('${mapId(`sch-${i + 1}`, "schedule")}', '${mapId(sch.class_id, "class")}', '${mapId(sch.classroom_id, "classroom")}', '${mapId(sch.teacher_id, "teacher")}', '${sch.lesson_date}', '${sch.start_time}', '${sch.end_time}');`);
  });
  sqlLines.push("");

  // 9. Seed homework assignments
  sqlLines.push("-- Seeding Homework Assignments");
  mock.homeworkAssignments.forEach(h => {
    sqlLines.push(`INSERT INTO "homework_assignments" (id, class_id, title, description, due_date) VALUES ('${mapId(h.id, "homework")}', '${mapId(h.class_id, "class")}', '${h.title.replace(/'/g, "''")}', '${h.description.replace(/'/g, "''")}', '${h.due_date}');`);
  });
  sqlLines.push("");

  // 10. Seed submissions
  sqlLines.push("-- Seeding Submissions");
  mock.submissions.forEach(sub => {
    const scoreVal = sub.score === null ? "NULL" : sub.score;
    const feedbackVal = sub.teacher_feedback === null ? "NULL" : `'${sub.teacher_feedback.replace(/'/g, "''")}'`;
    const submittedAtVal = sub.submitted_at === null ? "NULL" : `'${sub.submitted_at}'`;
    sqlLines.push(`INSERT INTO "submissions" (id, assignment_id, student_id, submission_status, score, teacher_feedback, submitted_at) VALUES ('${mapId(sub.id, "submission")}', '${mapId(sub.assignment_id, "homework")}', '${mapId(sub.student_id, "student")}', '${sub.submission_status}', ${scoreVal}, ${feedbackVal}, ${submittedAtVal});`);
  });
  sqlLines.push("");

  // 11. Seed tuition invoices
  sqlLines.push("-- Seeding Tuition Invoices");
  mock.tuitionInvoices.forEach(inv => {
    sqlLines.push(`INSERT INTO "tuition_invoices" (id, enrolment_id, student_id, amount_due, amount_paid, remaining_debt, status, payment_method, issued_at) VALUES ('${mapId(inv.id, "invoice")}', '${mapId(inv.enrolment_id, "enrolment")}', '${mapId(inv.student_id, "student")}', ${inv.amount_due}, ${inv.amount_paid}, ${inv.remaining_debt}, '${inv.status}', '${inv.payment_method}', '${inv.issued_at}');`);
  });
  sqlLines.push("");

  // 12. Seed attendance logs
  sqlLines.push("-- Seeding Attendance Logs");
  mock.attendanceLogs.forEach((att, i) => {
    const jsonStr = JSON.stringify(att.student_attendance.map((sa: any) => ({
      student_id: mapId(sa.student_id, "student"),
      student_name: sa.student_name,
      status: sa.status
    })));
    sqlLines.push(`INSERT INTO "attendance_logs" (id, class_id, schedule_id, teacher_id, lesson_date, student_attendance, hours, hourly_rate, total_pay, status) VALUES ('${mapId(att.id, "attendance")}', '${mapId(att.class_id, "class")}', '${mapId(`sch-${i + 1}`, "schedule")}', '${mapId(att.teacher_id, "teacher")}', '${att.lesson_date}', '${jsonStr.replace(/'/g, "''")}', ${att.hours}, ${att.hourly_rate}, ${att.total_pay}, '${att.status}');`);
  });
  sqlLines.push("");

  // 13. Seed audit logs
  sqlLines.push("-- Seeding Audit Logs");
  mock.auditLogs.forEach(a => {
    sqlLines.push(`INSERT INTO "audit_logs" (id, actor, action, target, time, type) VALUES ('${mapId(a.id, "audit")}', '${a.actor.replace(/'/g, "''")}', '${a.action.replace(/'/g, "''")}', '${a.target.replace(/'/g, "''")}', '${a.time}', '${a.type}');`);
  });
  sqlLines.push("");

  sqlLines.push("COMMIT;");
  sqlLines.push("");
  sqlLines.push("-- 14. Automatic Teacher Sync & Trigger");
  sqlLines.push("-- Synchronize any existing Teacher user accounts to the teachers table");
  sqlLines.push("INSERT INTO \"teachers\" (id, name, subject, hourly_rate, branch_id)");
  sqlLines.push("SELECT ");
  sqlLines.push("  id, ");
  sqlLines.push("  name, ");
  sqlLines.push("  'General English' as subject, ");
  sqlLines.push("  350000 as hourly_rate, ");
  sqlLines.push("  COALESCE(branch_id, (SELECT id FROM public.branches LIMIT 1)) as branch_id");
  sqlLines.push("FROM \"users\"");
  sqlLines.push("WHERE role = 'Teacher'");
  sqlLines.push("ON CONFLICT (id) DO NOTHING;");
  sqlLines.push("");
  sqlLines.push("-- Function to automatically insert teacher profile on user insert/update");
  sqlLines.push("CREATE OR REPLACE FUNCTION public.handle_new_teacher()");
  sqlLines.push("RETURNS TRIGGER AS $$");
  sqlLines.push("BEGIN");
  sqlLines.push("  IF NEW.role = 'Teacher' THEN");
  sqlLines.push("    IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = NEW.id) THEN");
  sqlLines.push("      INSERT INTO public.teachers (id, name, subject, hourly_rate, branch_id)");
  sqlLines.push("      VALUES (");
  sqlLines.push("        NEW.id,");
  sqlLines.push("        NEW.name,");
  sqlLines.push("        'General English',");
  sqlLines.push("        350000,");
  sqlLines.push("        COALESCE(NEW.branch_id, (SELECT id FROM public.branches LIMIT 1))");
  sqlLines.push("      );");
  sqlLines.push("    END IF;");
  sqlLines.push("  END IF;");
  sqlLines.push("  RETURN NEW;");
  sqlLines.push("END;");
  sqlLines.push("$$ LANGUAGE plpgsql SECURITY DEFINER;");
  sqlLines.push("");
  sqlLines.push("DROP TRIGGER IF EXISTS on_teacher_user_created ON public.users;");
  sqlLines.push("CREATE TRIGGER on_teacher_user_created");
  sqlLines.push("  AFTER INSERT OR UPDATE OF role, name, branch_id ON public.users");
  sqlLines.push("  FOR EACH ROW");
  sqlLines.push("  EXECUTE FUNCTION public.handle_new_teacher();");
  sqlLines.push("");
  sqlLines.push("-- Seeding completed successfully!");

  fs.writeFileSync("seed-database.sql", sqlLines.join("\n"));
  console.log("SQL Seed file successfully written to seed-database.sql!");
}

generateSql();
