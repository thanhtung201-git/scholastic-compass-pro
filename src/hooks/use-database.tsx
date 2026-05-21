import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import * as mock from "@/lib/mock-data";
import type { Role } from "@/lib/types";

interface DbContextType {
  branches: any[];
  teachers: any[];
  classrooms: any[];
  courses: any[];
  classes: any[];
  students: any[];
  enrolments: any[];
  schedules: any[];
  homeworkAssignments: any[];
  submissions: any[];
  tuitionInvoices: any[];
  attendanceLogs: any[];
  auditLogs: any[];
  users: any[];
  loading: boolean;
  seeding: boolean;
  
  // Mutations
  toggleUserStatus: (id: string, currentStatus: string) => Promise<void>;
  updateUserRole: (id: string, role: Role) => Promise<void>;
  addStudent: (student: any) => Promise<void>;
  createClass: (cls: any) => Promise<void>;
  saveAttendance: (log: any) => Promise<void>;
  updateTuitionPayment: (invoiceId: string, amountPaid: number, method: string) => Promise<void>;
  addHomework: (homework: any) => Promise<void>;
  submitGrade: (submissionId: string, score: number, feedback: string) => Promise<void>;
  addAuditLog: (actor: string, action: string, target: string, type: string) => Promise<void>;
  addSchedule: (schedule: any) => Promise<void>;
}

