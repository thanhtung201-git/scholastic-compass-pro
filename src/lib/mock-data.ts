import type { MockUser, Role } from "./types";

export const branches = [
  { id: "b1", name: "MCNAEdu — District 1" },
  { id: "b2", name: "MCNAEdu — Thu Duc" },
];

export const mockUsers: MockUser[] = [
  { id: "u1", name: "Nguyen Minh Quan", email: "admin@mcnaedu.vn", role: "Admin", branch_id: "b1", status: "Active" },
  { id: "u2", name: "Tran Thi Lan", email: "academic@mcnaedu.vn", role: "Academic Staff", branch_id: "b1", status: "Active" },
  { id: "u3", name: "Pham Hoang Nam", email: "accountant@mcnaedu.vn", role: "Accountant", branch_id: "b1", status: "Active" },
  { id: "u4", name: "Le Van Director", email: "director@mcnaedu.vn", role: "Director", branch_id: "b1", status: "Active" },
  { id: "u5", name: "Mr. David Johnson", email: "teacher@mcnaedu.vn", role: "Teacher", branch_id: "b1", status: "Active" },
  { id: "u6", name: "Hoang Bao An (Parent)", email: "student@mcnaedu.vn", role: "Student", branch_id: "b1", status: "Active" },
  { id: "u7", name: "Vu Thi Mai", email: "reception@mcnaedu.vn", role: "Receptionist", branch_id: "b2", status: "Active" },
];

export const userByRole = (role: Role) => mockUsers.find((u) => u.role === role)!;

export const teachers = [
  { id: "t1", name: "Mr. David Johnson", subject: "IELTS Speaking", hourly_rate: 450000, branch_id: "b1" },
  { id: "t2", name: "Ms. Sarah Williams", subject: "IELTS Writing", hourly_rate: 500000, branch_id: "b1" },
  { id: "t3", name: "Mr. Tran Quoc Bao", subject: "TOEIC", hourly_rate: 350000, branch_id: "b2" },
  { id: "t4", name: "Ms. Linh Pham", subject: "Kids English", hourly_rate: 280000, branch_id: "b1" },
  { id: "t5", name: "Mr. James Carter", subject: "Business English", hourly_rate: 550000, branch_id: "b2" },
];

export const classrooms = [
  { id: "r1", name: "Room 101", capacity: 20, branch_id: "b1" },
  { id: "r2", name: "Room 102", capacity: 15, branch_id: "b1" },
  { id: "r3", name: "Room 201", capacity: 25, branch_id: "b1" },
  { id: "r4", name: "Room A", capacity: 18, branch_id: "b2" },
  { id: "r5", name: "Room B", capacity: 22, branch_id: "b2" },
];

export const courses = [
  { id: "c1", name: "IELTS 6.5+ Intensive", price: 8500000 },
  { id: "c2", name: "TOEIC 750 Boost", price: 5500000 },
  { id: "c3", name: "Kids English Starter", price: 4200000 },
  { id: "c4", name: "Business English Pro", price: 9500000 },
];

export const classes = [
  { id: "cls1", course_id: "c1", name: "IELTS-A01", start_date: "2026-04-01", status: "Active", max_capacity: 18, teacher_id: "t1", room_id: "r1", branch_id: "b1" },
  { id: "cls2", course_id: "c1", name: "IELTS-A02", start_date: "2026-04-15", status: "Active", max_capacity: 18, teacher_id: "t2", room_id: "r2", branch_id: "b1" },
  { id: "cls3", course_id: "c2", name: "TOEIC-B01", start_date: "2026-03-10", status: "Active", max_capacity: 20, teacher_id: "t3", room_id: "r4", branch_id: "b2" },
  { id: "cls4", course_id: "c3", name: "KIDS-K01", start_date: "2026-02-20", status: "Active", max_capacity: 12, teacher_id: "t4", room_id: "r3", branch_id: "b1" },
  { id: "cls5", course_id: "c4", name: "BIZ-P01", start_date: "2026-01-10", status: "Ended", max_capacity: 15, teacher_id: "t5", room_id: "r5", branch_id: "b2" },
];

export const students = Array.from({ length: 24 }).map((_, i) => ({
  id: `s${i + 1}`,
  name: [
    "Hoang Bao An", "Nguyen Minh Khoi", "Tran Le Vy", "Pham Quoc Huy", "Le Thuy Linh",
    "Do Anh Tuan", "Bui Ngoc Han", "Vu Hai Dang", "Dang Thu Trang", "Phan Minh Duc",
    "Nguyen Khanh Vy", "Tran Hoang Long", "Le Nhat Minh", "Pham Bao Tran", "Hoang My Anh",
    "Do Quang Hieu", "Bui Thanh Ha", "Vu Anh Thu", "Dang Ngoc Quynh", "Phan Tuan Kiet",
    "Nguyen Phuc An", "Tran Mai Chi", "Le Gia Bao", "Pham Hong Nhung",
  ][i],
  email: `student${i + 1}@mcnaedu.vn`,
  phone: `09${String(10000000 + i * 12345).slice(0, 8)}`,
  parent_name: `Parent ${i + 1}`,
  enrolled_class: classes[i % 4].id,
  branch_id: i % 3 === 0 ? "b2" : "b1",
}));

