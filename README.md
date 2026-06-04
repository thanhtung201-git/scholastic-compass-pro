# MCNAEdu ERP — User Guide

A comprehensive guide to every menu pane and function in the MCNAEdu ERP system — a multi-branch academic center management platform covering students, classes, schedules, tuition, payroll, HR, marketing, and project management.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Dashboard](#2-dashboard)
3. [Finance & Accounting](#3-finance--accounting)
   - 3.1 [Tuition Invoices](#31-tuition-invoices)
   - 3.2 [Payments](#32-payments)
   - 3.3 [Expenses / Cash Vouchers](#33-expenses--cash-vouchers)
   - 3.4 [Balance Sheet](#34-balance-sheet)
   - 3.5 [Payroll](#35-payroll)
   - 3.6 [Salary](#36-salary)
4. [Human Resources](#4-human-resources)
   - 4.1 [Employees](#41-employees)
   - 4.2 [Teachers](#42-teachers)
   - 4.3 [Attendance Tracking](#43-attendance-tracking)
   - 4.4 [Leave Approve](#44-leave-approve)
5. [Project Management](#5-project-management)
   - 5.1 [Task Assignment](#51-task-assignment)
   - 5.2 [Kanban Board](#52-kanban-board)
   - 5.3 [Gantt Chart](#53-gantt-chart)
   - 5.4 [Sprint Planning](#54-sprint-planning)
   - 5.5 [Workload View](#55-workload-view)
   - 5.6 [Comments & Threads](#56-comments--threads)
   - 5.7 [Time Tracking](#57-time-tracking)
   - 5.8 [Projects](#58-projects)
6. [Administration](#6-administration)
   - 6.1 [User Management](#61-user-management)
   - 6.2 [Audit Logs](#62-audit-logs)
7. [Role-Based Access Summary](#7-role-based-access-summary)

---

## 1. Authentication

**Route:** `/auth`

The login and registration gateway for the system.

### Functions

| Function | Description |
|---|---|
| **Sign In** | Log in with email and password (default: 'password123'). Redirects to `/dashboard` on success. |
| **Sign Up** | Admin creates accounts for users (reference 6.1). |

> After sign-in, the system fetches the user's profile from the `users` table. If a Teacher role is detected, a teacher profile is automatically synced to the `teachers` table.

---

## 2. Dashboard

**Route:** `/dashboard`

The landing page after login. The content shown depends entirely on the logged-in user's role.

### Role-Specific Views

| Role | View Shown |
|---|---|
| **Admin** | Admin Console + Enterprise Overview (tabbed) |
| **Director** | Executive Overview + Enterprise Overview (tabbed) |
| **Academic Staff** | Academic Operations dashboard |
| **Accountant** | Finance Center dashboard |
| **Receptionist** | Reception Desk dashboard |
| **Teacher / Student** | Access-denied message (management only) |

### Admin / Director Console — Sections

- **Finance KPIs** — Total Revenue, Total Expenses, Teacher Payout, Unpaid Invoices count
- **People & Operations KPIs** — Active Users, Blocked Accounts, Students count, Branch count
- **Project Tasks** — Live counts for Todo / In Progress / Review / Done tasks
- **Revenue Trend** — Bar chart of tuition collected over the last 6 months
- **Audit Log** — Live timeline of the 5 most recent system actions
- **Class Health by Branch** — Per-branch active/ended class breakdown
- **Users by Role** — Horizontal bar chart of staff distribution by role
- **System Alerts** — Pending attendance log count, unpaid invoice count, database health
- **Tasks by Department** — Card grid with todo/active/done counts and a progress bar per department
- **Recent Tasks** — List of the 8 most recently created tasks with status badges
- **Teacher Wages** — Card per teacher showing approved hours and total wage earned

### Enterprise Overview — Sections

- **Finance & Accounting** — Revenue, Expenses, Payroll, Net Balance stat cards
- **Human Resources** — Teacher count, Staff count, Employees by Department, Action Items (pending attendance)
- **Project Management** — Total tasks with per-status progress bars (Todo, In Progress, Review, Done)

### Academic Dashboard — Sections

- Active Classes, Enrolled Students, Teacher count, Today's Sessions stat cards
- Class Overview table (enrolment fill bar per class)
- Quick Actions (links to Students, Scheduler, Homework, Payroll)

### Accountant Dashboard — Sections

- Revenue Collected, Outstanding Debt, Total Billed, Payroll Pending stat cards
- Overdue Invoices list (top 6)
- Payroll Queue (pending attendance logs)

### Receptionist Dashboard — Sections

- Room availability, today's visitors, today's sessions stat cards
- Room Availability grid (free/in-use status per classroom)
- Today's Check-ins log with manual guest check-in

---

## 3. Finance & Accounting

### 3.1 Tuition Invoices

**Route:** `/tuition`

Tracks all student tuition invoices, payment status, and outstanding balances.

| Function | Description |
|---|---|
| **Summary Cards** | Displays total billed, total collected, and total outstanding across all invoices. |
| **Search** | Filter invoices by student name or invoice ID. |
| **Status Badge** | Dynamically computed as Paid, Partially Paid, Unpaid, or Overdue (if past due date). |
| **Record Payment** | Opens a dialog to record a partial or full payment for an invoice. Enter amount and select payment method (Bank Transfer, Cash, Card, E-Wallet). Updates `amount_paid`, `remaining_debt`, and `status` directly in the database. |
| **View Invoice Detail** | Opens a printable invoice view showing student info, class, payment summary, and payment note. |
| **Print Invoice** | Triggers browser print for the detail view. |
| **Export CSV** | Downloads all filtered invoices as a UTF-8 CSV file. |

---

### 3.2 Payments

**Route:** `/accounting/payments`

Shows the full transaction history of individual tuition payments (from the `tuition_payments` table).

| Function | Description |
|---|---|
| **Search** | Filter by student name or invoice ID. |
| **Payment Count Badge** | Shows number of results in the current filter. |
| **Export CSV** | Downloads filtered payment records as a BOM-prefixed CSV (Excel-compatible with Vietnamese characters). |

---

### 3.3 Expenses / Cash Vouchers

**Route:** `/accounting/expenses`

Full double-entry cash voucher management system for receipts (Thu) and payments (Chi).

| Function | Description |
|---|---|
| **Create Receipt (Phiếu Thu)** | Opens a form to create a new income voucher. Includes auto-generated voucher number, date, payer name, reason, amount (with Vietnamese words auto-filled), debit/credit account fields, department, and file attachment. |
| **Create Payment (Phiếu Chi)** | Same as above but for expense vouchers. |
| **Source Linking** | Link a voucher to an existing expense record, payroll receipt, or marketing campaign. Selecting a source auto-fills amount, payee name, and reason. |
| **Post Voucher (Duyệt)** | Approves a Draft voucher: creates journal entries (debit + credit), marks linked payroll as "Đã chi", updates marketing campaign spend, and sets status to "Posted". |
| **Cancel Voucher** | Sets a Draft or Posted voucher to "Cancelled". |
| **Edit Voucher** | Re-opens the form for any Draft voucher. |
| **View Detail** | Opens a print-ready A5 voucher layout with signature blocks. |
| **Print** | Opens a popup print window for the voucher. |
| **Download PDF** | Exports the voucher detail as a PDF using html2canvas + jsPDF. |
| **Filter** | Filter by type (Thu/Chi), department, status (Draft/Posted/Cancelled), and date range. |
| **Export CSV** | Downloads filtered vouchers as a CSV. |
| **Import Excel** | Upload an `.xlsx` file to bulk-create Draft vouchers. Validates required columns, shows row-by-row error highlighting before confirmation. |

---

### 3.4 Balance Sheet

**Route:** `/accounting/balance-sheet`

Automated financial balance sheet aggregated from journal entries, expenses, payroll, and marketing data.

| Function | Description |
|---|---|
| **Period Selection** | Choose between Month, Quarter, or Year view. Select year, month/quarter as applicable. |
| **Auto-calculation** | All figures are computed from live database data: cash (111/112), receivables (131), prepaid (142), fixed assets (211), depreciation (214), supplier payables (331), salary payables (334), tax payable (333), and equity accounts (411, 421). |
| **Comparative View** | Each line shows current period vs. previous period values side by side. |
| **Balance Check** | A red warning banner appears if Total Assets ≠ Total Sources (with the exact difference shown). |
| **Footer Insights** | Headcount by department, pending payroll count and amount, active campaign budget remaining. |
| **Refresh** | Manually re-fetches all data. |
| **Export Excel** | Downloads the balance sheet plus raw journal entries, payroll, and expense detail sheets as an `.xlsx` file. |
| **Print** | Browser print of the full report. |

---

### 3.5 Payroll

**Route:** `/payroll`

Manages teacher attendance-based wage approval and payslip generation.

**Tabs:**

#### Payslips Tab

| Function | Description |
|---|---|
| **Generate Payslip** | Select a teacher and month, optionally add bonus and deduction amounts. Base salary is calculated from approved attendance logs in that period. |
| **Mark as Paid** | Changes payslip status from Draft to Paid. Available to Accountants and Admins only. |
| **Payslip Table** | Displays all payslips with teacher name, period, base salary, bonus, deductions, total, and status. |

#### Attendance Logs Tab

| Function | Description |
|---|---|
| **Pending/Approved Summary** | Shows total VND pending approval and total approved. |
| **Attendance Log Table** | Lists all attendance logs with teacher, class, date, hours, hourly rate, total pay, and approval status. |
| **Approve Log** | One-click approval for Draft logs. Updates status to Approved, making them eligible for payslip calculation. Available to Accountants and Admins. |

---

### 3.6 Salary

**Route:** `/salary`

Automated monthly payroll receipt management with Vietnamese tax and insurance deductions.

> Access restricted to Finance Manager, Accountant, Admin, and Director roles.

| Function | Description |
|---|---|
| **Period Picker** | Select month and year for the payroll period. |
| **Generate Payroll** | Scans all active employees, inserts payroll receipts for those without one in the selected period. A DB trigger calculates gross salary, insurance (BHXH 8% + BHYT 1.5% + BHTN 1% = 10.5%), progressive income tax, and net salary automatically. |
| **Summary Bar** | Shows total payroll fund (in billions VND), voucher channel (VietQR), and total receipt count. |
| **Payroll Table** | Lists each employee with their gross salary, insurance deduction, income tax, net take-home pay, and payment status (Chờ chuyển / Đã chi / Tạm hoãn). |
| **Approve (Duyệt chi)** | Marks an individual receipt as "Đã chi" (paid). |
| **View Payslip (Phiếu chi)** | Opens an A4-formatted payslip modal with school letterhead, employee info, income/deduction breakdown, and net pay. |
| **Print / Export PDF** | Print or download the payslip as a PDF. |
| **Pagination** | 10 records per page with Previous/Next navigation. |

---

## 4. Human Resources

### 4.1 Employees

**Route:** `/employees`

Full employee directory with search, department filter, and per-employee detail.

| Function | Description |
|---|---|
| **Search** | Filter by name or phone number (case-insensitive). |
| **Department Filter** | Dropdown to show only employees in a specific department. |
| **Stats Bar** | Shows total employee count, currently filtered count, average total salary, and insurance/tax note. |
| **Employee Table** | Paginated (15 per page) list showing full name, role, department, phone, and total salary (base + bonus). |
| **Detail Modal** | Click "Detail" to view a full profile: email, phone, department, role, contract type, base salary, bonus salary, start date, and status. Email is fetched from the linked `users` table. |
| **Pagination** | Previous/Next buttons with current page indicator. |

---

### 4.2 Teachers

**Route:** `/teachers`

Read-only table of all teachers in the system.

| Function | Description |
|---|---|
| **Teacher Table** | Displays name, subject, branch, and hourly rate for each teacher. |

---

### 4.3 Attendance Tracking

**Route:** `/attendance-tracking`

Daily employee check-in/check-out records from the `attendance_tracking` table.

| Function | Description |
|---|---|
| **Date Filter** | Date picker (defaults to today) to view records for any specific date. |
| **Attendance Table** | Shows employee name, date, check-in time, check-out time, status badge (PRESENT / LATE / ABSENT / LEAVE), and notes. |
| **Status Badge** | Color-coded: green for Present, orange for Late, red for Absent, blue for Leave. |

---

### 4.4 Leave Approve

**Route:** `/leave-approve`

Leave request submission and approval workflow.

| Function | Description |
|---|---|
| **View Leave Requests** | All users see their own requests. HR Manager, HR Staff, and Director can see all employee requests. |
| **Department Filter** | Directors and HR roles can filter by department. |
| **Status Filter** | Filter by ALL / Pending / Approved / Rejected. |
| **Add Leave Request** | Opens a dialog to create a new leave request. Regular employees fill their own details; HR can select any employee. Fields: employee, reason (textarea), start date, end date. |
| **Approve Request** | HR roles see "Duyệt" (Approve) and "Từ chối" (Reject) buttons for Pending requests. A confirmation dialog appears before any action. |
| **Confirmation Dialog** | Requires explicit confirmation before approving or rejecting. |
| **Status Badge** | Color-coded: orange for Pending, green for Approved, red for Rejected. |

---

## 5. Project Management

### 5.1 Task Assignment

**Route:** `/task-assignment`

Full task management with table and kanban views, filtered by role and department.

| Function | Description |
|---|---|
| **Role-Based Visibility** | Directors see all tasks. Managers see tasks in their department. Other staff see only tasks assigned to them. |
| **Table View** | Sortable table with title, department (Director only), assignee, priority badge, due date with overdue indicator, and status badge. |
| **Kanban View** | Four-column board (Todo / In Progress / Review / Done) with drag-and-drop between columns. |
| **Status Filter** | Tab-style buttons to filter by All / Todo / In Progress / Review / Done. |
| **Department Filter** | Director-only dropdown to filter by department. |
| **New Task** | Dialog (managers and above only) with fields: title, description, department, assign-to (filtered by department roles), priority, and due date (text field + calendar picker). |
| **Update Status (Table)** | Dropdown in the Actions column to change task status (managers only). |
| **Drag and Drop (Kanban)** | Drag a card to a new column to update its status in the database. |
| **Task Detail Modal** | Eye icon opens a detailed modal with tabs for Details, Comments, Attachments, and Time tracking. |

---

### 5.2 Kanban Board

**Route:** `/kanban-board`

Dedicated kanban board with task creation and real-time assignment.

| Function | Description |
|---|---|
| **Four Columns** | Todo, In Progress, Review, Done — each showing task count. |
| **Drag and Drop** | Drag tasks between columns to update status. |
| **Assign User** | Inline `<select>` dropdown on each card to reassign the task to any user. |
| **New Task** | Dialog (managers only) with title, description, department, assign-to, priority, and due date. |
| **View Detail** | Eye icon on each card opens the Task Detail Modal. |

---

### 5.3 Gantt Chart

**Route:** `/gantt-chart`

Visual timeline of all tasks by department and assignee.

| Function | Description |
|---|---|
| **Zoom Levels** | Week (96px/day), Month (48px/day), Quarter (24px/day). |
| **Department Filter** | Pill buttons to show all departments or a specific one. |
| **Today Line** | Red vertical line with a "Today" label marks the current date. |
| **Task Bars** | Colored bars per department, spanning from task creation date to due date. Overdue tasks (past due, not Done) display a red hatched pattern. |
| **Tooltips** | Hover over a bar to see assignee, created date, due date, status, and priority. An "Overdue" badge appears if applicable. |
| **Role Filtering** | Directors see all tasks; other roles see only tasks in their department. |

---

### 5.4 Sprint Planning

**Route:** `/sprint-planning`

Agile sprint management with backlog assignment and capacity tracking.

| Function | Description |
|---|---|
| **Sprint List** | Left panel showing all sprints with name, date range, and task count. Click to select. |
| **Create Sprint** | Dialog with sprint name, description, goal, start/end dates, and team capacity (hours). Status defaults to "Planning". |
| **Delete Sprint** | Removes the sprint after confirmation. All tasks in the sprint have their `sprint_id` cleared (moved to backlog). |
| **Sprint Overview** | Shows duration, capacity (hours), hours used by estimated tasks, and remaining capacity (red if overloaded). |
| **Add Task to Sprint** | Dialog to select a backlog task (filtered by role) and assign it to the current sprint. |
| **Remove Task from Sprint** | Trash icon on a sprint task card clears its `sprint_id`, returning it to the backlog. |
| **Backlog** | Bottom grid showing all tasks not yet in any sprint, with status and priority badges. |
| **Capacity Bar** | Reflects estimated hours vs. capacity in real time. |

---

### 5.5 Workload View

**Route:** `/workload-view`

Visualizes task load per person to identify bottlenecks.

| Function | Description |
|---|---|
| **Department Filter** | Pill buttons to filter by department. |
| **User Cards** | Each card shows name, role, department, capacity percentage badge, Active/Done/Overdue counts, capacity progress bar (green → blue → amber → red), and the first 3 task titles. |
| **Overload Warning** | A red alert appears on cards at ≥ 90% capacity, suggesting how many tasks to redistribute. |
| **Max Capacity** | Set at 8 active tasks per person. |
| **Task Detail Sidebar** | Clicking a user card opens a slide-out sheet listing all their tasks with status and due date. |

---

### 5.6 Comments & Threads

**Route:** `/comments-threads`

Threaded discussion system linked to individual tasks.

| Function | Description |
|---|---|
| **Task Cards** | Left panel grid of all tasks in the user's department (clickable to open the thread). |
| **Thread Panel** | Slide-out sheet showing the full comment thread for the selected task. |
| **Task Header** | Shows title, assignee, due date, status, and priority in the panel header. |
| **Add Comment** | Textarea with toolbar buttons (Bold, Italic, Link, Attachment, @-mention). Click Send to post. |
| **Reply** | "Reply" button on any comment pre-fills the textarea with `@FirstName` and links the new comment as a reply. |
| **Threaded Replies** | Replies are indented under their parent comment with a left border. |
| **Activity Log** | Right sidebar in the panel shows a timestamped log of all comments and status events. |
| **Real-time Updates** | Panel subscribes to Supabase Realtime for the task's comments and auto-refreshes on new messages. |
| **Mentions** | `@username` patterns in comment text are highlighted in blue. |

---

### 5.7 Time Tracking

**Route:** `/time-tracking`

Log and monitor time spent on individual tasks.

| Function | Description |
|---|---|
| **Quick Start Timer** | Select a task from the dropdown and click "Start Timer". The elapsed time counter runs in real time. Only one timer can run at a time — starting a new one stops the previous. |
| **Stop Timer** | Stops the active timer and saves the end time to the database. |
| **Active Timer Banner** | A green banner shows the running timer with elapsed time and task name while tracking. |
| **Manual Entry** | Dialog to log time retroactively: select task, set start time, end time (datetime-local inputs), and optional description. |
| **Stats Cards** | Today's total hours/minutes, filtered period total, and log count. |
| **Date Filter** | Toggle between Today, This Week, or All Time. |
| **Time Log Table** | Shows task name, date, start time, end time ("Running" if active), duration, and description. |
| **Delete Log** | Trash icon removes a time log entry after confirmation. |
| **Role Filtering** | Same logic as Task Assignment — Directors see all, Managers see their department, others see their own tasks. |

---

### 5.8 Projects

**Route:** `/projects` and `/projects/:projectId`

High-level project tracker with a Kanban board per project.

| Function | Description |
|---|---|
| **Project Cards** | Grid of all projects showing code, name, description, manager, status badge, start date, and progress bar. |
| **Search** | Filter projects by name or code. |
| **Create Project** | Dialog with project code, name, description, manager (user select), start/end dates, status, and progress percentage. |
| **Delete Project** | Confirms and removes the project. |
| **View Project Details** | Navigates to `/projects/:id` showing a 4-tab view. |
| **Kanban Tab** | Four-column drag-and-drop board (Todo / In Progress / Review / Done). Cards show priority badge, title, description, assignee avatar, and due date. Drag to update status in Supabase. |
| **Calendar Tab** | Placeholder — "Calendar integration coming soon." |
| **Workload Tab** | Placeholder — "Workload Management coming soon." |
| **Analytics Tab** | Placeholder — "Analytics Dashboard coming soon." |

---

## 6. Administration

### 6.1 User Management

**Route:** `/users` — Admin only

| Function | Description |
|---|---|
| **User Table** | Paginated list (15 per page) of all system users with name, email, role, branch, status badge, active toggle, and delete button. |
| **Role Switcher** | Admin users can change any user's role via a dropdown directly in the table row. Change is logged in the Audit Log. |
| **Active Toggle** | Switch to activate or block a user account. Toggle state persists to the database and is reflected immediately. |
| **Delete User** | Confirms and permanently removes the user record from the `users` table. |
| **Invite User** | Full dialog to onboard a new employee: Full Name, Email, Phone, Role (from DB roles table), Branch, Department (auto-filled from role, overridable), Contract Type, Base Salary, Bonus Salary (with validation: must be < 70% of base), and Start Date. Creates a Supabase Auth account, inserts into `users`, and inserts into `employee` in sequence. |
| **Bonus Salary Validation** | Real-time feedback under the bonus field: red warning if ≥ 70% of base, green checkmark with percentage if valid. |
| **Pagination** | Previous/Next navigation. |

---

### 6.2 Audit Logs

**Route:** `/audit` — Admin only

| Function | Description |
|---|---|
| **Timeline View** | Chronological event log with timeline dots, actor name, action description, target, action type badge, and timestamp. |
| **Auto-logged Events** | Attendance submissions, class creation/update/deletion, payroll approval, role changes, user activation/blocking, student additions, homework assignments, schedule changes, and tuition payments all write to this log automatically. |

---

## 10. Role-Based Access Summary

| Role | Key Accessible Sections |
|---|---|
| **Admin** | All sections + User Management + Audit Logs |
| **Director** | All sections (read-all across departments) |
| **Finance Manager** | Tuition, Payments, Expenses, Balance Sheet, Salary, Task Management |
| **Accountant** | Tuition, Payments, Payroll (approve), Task Management |
| **Academic Manager** | Classes, Students, Schedule, Homework, Task Management (Academic dept) |
| **Academic Staff** | Classes, Students, Schedule, Homework, Payroll (view), Task Management |
| **HR Manager** | Employees, Teachers, Attendance Tracking, Leave Approve, Task Management (HR dept) |
| **HR Staff** | Employees, Teachers, Attendance Tracking, Leave Approve, Task Management |
| **Marketing Manager** | Full Marketing module, Task Management (Marketing dept) |
| **Marketing Staff** | Full Marketing module, Task Management |

---

## Notes

- **Currency:** All monetary values are displayed in Vietnamese Dong (VND) formatted with `vi-VN` locale.
- **Language:** The interface is primarily English with some Vietnamese labels in the Finance/Salary and HR sections.
- **Database:** Supabase (PostgreSQL) with real-time subscriptions for Comments & Threads.
- **Auto-seeding:** On first run (empty `branches` table), the system automatically seeds the database with demo data across all tables.
- **Change Password:** Available to all logged-in users from the top-right avatar dropdown. Requires current password verification before updating.
