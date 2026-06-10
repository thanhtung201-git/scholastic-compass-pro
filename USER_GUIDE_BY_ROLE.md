# 📘 MCNA ERP — User Guide by Role

> **Scholastic Compass Pro** — Role-Based Step-by-Step System Guide  
> Last Updated: June 2026

---

## 📋 Table of Contents

1. [Overview & Role Hierarchy](#-overview--role-hierarchy)
2. [Getting Started (All Roles)](#-getting-started-all-roles)
3. [🔴 Admin](#-admin)
4. [🟠 Director](#-director)
5. [🟡 HR Manager](#-hr-manager)
6. [🟢 HR Staff](#-hr-staff)
7. [🔵 Finance Manager](#-finance-manager)
8. [🔷 Accountant](#-accountant)
9. [🟣 Academic Manager](#-academic-manager)
10. [🟤 Academic Staff](#-academic-staff)
11. [🩵 Marketing Manager](#-marketing-manager)
12. [⚪ Marketing Staff](#-marketing-staff)
13. [Shared Features (All Roles)](#-shared-features-all-roles)
14. [Task Assignment Hierarchy Rules](#-task-assignment-hierarchy-rules)

---

## 🌐 Overview & Role Hierarchy

The MCNA ERP system has **10 roles** organized into departments. Each role can only access the modules assigned to them. Below is the department structure:

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROLE HIERARCHY                           │
├──────────────┬──────────────────────────────────────────────────┤
│ LEVEL 1      │  Admin  |  Director                              │
├──────────────┼──────────────────────────────────────────────────┤
│ LEVEL 2      │  HR Manager  |  Finance Manager                  │
│              │  Academic Manager  |  Marketing Manager          │
├──────────────┼──────────────────────────────────────────────────┤
│ LEVEL 3      │  HR Staff  |  Accountant                         │
│              │  Academic Staff  |  Marketing Staff              │
└──────────────┴──────────────────────────────────────────────────┘
```

### Task Assignment Rule
> ⚠️ When assigning tasks, you can **only assign to staff exactly one level below you** in the **same department**.
>
> | Your Role | You Can Assign To |
> |---|---|
> | Director / Admin | All Managers (Level 2) |
> | HR Manager | HR Staff |
> | Finance Manager | Accountant |
> | Academic Manager | Academic Staff |
> | Marketing Manager | Marketing Staff |
> | HR Staff / Accountant / etc. | *(cannot assign tasks)* |

---

## 🚀 Getting Started (All Roles)

### Step 1 — Log In
1. Open the application in your browser.
2. You will be redirected to the **Login page** (`/auth`).
3. Enter your **Email** and **Password**.
4. Click **Sign In**.
5. You will be taken to the **Dashboard** automatically.

### Step 2 — Navigate the Interface
- **Left Sidebar** — The main navigation menu. Only modules relevant to your role are shown.
- **Top Header** — Contains a search bar, notification bell, and your profile menu.
- **Main Area** — Displays the content of the currently selected page.

### Step 3 — Profile Actions (Top Right)
Click your **avatar / name** in the top-right corner to:
- View your name and email.
- **Change Password** — Update your login password securely.
- **Sign Out** — Log out of the system.

#### How to Change Your Password
1. Click your avatar in the top-right corner.
2. Click **Change Password**.
3. Enter your **Current Password**.
4. Enter your **New Password** (minimum 6 characters).
5. Re-enter the new password in **Confirm New Password**.
6. Click **Save**. A green checkmark confirms success.

---

---

## 🔴 Admin

> **Full system access.** The Admin can configure every module, manage all users, view all audit logs, and use all features of every department.

### ✅ Accessible Modules
| Module | Path |
|---|---|
| Dashboard | `/dashboard` |
| Finance & Accounting (all) | `/tuition`, `/accounting/*`, `/payroll`, `/salary` |
| Human Resources (all) | `/teachers`, `/employees`, `/attendance-tracking`, `/leave-approve` |
| Academic (all) | `/students`, `/classes`, `/schedule`, `/homework`, `/attendance`, `/rooms` |
| Project Management (all) | `/projects`, `/task-assignment`, `/kanban-board`, `/gantt-chart`, `/sprint-planning`, `/workload-view`, `/comments-threads`, `/time-tracking` |
| Marketing (all) | `/marketing/*` |
| **User Management** | `/users` |
| **Audit Logs** | `/audit` |
| **System Setup** | `/system-setup` |

---

### 📖 Step-by-Step: User Management (`/users`)

> Only Admins can create, edit, block/unblock, and delete system users.

1. Click **User Management** in the left sidebar under **Administration**.
2. The page shows a table of all users with their name, email, role, department, and status.

**➕ Add a New User:**
1. Click the **+ Add User** button (top right of the page).
2. Fill in: **Name**, **Email**, **Password**, **Role**, **Department**, and **Level**.
3. Click **Save** to create the account.

**✏️ Edit a User:**
1. Find the user in the table.
2. Click the **Edit (pencil)** icon on their row.
3. Modify the fields you need to change.
4. Click **Save**.

**🚫 Block / Unblock a User:**
1. Find the user in the table.
2. Click the **Block** or **Unblock** button on their row.
3. Blocked users cannot log into the system.

**🗑️ Delete a User:**
1. Find the user in the table.
2. Click the **Delete (trash)** icon on their row.
3. Confirm the deletion in the dialog.

---

### 📖 Step-by-Step: System Setup (`/system-setup`)

> Configure which modules each role can access. Changes apply to all users of that role immediately.

1. Click **System Setup** in the sidebar under **Administration**.
2. The page shows a grid of **modules** and **roles**.
3. Each cell has a toggle (on/off).
4. **Toggle ON** to allow that role to see and use the module.
5. **Toggle OFF** to hide the module from that role.
6. Changes are saved automatically.

**Example:** To give Marketing Staff access to the Reports module, find the "Reports" row and toggle on the "Marketing Staff" column.

---

### 📖 Step-by-Step: Audit Logs (`/audit`)

> View a complete history of all actions performed in the system.

1. Click **Audit Logs** in the sidebar under **Administration**.
2. Browse the chronological log of events (who did what and when).
3. Use the filters to narrow down by **date**, **user**, or **action type**.

---

---

## 🟠 Director

> **Executive-level access.** Directors can view all departmental data, oversee the entire organization, and assign tasks to all Managers.

### ✅ Accessible Modules
| Module | Path |
|---|---|
| Dashboard | `/dashboard` |
| Finance & Accounting | `/tuition`, `/accounting/*`, `/payroll`, `/salary` |
| Human Resources | `/teachers`, `/employees`, `/attendance-tracking`, `/leave-approve` |
| Academic | `/students`, `/classes`, `/schedule`, `/homework`, `/attendance`, `/rooms` |
| Project Management | `/projects`, `/task-assignment`, `/kanban-board`, `/gantt-chart`, `/sprint-planning`, `/workload-view`, `/comments-threads`, `/time-tracking` |
| Marketing | `/marketing/*` |

> ❌ Directors do **not** have access to: User Management, Audit Logs, or System Setup.

---

### 📖 Step-by-Step: Dashboard Overview (`/dashboard`)
1. Click **Dashboard** in the sidebar under **Core**.
2. The dashboard auto-displays key metrics for all departments: finances, students, staff, tasks.
3. Use this page for a daily executive overview.

### 📖 Step-by-Step: Assigning Tasks to Managers
> As Director, you can assign tasks to any **Manager-level** role (Level 2).

1. Go to **Task Assignment** in the sidebar.
2. Click **+ New Task**.
3. Fill in the task **Title**, **Description**, **Due Date**, and **Priority**.
4. In the **Assign To** dropdown, you will see only **Managers** from all departments.
5. Select the manager and click **Save**.

---

---

## 🟡 HR Manager

> **Human Resources leader.** Manages teachers, employees, attendance tracking, and leave approvals. Can assign tasks to HR Staff.

### ✅ Accessible Modules
| Module | Path |
|---|---|
| Dashboard | `/dashboard` |
| Teachers | `/teachers` |
| Employees | `/employees` |
| Attendance Tracking | `/attendance-tracking` |
| Leave Approve | `/leave-approve` |
| Project Management (all) | `/projects`, `/task-assignment`, `/kanban-board`, `/gantt-chart`, `/sprint-planning`, `/workload-view`, `/comments-threads`, `/time-tracking` |

---

### 📖 Step-by-Step: Manage Employees (`/employees`)

**View all employees:**
1. Click **Employees** in the sidebar under **Human Resources**.
2. A table lists all employees with their name, position, department, and status.

**➕ Add an Employee:**
1. Click **+ Add Employee**.
2. Fill in: Name, Email, Department, Position, Hire Date, Salary.
3. Click **Save**.

**✏️ Edit an Employee:**
1. Click the **Edit** icon on an employee's row.
2. Update any field.
3. Click **Save**.

**🗑️ Delete an Employee:**
1. Click the **Delete** icon on the employee's row.
2. Confirm in the dialog.

---

### 📖 Step-by-Step: Attendance Tracking (`/attendance-tracking`)

1. Click **Attendance Tracking** in the sidebar.
2. The page shows a daily attendance grid for all staff.
3. **Mark Attendance**: Click on a staff member's cell and select **Present**, **Absent**, **Late**, or **On Leave**.
4. Use the **date picker** to switch between days.
5. Use **Export** to download the report as a spreadsheet.

---

### 📖 Step-by-Step: Leave Approvals (`/leave-approve`)

1. Click **Leave Approve** in the sidebar.
2. A list of pending leave requests is shown with the employee name, dates, and reason.
3. Click **Approve** ✅ to approve the request.
4. Click **Reject** ❌ to decline the request.
5. Approved leaves are automatically reflected in Attendance Tracking.

---

### 📖 Step-by-Step: Manage Teachers (`/teachers`)

1. Click **Teachers** in the sidebar.
2. View all teachers with their subject, hourly rate, and branch.
3. Use **+ Add Teacher** to register a new teacher.
4. Click **Edit** to update their profile.

---

---

## 🟢 HR Staff

> **Human Resources operations.** Supports HR Manager in day-to-day HR tasks. Cannot manage users or access finance/academic data.

### ✅ Accessible Modules
| Module | Path |
|---|---|
| Dashboard | `/dashboard` |
| Teachers | `/teachers` |
| Employees | `/employees` |
| Attendance Tracking | `/attendance-tracking` |
| Leave Approve | `/leave-approve` |
| Project Management (all) | `/projects`, `/task-assignment`, `/kanban-board`, etc. |

> **Note:** HR Staff has the same module access as HR Manager but **cannot assign tasks** (they are at Level 3 — the bottom of the HR hierarchy).

---

### 📖 Step-by-Step: Processing Leave Requests

1. Go to **Leave Approve** in the sidebar.
2. Review pending leave requests.
3. Click **Approve** or **Reject** for each request.
4. Add a note/reason in the comment field if needed.
5. Click **Confirm**.

### 📖 Step-by-Step: Recording Attendance

1. Go to **Attendance Tracking**.
2. Select today's date using the date picker.
3. For each employee in the list, click their status cell.
4. Choose: **Present**, **Absent**, **Late**, or **On Leave**.
5. The record is saved automatically.

---

---

## 🔵 Finance Manager

> **Financial department head.** Full access to all financial modules: invoices, payments, expenses, balance sheets, payroll, and salary. Can assign tasks to Accountants.

### ✅ Accessible Modules
| Module | Path |
|---|---|
| Dashboard | `/dashboard` |
| Tuition Invoices | `/tuition` |
| Payments | `/accounting/payments` |
| Expenses | `/accounting/expenses` |
| Balance Sheet | `/accounting/balance-sheet` |
| Payroll | `/payroll` |
| Salary | `/salary` |
| Project Management (all) | `/projects`, `/task-assignment`, etc. |

---

### 📖 Step-by-Step: Tuition Invoices (`/tuition`)

**View all invoices:**
1. Click **Tuition Invoices** in the sidebar.
2. A table shows all student invoices with status: **Paid**, **Pending**, **Overdue**.

**➕ Create an Invoice:**
1. Click **+ New Invoice**.
2. Select the **Student**, fill in the **Amount**, **Due Date**, and **Description**.
3. Click **Save**.

**💳 Mark as Paid:**
1. Find the invoice in the list.
2. Click **Mark as Paid**.
3. The status updates to **Paid** immediately.

**🗑️ Delete an Invoice:**
1. Click the **Delete** icon on the invoice row.
2. Confirm in the dialog.

---

### 📖 Step-by-Step: Expenses (`/accounting/expenses`)

1. Click **Expenses** in the sidebar.
2. View all recorded expenses with category, amount, and date.

**➕ Add an Expense:**
1. Click **+ Add Expense**.
2. Fill in: **Category**, **Amount**, **Date**, **Description**, and optionally attach a receipt.
3. Click **Save**.

**✏️ Edit / 🗑️ Delete:** Use the Edit and Delete icons on each row.

---

### 📖 Step-by-Step: Payroll (`/payroll`)

1. Click **Payroll** in the sidebar.
2. View the payroll summary for all employees for the current period.
3. Click **Process Payroll** to generate salaries for the month.
4. Review the individual breakdowns and click **Confirm** to finalize.

---

### 📖 Step-by-Step: Balance Sheet (`/accounting/balance-sheet`)

1. Click **Balance Sheet** in the sidebar.
2. Select the **date range** or **month** to view.
3. The sheet shows **Assets**, **Liabilities**, and **Equity** sections.
4. Use **Export** to download as PDF or spreadsheet.

---

---

## 🔷 Accountant

> **Financial operations staff.** Supports the Finance Manager with bookkeeping, payment recording, and expense tracking.

### ✅ Accessible Modules
| Module | Path |
|---|---|
| Dashboard | `/dashboard` |
| Tuition Invoices | `/tuition` |
| Payments | `/accounting/payments` |
| Expenses | `/accounting/expenses` |
| Balance Sheet | `/accounting/balance-sheet` |
| Payroll | `/payroll` |
| Salary | `/salary` |
| Project Management (all) | `/projects`, `/task-assignment`, etc. |

> **Note:** Accountants have the same financial module access as Finance Manager but **cannot assign tasks** (Level 3).

---

### 📖 Step-by-Step: Recording Payments (`/accounting/payments`)

1. Click **Payments** in the sidebar.
2. View a list of all incoming payments.

**➕ Record a Payment:**
1. Click **+ Add Payment**.
2. Select the related **Invoice** or **Student**.
3. Enter the **Amount Paid**, **Payment Date**, and **Method** (cash, bank transfer, etc.).
4. Click **Save**.

---

### 📖 Step-by-Step: Managing Salary Records (`/salary`)

1. Click **Salary** in the sidebar.
2. View all salary records per employee.
3. Use the **month/year** filter to select a specific period.
4. Click on any record to see the detailed breakdown (base pay, allowances, deductions).

---

---

## 🟣 Academic Manager

> **Academic department head.** Full control over students, classes, schedules, homework, attendance, and room management. Can assign tasks to Academic Staff.

### ✅ Accessible Modules
| Module | Path |
|---|---|
| Dashboard | `/dashboard` |
| Students | `/students` |
| Classes | `/classes` |
| Schedule | `/schedule` |
| Homework | `/homework` |
| Attendance | `/attendance` |
| Rooms | `/rooms` |
| Project Management (all) | `/projects`, `/task-assignment`, etc. |

---

### 📖 Step-by-Step: Manage Students (`/students`)

**View all students:**
1. Click **Students** in the sidebar.
2. Browse the list of all enrolled students.
3. Use **Search** or **Filter by Class** to find specific students.

**➕ Enroll a New Student:**
1. Click **+ Add Student**.
2. Fill in: **Full Name**, **Date of Birth**, **Parent Contact**, **Class**, **Enrollment Date**.
3. Click **Save**.

**✏️ Edit a Student Profile:**
1. Click the **Edit** icon on the student's row.
2. Update the required fields.
3. Click **Save**.

---

### 📖 Step-by-Step: Manage Classes (`/classes`)

1. Click **Classes** in the sidebar.
2. View all classes with their name, teacher, schedule, and number of students.

**➕ Create a Class:**
1. Click **+ New Class**.
2. Fill in: **Class Name**, **Teacher**, **Room**, **Start Date**, **Schedule**, **Max Students**.
3. Click **Save**.

---

### 📖 Step-by-Step: Schedule Management (`/schedule`)

1. Click **Schedule** in the sidebar.
2. A **weekly calendar view** shows all scheduled classes.
3. Click on any time slot to **add a new session**.
4. Fill in: **Class**, **Room**, **Teacher**, **Start Time**, **End Time**.
5. Click **Save**.
6. To **edit or delete** a session, click on the existing block in the calendar.

---

### 📖 Step-by-Step: Homework (`/homework`)

1. Click **Homework** in the sidebar.
2. View all homework assignments across classes.

**➕ Assign Homework:**
1. Click **+ Add Homework**.
2. Select the **Class**, enter the **Title**, **Description**, and **Due Date**.
3. Click **Save**.

**✅ Mark as Submitted:**
1. Open a homework record.
2. Click on a student's name and toggle their submission status.

---

### 📖 Step-by-Step: Attendance (`/attendance`)

1. Click **Attendance** in the sidebar.
2. Select a **Class** and **Date**.
3. A list of students in that class appears.
4. Mark each student as **Present** ✅ or **Absent** ❌.
5. Click **Save All** to submit.

---

### 📖 Step-by-Step: Rooms (`/rooms`)

1. Click **Rooms** in the sidebar.
2. View all available rooms with their capacity and current status.
3. Use **+ Add Room** to register a new room.
4. Click **Edit** to update room details or mark it as **Unavailable**.

---

---

## 🟤 Academic Staff

> **Academic operations support.** Works directly with students and classes under Academic Manager's direction.

### ✅ Accessible Modules
| Module | Path |
|---|---|
| Dashboard | `/dashboard` |
| Students | `/students` |
| Classes | `/classes` |
| Schedule | `/schedule` |
| Homework | `/homework` |
| Attendance | `/attendance` |
| Rooms | `/rooms` |
| Project Management (all) | `/projects`, `/task-assignment`, etc. |

> **Note:** Same academic module access as Academic Manager but **cannot assign tasks** (Level 3).

---

### 📖 Day-to-Day Tasks for Academic Staff

**Morning Routine — Take Attendance:**
1. Go to **Attendance** (`/attendance`).
2. Select your assigned **Class** and today's **Date**.
3. Mark each student as Present or Absent.
4. Click **Save All**.

**Assign Homework:**
1. Go to **Homework** (`/homework`).
2. Click **+ Add Homework**.
3. Select your **Class**, add the **Title**, **Description**, **Due Date**.
4. Click **Save**.

**Check Today's Schedule:**
1. Go to **Schedule** (`/schedule`).
2. The calendar shows today's classes in your schedule view.

---

---

## 🩵 Marketing Manager

> **Marketing department head.** Full control over leads, campaigns, follow-ups, promotions, sources, and marketing reports. Can assign tasks to Marketing Staff.

### ✅ Accessible Modules
| Module | Path |
|---|---|
| Dashboard | `/dashboard` |
| Leads | `/marketing/leads` |
| Campaigns | `/marketing/campaigns` |
| Sources | `/marketing/sources` |
| Promotions | `/marketing/promotions` |
| Follow-up | `/marketing/follow-up` |
| Reports | `/marketing/reports` |
| Project Management (all) | `/projects`, `/task-assignment`, etc. |

---

### 📖 Step-by-Step: Manage Leads (`/marketing/leads`)

**View all leads:**
1. Click **Leads** in the sidebar under **Marketing**.
2. Browse leads with their name, status (New / Contacted / Trial / Enrolled), and source.
3. Use **Search**, **Filter by Status**, or **Filter by Source** to narrow results.

**➕ Add a New Lead:**
1. Click **+ Add Lead**.
2. Fill in: **Full Name**, **Phone**, **Email**, **Source**, **Interested Course**, **Notes**.
3. Click **Save**.

**📋 View Lead Details:**
1. Click on a lead's name or the **View** icon.
2. The lead detail page shows their full profile, activity history, and follow-up tasks.

**🔄 Update Lead Status:**
1. Open the lead.
2. Change the **Status** dropdown: New → Contacted → Trial Scheduled → Enrolled.
3. The status auto-saves.

**🗑️ Delete a Lead:**
1. Click the **Delete** icon on the lead's row.
2. Confirm in the dialog.

---

### 📖 Step-by-Step: Manage Campaigns (`/marketing/campaigns`)

1. Click **Campaigns** in the sidebar.
2. View all campaigns with their budget, channel, and status (Planning / Running / Completed).

**➕ Create a Campaign:**
1. Click **+ New Campaign**.
2. Fill in: **Name**, **Channel** (Facebook, Google, etc.), **Budget**, **Start Date**, **End Date**, **Target Audience**.
3. Click **Save**.

**📊 Track Campaign Performance:**
1. Open a campaign.
2. View metrics: **Impressions**, **Leads Generated**, **Conversions**, **Cost Per Lead**.

---

### 📖 Step-by-Step: Follow-up Management (`/marketing/follow-up`)

1. Click **Follow-up** in the sidebar.
2. View all pending follow-up tasks with their due dates and priorities.

**➕ Create a Follow-up Task:**
1. Click **+ Add Follow-up**.
2. Select the **Lead**, set the **Due Date**, **Priority** (Low / Medium / High), and add **Notes**.
3. Click **Save**.

**✅ Mark as Completed:**
1. Click the **checkbox** on a follow-up task.
2. It moves to the **Completed** section.

> ⚠️ **Overdue** follow-ups are highlighted in red automatically.

---

### 📖 Step-by-Step: Promotions (`/marketing/promotions`)

1. Click **Promotions** in the sidebar.
2. View all promo codes with their discount value and expiry date.

**➕ Create a Promo Code:**
1. Click **+ Add Promotion**.
2. Fill in: **Code** (e.g., `SUMMER20`), **Discount Type** (percentage or fixed), **Value**, **Expiry Date**, **Max Uses**.
3. Click **Save**.

**📋 Copy a Promo Code:**
1. Find the code in the list.
2. Click the **Copy** icon next to the code. It is copied to your clipboard.

---

### 📖 Step-by-Step: Marketing Reports (`/marketing/reports`)

1. Click **Reports** in the sidebar.
2. View overview charts:
   - **Lead Volume** over time
   - **Conversion Rate** by stage
   - **Source Performance** (Facebook vs Google vs Referral, etc.)
   - **Campaign ROI**
3. Use the **date range picker** to change the reporting period.
4. Use **Export** to download the data.

---

### 📖 Step-by-Step: Lead Sources (`/marketing/sources`)

1. Click **Sources** in the sidebar.
2. View all lead sources (Facebook, Google, Referral, TikTok, etc.) with their status.

**➕ Add a New Source:**
1. Click **+ Add Source**.
2. Enter the **Source Name**.
3. Click **Save**.

**Enable/Disable a Source:**
1. Click the **toggle** on the source's row.
2. Disabled sources will no longer appear in the Lead form's source dropdown.

---

---

## ⚪ Marketing Staff

> **Marketing operations.** Works on leads, campaigns, and follow-ups under the Marketing Manager's direction.

### ✅ Accessible Modules
| Module | Path |
|---|---|
| Dashboard | `/dashboard` |
| Leads | `/marketing/leads` |
| Campaigns | `/marketing/campaigns` |
| Sources | `/marketing/sources` |
| Promotions | `/marketing/promotions` |
| Follow-up | `/marketing/follow-up` |
| Reports | `/marketing/reports` |
| Project Management (all) | `/projects`, `/task-assignment`, etc. |

> **Note:** Same marketing module access as Marketing Manager but **cannot assign tasks** (Level 3).

---

### 📖 Daily Workflow for Marketing Staff

**1. Check Follow-ups Due Today:**
1. Go to **Follow-up** (`/marketing/follow-up`).
2. Filter by **Today** or **Overdue**.
3. Complete each task and mark it done.

**2. Add New Leads:**
1. Go to **Leads** (`/marketing/leads`).
2. Click **+ Add Lead** and fill in all contact details.
3. Set the **Status** to **New**.

**3. Update Lead Status:**
1. Find the lead you spoke with.
2. Open their profile.
3. Update their **Status** to reflect where they are in the funnel (e.g., Contacted, Trial Scheduled).

**4. Schedule a Follow-up:**
1. Go to **Follow-up** or open the Lead Detail page.
2. Click **+ Add Follow-up**.
3. Set the **Date**, **Priority**, and **Notes** about what to discuss.
4. Click **Save**.

---

---

## 🔗 Shared Features (All Roles)

These features are available to **every user** regardless of role.

---

### 📖 Projects (`/projects`)

1. Click **Projects** in the sidebar.
2. View all active projects in a card layout.
3. Click on a project card to open its **detail page** showing all tasks, team members, and progress.

**➕ Create a Project:**
1. Click **+ New Project**.
2. Enter: **Title**, **Description**, **Start Date**, **End Date**, **Team Members**.
3. Click **Save**.

---

### 📖 Kanban Board (`/kanban-board`)

1. Click **Kanban Board** in the sidebar.
2. View tasks grouped in columns: **To Do → In Progress → In Review → Done**.
3. **Drag and drop** a task card between columns to update its status.
4. Click on a card to open its details and add comments.

---

### 📖 Gantt Chart (`/gantt-chart`)

1. Click **Gantt Chart** in the sidebar.
2. A timeline view shows all tasks and their durations across a calendar.
3. Use the **zoom controls** to switch between day/week/month views.
4. Hover over a bar to see task details.

---

### 📖 Sprint Planning (`/sprint-planning`)

1. Click **Sprint Planning** in the sidebar.
2. View the current sprint with its **Start Date**, **End Date**, and all tasks.
3. Click **+ New Sprint** to create a sprint.
4. Drag tasks from the **Backlog** into the sprint.
5. Click **Start Sprint** to activate it.

---

### 📖 Workload View (`/workload-view`)

1. Click **Workload View** in the sidebar.
2. A grid shows all team members and how many tasks they are currently assigned.
3. Use this to **balance workload** before assigning new tasks.
4. Color codes: 🟢 Light → 🟡 Medium → 🔴 Heavy workload.

---

### 📖 Task Assignment (`/task-assignment`)

> ⚠️ You can only assign tasks to staff **one level below you in the same department**.

1. Click **Task Assignment** in the sidebar.
2. View all tasks currently assigned to or by you.

**➕ Create a New Task:**
1. Click **+ New Task**.
2. Fill in: **Title**, **Description**, **Due Date**, **Priority** (Low / Medium / High / Urgent).
3. In the **Assign To** dropdown, select an eligible employee (filtered by your level and department).
4. Click **Save**.

**📋 View Task Details:**
1. Click on a task title to open its full details.
2. View: attachments, comments, status updates, and history.

**✅ Update Task Status:**
1. Open a task.
2. Change the **Status** dropdown: `To Do` → `In Progress` → `In Review` → `Done`.
3. The change is saved automatically.

---

### 📖 Time Tracking (`/time-tracking`)

1. Click **Time Tracking** in the sidebar.
2. View your personal time log for all tasks.

**⏱️ Log Time on a Task:**
1. Click **+ Log Time**.
2. Select the **Task**, enter the **Date**, **Hours Spent**, and a brief **Note**.
3. Click **Save**.

---

### 📖 Comments & Threads (`/comments-threads`)

1. Click **Comments & Threads** in the sidebar.
2. View all discussion threads you are part of.
3. Click on a thread to see the full conversation.

**💬 Start a New Thread:**
1. Click **+ New Thread**.
2. Enter a **Title** and your **Message**.
3. Tag team members using `@name`.
4. Click **Post**.

**↩️ Reply to a Thread:**
1. Open a thread.
2. Type your reply in the input box at the bottom.
3. Click **Send**.

---

---

## 🏗️ Task Assignment Hierarchy Rules

This section clarifies the exact rules governing who can assign tasks to whom.

```
Department: HR
─────────────────────────────────────
HR Manager (Level 2)
  └── Can assign to: HR Staff (Level 3)

Department: Finance
─────────────────────────────────────
Finance Manager (Level 2)
  └── Can assign to: Accountant (Level 3)

Department: Academic
─────────────────────────────────────
Academic Manager (Level 2)
  └── Can assign to: Academic Staff (Level 3)

Department: Marketing
─────────────────────────────────────
Marketing Manager (Level 2)
  └── Can assign to: Marketing Staff (Level 3)

Cross-Department (Admin / Director — Level 1)
─────────────────────────────────────────────
Admin / Director
  └── Can assign to: All Level 2 Managers
      (HR Manager, Finance Manager, Academic Manager, Marketing Manager)
```

### ❌ What You Cannot Do
- A **Marketing Staff** cannot assign tasks to anyone.
- An **HR Manager** cannot assign tasks to a **Finance Staff** (different department).
- A **Finance Manager** cannot assign tasks to another **Finance Manager** (same level).

---

*For technical support or account issues, contact your System Administrator.*

---

**📁 File:** `USER_GUIDE_BY_ROLE.md`  
**🏢 System:** MCNA ERP (Scholastic Compass Pro)  
**📅 Version:** June 2026