const DbContext = createContext<DbContextType | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);

  // Queries
  const { data: branches = [], isLoading: loadBranches } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("branches").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: teachers = [], isLoading: loadTeachers } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teachers").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: classrooms = [], isLoading: loadClassrooms } = useQuery({
    queryKey: ["classrooms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classrooms").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: courses = [], isLoading: loadCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: classes = [], isLoading: loadClasses } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: students = [], isLoading: loadStudents } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase.from("students").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: enrolments = [], isLoading: loadEnrolments } = useQuery({
    queryKey: ["enrolments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("enrolments").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: schedules = [], isLoading: loadSchedules } = useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("schedules").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: homeworkAssignments = [], isLoading: loadHomework } = useQuery({
    queryKey: ["homework_assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("homework_assignments").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: submissions = [], isLoading: loadSubmissions } = useQuery({
    queryKey: ["submissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("submissions").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: tuitionInvoices = [], isLoading: loadInvoices } = useQuery({
    queryKey: ["tuition_invoices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("tuition_invoices").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: attendanceLogs = [], isLoading: loadAttendance } = useQuery({
    queryKey: ["attendance_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance_logs").select("*");
      if (error) throw error;
      return data;
    }
  });

  const { data: auditLogs = [], isLoading: loadAudit } = useQuery({
    queryKey: ["audit_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs").select("*").order("time", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: users = [], isLoading: loadUsers } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("*");
      if (error) throw error;
      return data;
    }
  });

  const loading =
    loadBranches ||
    loadTeachers ||
    loadClassrooms ||
    loadCourses ||
    loadClasses ||
    loadStudents ||
    loadEnrolments ||
    loadSchedules ||
    loadHomework ||
    loadSubmissions ||
    loadInvoices ||
    loadAttendance ||
    loadAudit ||
    loadUsers ||
    seeding;

  // Auto-seed function if tables are empty
  useEffect(() => {
    async function checkAndSeed() {
      // If we are finished loading and branches is empty, seed everything!
      if (!loadBranches && branches.length === 0 && !seeding) {
        setSeeding(true);
        const toastId = toast.loading("First run: Initializing database with demo records...");
        try {
          console.log("Seeding Supabase database with mock data...");

          // Mapped ID helper
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

          // 1. Seed branches
          const mappedBranches = mock.branches.map(b => ({
            id: mapId(b.id, "branch"),
            name: b.name
          }));
          await supabase.from("branches").insert(mappedBranches);

          // 2. Seed courses
          const mappedCourses = mock.courses.map(c => ({
            id: mapId(c.id, "course"),
            name: c.name,
            price: c.price
          }));
          await supabase.from("courses").insert(mappedCourses);

          // 3. Seed teachers
          const mappedTeachers = mock.teachers.map(t => ({
            id: mapId(t.id, "teacher"),
            name: t.name,
            subject: t.subject,
            hourly_rate: t.hourly_rate,
            branch_id: mapId(t.branch_id, "branch")
          }));
          await supabase.from("teachers").insert(mappedTeachers);

          // 4. Seed classrooms
          const mappedClassrooms = mock.classrooms.map(cr => ({
            id: mapId(cr.id, "classroom"),
            name: cr.name,
            capacity: cr.capacity,
            branch_id: mapId(cr.branch_id, "branch")
          }));
          await supabase.from("classrooms").insert(mappedClassrooms);

          // 5. Seed classes
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
          await supabase.from("classes").insert(mappedClasses);

          // 6. Seed students
          const mappedStudents = mock.students.map(s => ({
            id: mapId(s.id, "student"),
            name: s.name,
            email: s.email,
            phone: s.phone,
            parent_name: s.parent_name,
            enrolled_class: mapId(s.enrolled_class, "class"),
            branch_id: mapId(s.branch_id, "branch")
          }));
          await supabase.from("students").insert(mappedStudents);

          // 7. Seed enrolments
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
          await supabase.from("enrolments").insert(mappedEnrolments);

          // 8. Seed schedules
          const mappedSchedules = mock.schedules.map((sch, i) => ({
            id: mapId(`sch-${i + 1}`, "schedule"),
            class_id: mapId(sch.class_id, "class"),
            classroom_id: mapId(sch.classroom_id, "classroom"),
            teacher_id: mapId(sch.teacher_id, "teacher"),
            lesson_date: sch.lesson_date,
            start_time: sch.start_time,
            end_time: sch.end_time
          }));
          await supabase.from("schedules").insert(mappedSchedules);

          // 9. Seed homework assignments
          const mappedHomework = mock.homeworkAssignments.map((h) => ({
            id: mapId(h.id, "homework"),
            class_id: mapId(h.class_id, "class"),
            title: h.title,
            description: h.description,
            due_date: h.due_date
          }));
          await supabase.from("homework_assignments").insert(mappedHomework);

          // 10. Seed submissions
          const mappedSubmissions = mock.submissions.map((s) => ({
            id: mapId(s.id, "submission"),
            assignment_id: mapId(s.assignment_id, "homework"),
            student_id: mapId(s.student_id, "student"),
            submission_status: s.submission_status,
            score: s.score,
            teacher_feedback: s.teacher_feedback,
            submitted_at: s.submitted_at
          }));
          await supabase.from("submissions").insert(mappedSubmissions);

          // 11. Seed tuition invoices
          const mappedInvoices = mock.tuitionInvoices.map((t) => ({
            id: mapId(t.id, "invoice"),
            enrolment_id: mapId(t.enrolment_id, "enrolment"),
            student_id: mapId(t.student_id, "student"),
            amount_due: t.amount_due,
            amount_paid: t.amount_paid,
            remaining_debt: t.remaining_debt,
            status: t.status,
            payment_method: t.payment_method,
            issued_at: t.issued_at
          }));
          await supabase.from("tuition_invoices").insert(mappedInvoices);

          // 12. Seed attendance logs
          const mappedAttendance = mock.attendanceLogs.map((a, i) => ({
            id: mapId(a.id, "attendance"),
            class_id: mapId(a.class_id, "class"),
            schedule_id: mapId(`sch-${i + 1}`, "schedule"),
            teacher_id: mapId(a.teacher_id, "teacher"),
            lesson_date: a.lesson_date,
            student_attendance: a.student_attendance.map((sa: any) => ({
              student_id: mapId(sa.student_id, "student"),
              student_name: sa.student_name,
              status: sa.status
            })),
            hours: a.hours,
            hourly_rate: a.hourly_rate,
            total_pay: a.total_pay,
            status: a.status
          }));
          await supabase.from("attendance_logs").insert(mappedAttendance);

          // 13. Seed audit logs
          const mappedAudit = mock.auditLogs.map((a) => ({
            id: mapId(a.id, "audit"),
            actor: a.actor,
            action: a.action,
            target: a.target,
            time: a.time,
            type: a.type
          }));
          await supabase.from("audit_logs").insert(mappedAudit);

          // 14. Seed mockUsers who are not yet in the DB
          const { data: existingUsers } = await supabase.from("users").select("email");
          const existingEmails = new Set((existingUsers || []).map((u) => u.email));
          const usersToInsert = mock.mockUsers.filter((u) => !existingEmails.has(u.email)).map(u => ({
            id: mapId(u.id, "user"),
            name: u.name,
            email: u.email,
            role: u.role,
            branch_id: mapId(u.branch_id, "branch"),
            status: u.status
          }));
          if (usersToInsert.length > 0) {
            await supabase.from("users").insert(usersToInsert);
          }

          toast.success("Database successfully initialized with mock data!", { id: toastId });
          
          // Invalidate all queries to refresh the data
          queryClient.invalidateQueries();
        } catch (err: any) {
          console.error("Error seeding database:", err);
          toast.error(`Database seeding failed: ${err.message}`, { id: toastId });
        } finally {
          setSeeding(false);
        }
      }
    }
    
    if (!loading && !seeding) {
      checkAndSeed();
    }
  }, [loadBranches, branches, seeding, queryClient]);

  // Mutations
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("users")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Account status updated in database!");
    },
    onError: (err) => {
      toast.error(`Failed to update account: ${err.message}`);
    }
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { error } = await supabase
        .from("users")
        .update({ role })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User role updated successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to update role: ${err.message}`);
    }
  });

  const addStudentMutation = useMutation({
    mutationFn: async (student: any) => {
      // 1. Insert student
      const { error: studentErr } = await supabase
        .from("students")
        .insert([student]);
      if (studentErr) throw studentErr;

      // 2. Create enrolment record automatically
      const cls = classes.find((c) => c.id === student.enrolled_class);
      const course = courses.find((co) => co.id === cls?.course_id);
      const totalDue = course?.price || 0;
      
      const enrolment = {
        id: crypto.randomUUID(),
        student_id: student.id,
        class_id: student.enrolled_class,
        status: "Active",
        tuition_status: "Unpaid",
        amount_due: totalDue,
        amount_paid: 0,
        remaining_debt: totalDue
      };
      const { error: enrolErr } = await supabase
        .from("enrolments")
        .insert([enrolment]);
      if (enrolErr) throw enrolErr;

      // 3. Create invoice record
      const invoice = {
        id: crypto.randomUUID(),
        enrolment_id: enrolment.id,
        student_id: student.id,
        amount_due: totalDue,
        amount_paid: 0,
        remaining_debt: totalDue,
        status: "Unpaid",
        payment_method: "—",
        issued_at: new Date().toISOString().slice(0, 10)
      };
      const { error: invoiceErr } = await supabase
        .from("tuition_invoices")
        .insert([invoice]);
      if (invoiceErr) throw invoiceErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["enrolments"] });
      queryClient.invalidateQueries({ queryKey: ["tuition_invoices"] });
      toast.success("Student added successfully to Supabase!");
    },
    onError: (err) => {
      toast.error(`Failed to add student: ${err.message}`);
    }
  });

  const createClassMutation = useMutation({
    mutationFn: async (cls: any) => {
      const { error } = await supabase
        .from("classes")
        .insert([cls]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class created successfully in Supabase!");
    },
    onError: (err) => {
      toast.error(`Failed to create class: ${err.message}`);
    }
  });

  const saveAttendanceMutation = useMutation({
    mutationFn: async (log: any) => {
      const { error } = await supabase
        .from("attendance_logs")
        .upsert([log]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance_logs"] });
      toast.success("Attendance submitted successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to submit attendance: ${err.message}`);
    }
  });

  const updateTuitionMutation = useMutation({
    mutationFn: async ({ invoiceId, amountPaid, method }: { invoiceId: string; amountPaid: number; method: string }) => {
      // 1. Fetch current invoice
      const { data: inv, error: fetchErr } = await supabase
        .from("tuition_invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();
      if (fetchErr) throw fetchErr;

      const newPaid = Number(inv.amount_paid) + amountPaid;
      const newDebt = Math.max(0, Number(inv.amount_due) - newPaid);
      const newStatus = newPaid >= inv.amount_due ? "Paid" : newPaid > 0 ? "Partially Paid" : "Unpaid";

      // 2. Update invoice
      const { error: invErr } = await supabase
        .from("tuition_invoices")
        .update({
          amount_paid: newPaid,
          remaining_debt: newDebt,
          status: newStatus,
          payment_method: method
        })
        .eq("id", invoiceId);
      if (invErr) throw invErr;

      // 3. Update enrolment
      const { error: enrolErr } = await supabase
        .from("enrolments")
        .update({
          amount_paid: newPaid,
          remaining_debt: newDebt,
          tuition_status: newStatus
        })
        .eq("id", inv.enrolment_id);
      if (enrolErr) throw enrolErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tuition_invoices"] });
      queryClient.invalidateQueries({ queryKey: ["enrolments"] });
      toast.success("Payment recorded successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to record payment: ${err.message}`);
    }
  });

  const addHomeworkMutation = useMutation({
    mutationFn: async (homework: any) => {
      const { error } = await supabase
        .from("homework_assignments")
        .insert([homework]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homework_assignments"] });
      toast.success("Homework assigned successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to assign homework: ${err.message}`);
    }
  });

  const submitGradeMutation = useMutation({
    mutationFn: async ({ submissionId, score, feedback }: { submissionId: string; score: number; feedback: string }) => {
      const { error } = await supabase
        .from("submissions")
        .update({
          score,
          teacher_feedback: feedback,
          submission_status: "Graded"
        })
        .eq("id", submissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("Grade submitted successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to grade submission: ${err.message}`);
    }
  });

  const addAuditLogMutation = useMutation({
    mutationFn: async (log: any) => {
      const { error } = await supabase
        .from("audit_logs")
        .insert([log]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit_logs"] });
    }
  });

  const addScheduleMutation = useMutation({
    mutationFn: async (schedule: any) => {
      const { error } = await supabase
        .from("schedules")
        .insert([schedule]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Schedule created successfully!");
    },
    onError: (err) => {
      toast.error(`Failed to add schedule: ${err.message}`);
    }
  });

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    const status = currentStatus === "Active" ? "Blocked" : "Active";
    await toggleUserStatusMutation.mutateAsync({ id, status });
  };

  const updateUserRole = async (id: string, role: Role) => {
    await updateUserRoleMutation.mutateAsync({ id, role });
  };

  const addStudent = async (student: any) => {
    await addStudentMutation.mutateAsync(student);
  };

  const createClass = async (cls: any) => {
    await createClassMutation.mutateAsync(cls);
  };

  const saveAttendance = async (log: any) => {
    await saveAttendanceMutation.mutateAsync(log);
  };

  const updateTuitionPayment = async (invoiceId: string, amountPaid: number, method: string) => {
    await updateTuitionMutation.mutateAsync({ invoiceId, amountPaid, method });
  };

  const addHomework = async (homework: any) => {
    await addHomeworkMutation.mutateAsync(homework);
  };

  const submitGrade = async (submissionId: string, score: number, feedback: string) => {
    await submitGradeMutation.mutateAsync({ submissionId, score, feedback });
  };

  const addAuditLog = async (actor: string, action: string, target: string, type: string) => {
    const log = {
      id: crypto.randomUUID(),
      actor,
      action,
      target,
      time: new Date().toISOString().replace("T", " ").slice(0, 16),
      type
    };
    await addAuditLogMutation.mutateAsync(log);
  };

  const addSchedule = async (schedule: any) => {
    await addScheduleMutation.mutateAsync(schedule);
  };

  return (
    <DbContext.Provider
      value={{
        branches,
        teachers,
        classrooms,
        courses,
        classes,
        students,
        enrolments,
        schedules,
        homeworkAssignments,
        submissions,
        tuitionInvoices,
        attendanceLogs,
        auditLogs,
        users,
        loading,
        seeding,
        toggleUserStatus,
        updateUserRole,
        addStudent,
        createClass,
        saveAttendance,
        updateTuitionPayment,
        addHomework,
        submitGrade,
        addAuditLog,
        addSchedule
      }}
    >
      {children}
    </DbContext.Provider>
  );
}

export function useDatabase() {
  const ctx = useContext(DbContext);
  if (!ctx) throw new Error("useDatabase must be used inside DatabaseProvider");
  return ctx;
}
