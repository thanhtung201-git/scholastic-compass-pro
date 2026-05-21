import { createClient } from "@supabase/supabase-js";
import * as mock from "./src/lib/mock-data.ts";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  // branch -> 1
  // course -> 2
  // class -> 3
  // student -> 4
  // teacher -> 5
  // classroom -> 6
  // enrolment -> 7
  // homework -> 8
  // submission -> 9
  // invoice -> a
  // attendance -> b
  // audit -> c
  // schedule -> e
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

async function runSeed() {
  try {
    console.log("Cleaning existing records first to avoid duplicates (except users)...");
    await supabase.from("attendance_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("submissions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("homework_assignments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("schedules").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("tuition_invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("enrolments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("students").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("classes").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("classrooms").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("teachers").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("courses").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("branches").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    console.log("Cleanup complete!");

    // 1. Seed branches
    console.log("Seeding branches...");
    const mappedBranches = mock.branches.map(b => ({
      id: mapId(b.id, "branch"),
      name: b.name
    }));
    const { error: bErr } = await supabase.from("branches").insert(mappedBranches);
    if (bErr) throw bErr;
    console.log("Branches seeded successfully.");

    // 2. Seed courses
    console.log("Seeding courses...");
    const mappedCourses = mock.courses.map(c => ({
      id: mapId(c.id, "course"),
      name: c.name,
      price: c.price
    }));
    const { error: cErr } = await supabase.from("courses").insert(mappedCourses);
    if (cErr) throw cErr;
    console.log("Courses seeded successfully.");

    // 3. Seed teachers
    console.log("Seeding teachers...");
    const mappedTeachers = mock.teachers.map(t => ({
      id: mapId(t.id, "teacher"),
      name: t.name,
      subject: t.subject,
      hourly_rate: t.hourly_rate,
      branch_id: mapId(t.branch_id, "branch")
    }));
    const { error: tErr } = await supabase.from("teachers").insert(mappedTeachers);
    if (tErr) throw tErr;
    console.log("Teachers seeded successfully.");

    // 4. Seed classrooms
    console.log("Seeding classrooms...");
    const mappedClassrooms = mock.classrooms.map(cr => ({
      id: mapId(cr.id, "classroom"),
      name: cr.name,
      capacity: cr.capacity,
      branch_id: mapId(cr.branch_id, "branch")
    }));
    const { error: crErr } = await supabase.from("classrooms").insert(mappedClassrooms);
    if (crErr) throw crErr;
    console.log("Classrooms seeded successfully.");

    // 5. Seed classes
    console.log("Seeding classes...");
    const mappedClasses = mock.classes.map(cls => ({
      id: mapId(cls.id, "class"),
      course_id: mapId(cls.course_id, "course"),
      name: cls.name,
      start_date: cls.start_date,
      status: cls.status,
      max_capacity: cls.max_capacity,
      teacher_id: mapId(cls.teacher_id, "teacher"),
      room_id: mapId(cls.room_id, "classroom"),
      branch_id: mapId(cls.branch_id, "branch")
    }));
    const { error: clsErr } = await supabase.from("classes").insert(mappedClasses);
    if (clsErr) throw clsErr;
    console.log("Classes seeded successfully.");

    // 6. Seed students
    console.log("Seeding students...");
    const mappedStudents = mock.students.map(s => ({
      id: mapId(s.id, "student"),
      name: s.name,
      email: s.email,
      phone: s.phone,
      parent_name: s.parent_name,
      enrolled_class: mapId(s.enrolled_class, "class"),
      branch_id: mapId(s.branch_id, "branch")
    }));
    const { error: sErr } = await supabase.from("students").insert(mappedStudents);
    if (sErr) throw sErr;
    console.log("Students seeded successfully.");

    // 7. Seed enrolments
    console.log("Seeding enrolments...");
    const mappedEnrolments = mock.enrolments.map(e => ({
      id: mapId(e.id, "enrolment"),
      student_id: mapId(e.student_id, "student"),
      class_id: mapId(e.class_id, "class"),
      status: e.status,
      tuition_status: e.tuition_status,
      amount_due: e.amount_due,
      amount_paid: e.amount_paid,
      remaining_debt: e.remaining_debt
    }));
    const { error: eErr } = await supabase.from("enrolments").insert(mappedEnrolments);
    if (eErr) throw eErr;
    console.log("Enrolments seeded successfully.");

    // 8. Seed schedules
    console.log("Seeding schedules...");
    const mappedSchedules = mock.schedules.map((sch, i) => ({
      id: mapId(`sch-${i + 1}`, "schedule"),
      class_id: mapId(sch.class_id, "class"),
      classroom_id: mapId(sch.classroom_id, "classroom"),
      teacher_id: mapId(sch.teacher_id, "teacher"),
      lesson_date: sch.lesson_date,
      start_time: sch.start_time,
      end_time: sch.end_time
    }));
    const { error: schErr } = await supabase.from("schedules").insert(mappedSchedules);
    if (schErr) throw schErr;
    console.log("Schedules seeded successfully.");

    // 9. Seed homework assignments
    console.log("Seeding homework assignments...");
    const mappedHomework = mock.homeworkAssignments.map(h => ({
      id: mapId(h.id, "homework"),
      class_id: mapId(h.class_id, "class"),
      title: h.title,
      description: h.description,
      due_date: h.due_date
    }));
    const { error: hErr } = await supabase.from("homework_assignments").insert(mappedHomework);
    if (hErr) throw hErr;
    console.log("Homework assignments seeded successfully.");

    // 10. Seed submissions
    console.log("Seeding submissions...");
    const mappedSubmissions = mock.submissions.map(sub => ({
      id: mapId(sub.id, "submission"),
      assignment_id: mapId(sub.assignment_id, "homework"),
      student_id: mapId(sub.student_id, "student"),
      submission_status: sub.submission_status,
      score: sub.score,
      teacher_feedback: sub.teacher_feedback,
      submitted_at: sub.submitted_at
    }));
    const { error: subErr } = await supabase.from("submissions").insert(mappedSubmissions);
    if (subErr) throw subErr;
    console.log("Submissions seeded successfully.");

    // 11. Seed tuition invoices
    console.log("Seeding tuition invoices...");
    const mappedInvoices = mock.tuitionInvoices.map(inv => ({
      id: mapId(inv.id, "invoice"),
      enrolment_id: mapId(inv.enrolment_id, "enrolment"),
      student_id: mapId(inv.student_id, "student"),
      amount_due: inv.amount_due,
      amount_paid: inv.amount_paid,
      remaining_debt: inv.remaining_debt,
      status: inv.status,
      payment_method: inv.payment_method,
      issued_at: inv.issued_at
    }));
    const { error: invErr } = await supabase.from("tuition_invoices").insert(mappedInvoices);
    if (invErr) throw invErr;
    console.log("Tuition invoices seeded successfully.");

    // 12. Seed attendance logs
    console.log("Seeding attendance logs...");
    const mappedAttendance = mock.attendanceLogs.map((att, i) => ({
      id: mapId(att.id, "attendance"),
      class_id: mapId(att.class_id, "class"),
      schedule_id: mapId(`sch-${i + 1}`, "schedule"),
      teacher_id: mapId(att.teacher_id, "teacher"),
      lesson_date: att.lesson_date,
      student_attendance: att.student_attendance.map((sa: any) => ({
        student_id: mapId(sa.student_id, "student"),
        student_name: sa.student_name,
        status: sa.status
      })),
      hours: att.hours,
      hourly_rate: att.hourly_rate,
      total_pay: att.total_pay,
      status: att.status
    }));
    const { error: attErr } = await supabase.from("attendance_logs").insert(mappedAttendance);
    if (attErr) throw attErr;
    console.log("Attendance logs seeded successfully.");

    // 13. Seed audit logs
    console.log("Seeding audit logs...");
    const mappedAudit = mock.auditLogs.map(a => ({
      id: mapId(a.id, "audit"),
      actor: a.actor,
      action: a.action,
      target: a.target,
      time: a.time,
      type: a.type
    }));
    const { error: aErr } = await supabase.from("audit_logs").insert(mappedAudit);
    if (aErr) throw aErr;
    console.log("Audit logs seeded successfully.");

    console.log("\n=============================================");
    console.log("DATABASE SEEDED SUCCESSFULLY WITH ALL REAL DATA!");
    console.log("=============================================");
  } catch (err) {
    console.error("Error during seeding:", err);
  }
}

runSeed();