export const enrolments = students.map((s, i) => {
  const totalDue = courses.find((c) => c.id === classes.find((cl) => cl.id === s.enrolled_class)!.course_id)!.price;
  const paid = i % 4 === 0 ? 0 : i % 4 === 1 ? totalDue / 2 : totalDue;
  return {
    id: `e${i + 1}`,
    student_id: s.id,
    class_id: s.enrolled_class,
    status: i % 11 === 0 ? "Preserved" : i % 13 === 0 ? "Dropped" : "Active",
    tuition_status: paid === 0 ? "Unpaid" : paid < totalDue ? "Partially Paid" : "Paid",
    amount_due: totalDue,
    amount_paid: paid,
    remaining_debt: totalDue - paid,
  };
});

// Generate weekly recurring schedules
const slotTimes = [
  ["08:00", "10:00"],
  ["10:30", "12:30"],
  ["14:00", "16:00"],
  ["18:00", "20:00"],
  ["18:30", "20:30"],
];

export const schedules = (() => {
  const out: any[] = [];
  const today = new Date();
  for (let d = -3; d <= 14; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dayStr = date.toISOString().slice(0, 10);
    classes.forEach((cls, idx) => {
      if ((d + idx) % 2 !== 0) return;
      const [start, end] = slotTimes[(d + idx + 5) % slotTimes.length];
      out.push({
        id: `sch-${dayStr}-${cls.id}`,
        class_id: cls.id,
        classroom_id: cls.room_id,
        teacher_id: cls.teacher_id,
        lesson_date: dayStr,
        start_time: start,
        end_time: end,
      });
    });
  }
  return out;
})();

export const homeworkAssignments = [
  { id: "h1", class_id: "cls1", title: "Essay: Technology in Education", description: "Write a 250-word essay arguing your view.", due_date: "2026-05-25" },
  { id: "h2", class_id: "cls1", title: "Speaking Recording — Part 2", description: "Record yourself describing a memorable trip.", due_date: "2026-05-22" },
  { id: "h3", class_id: "cls2", title: "Writing Task 1 — Bar Chart", description: "Summarize the chart in 150 words.", due_date: "2026-05-28" },
  { id: "h4", class_id: "cls3", title: "TOEIC Listening Practice Set 5", description: "Complete sections 1-2 and submit answers.", due_date: "2026-05-24" },
  { id: "h5", class_id: "cls4", title: "Vocabulary Quiz Unit 4", description: "20-question quiz online.", due_date: "2026-05-26" },
];

export const submissions = students.slice(0, 12).map((s, i) => ({
  id: `sub${i + 1}`,
  assignment_id: homeworkAssignments[i % homeworkAssignments.length].id,
  student_id: s.id,
  submission_status: i % 4 === 0 ? "Pending" : i % 4 === 1 ? "Submitted" : i % 4 === 2 ? "Graded" : "Late",
  score: i % 4 === 2 ? 7 + (i % 3) : null,
  teacher_feedback: i % 4 === 2 ? "Good structure, watch your tenses." : null,
  submitted_at: i % 4 === 0 ? null : "2026-05-19",
}));

export const tuitionInvoices = enrolments.map((e, i) => ({
  id: `inv${i + 1}`,
  enrolment_id: e.id,
  student_id: e.student_id,
  amount_due: e.amount_due,
  amount_paid: e.amount_paid,
  remaining_debt: e.remaining_debt,
  status: e.tuition_status,
  payment_method: e.amount_paid > 0 ? (i % 2 === 0 ? "Bank Transfer" : "Cash") : "—",
  issued_at: "2026-04-01",
}));

export const attendanceLogs = schedules.slice(0, 10).map((sch, i) => {
  const cls = classes.find((c) => c.id === sch.class_id)!;
  const teacher = teachers.find((t) => t.id === sch.teacher_id)!;
  const classStudents = students.filter((s) => s.enrolled_class === cls.id).slice(0, 6);
  return {
    id: `att${i + 1}`,
    class_id: cls.id,
    schedule_id: sch.id,
    teacher_id: teacher.id,
    lesson_date: sch.lesson_date,
    student_attendance: classStudents.map((s, j) => ({
      student_id: s.id,
      student_name: s.name,
      status: j === 0 ? "Absent" : j === 1 ? "Late" : "Present",
    })),
    hours: 2,
    hourly_rate: teacher.hourly_rate,
    total_pay: teacher.hourly_rate * 2,
    status: i % 3 === 0 ? "Approved" : "Draft",
  };
});

export const auditLogs = [
  { id: "a1", actor: "Nguyen Minh Quan", action: "Blocked user account", target: "student21@mcnaedu.vn", time: "2026-05-19 09:42", type: "security" },
  { id: "a2", actor: "Tran Thi Lan", action: "Created class IELTS-A02", target: "cls2", time: "2026-05-19 09:10", type: "create" },
  { id: "a3", actor: "Pham Hoang Nam", action: "Approved payroll for May", target: "Payroll #PR-202605", time: "2026-05-18 17:30", type: "approve" },
  { id: "a4", actor: "Mr. David Johnson", action: "Submitted attendance log", target: "IELTS-A01", time: "2026-05-18 20:15", type: "submit" },
  { id: "a5", actor: "Tran Thi Lan", action: "Assigned teacher to class", target: "TOEIC-B01 → Mr. Tran Quoc Bao", time: "2026-05-17 14:20", type: "update" },
  { id: "a6", actor: "Vu Thi Mai", action: "Checked in guest", target: "Visitor: Parent of Hoang Bao An", time: "2026-05-17 10:00", type: "create" },
  { id: "a7", actor: "Nguyen Minh Quan", action: "Updated system tuition pricing", target: "IELTS 6.5+ Intensive", time: "2026-05-16 16:45", type: "update" },
];

export const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);
