const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../user-guides');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const guides = [
  // Core
  {
    filename: 'GUIDE_CORE_DASHBOARD.md',
    title: 'Dashboard Guide',
    module: 'Dashboard',
    section: 'Core',
    roles: 'All Roles',
    overview: 'The Dashboard provides an overview of the key metrics and activities within the MCNA ERP system.',
    features: ['High-level statistics', 'Quick access to recent tasks', 'Summary charts and graphs'],
    steps: [
      { title: 'Accessing the Dashboard', content: '1. Log in to the system.\n2. Click on **Dashboard** in the left sidebar under the **Core** section.' },
      { title: 'Viewing Metrics', content: 'The dashboard automatically displays metrics relevant to your role. For example, Directors will see company-wide metrics, while Marketing Managers will see lead and campaign summaries.' }
    ]
  },
  // Finance
  {
    filename: 'GUIDE_FINANCE_TUITION.md',
    title: 'Tuition Invoices Guide',
    module: 'Tuition Invoices',
    section: 'Finance & Accounting',
    roles: 'Director, Admin, Finance Manager, Accountant',
    overview: 'Manage student tuition invoices, track payments, and monitor overdue accounts.',
    features: ['Create new invoices', 'View invoice status (Paid, Pending, Overdue)', 'Delete invoices'],
    steps: [
      { title: 'Viewing Invoices', content: '1. Go to **Tuition Invoices** in the sidebar.\n2. You will see a list of all invoices with their current status.' },
      { title: 'Creating an Invoice', content: '1. Click **+ New Invoice**.\n2. Select the **Student**.\n3. Enter the **Amount**, **Due Date**, and **Description**.\n4. Click **Save**.' },
      { title: 'Marking as Paid', content: '1. Find a pending invoice in the list.\n2. Click **Mark as Paid** to update its status.' }
    ]
  },
  {
    filename: 'GUIDE_FINANCE_PAYMENTS.md',
    title: 'Payments Guide',
    module: 'Payments',
    section: 'Finance & Accounting',
    roles: 'Director, Admin, Finance Manager, Accountant',
    overview: 'Record and track all incoming payments against student invoices.',
    features: ['Record new payments', 'Link payments to specific invoices/students', 'Track payment methods'],
    steps: [
      { title: 'Recording a Payment', content: '1. Click **Payments** in the sidebar.\n2. Click **+ Add Payment**.\n3. Select the related **Invoice** or **Student**.\n4. Enter the **Amount Paid**, **Payment Date**, and **Method** (e.g., Cash, Transfer).\n5. Click **Save**.' }
    ]
  },
  {
    filename: 'GUIDE_FINANCE_EXPENSES.md',
    title: 'Expenses Guide',
    module: 'Expenses',
    section: 'Finance & Accounting',
    roles: 'Director, Admin, Finance Manager, Accountant',
    overview: 'Manage company expenses, categorize spending, and keep track of outgoing funds.',
    features: ['Log new expenses', 'Categorize expenses', 'Attach receipts (if applicable)'],
    steps: [
      { title: 'Adding an Expense', content: '1. Go to **Expenses** in the sidebar.\n2. Click **+ Add Expense**.\n3. Fill in the **Category**, **Amount**, **Date**, and **Description**.\n4. Click **Save**.' },
      { title: 'Editing/Deleting Expenses', content: 'Use the **Edit** (pencil) or **Delete** (trash) icons next to any expense record to modify or remove it.' }
    ]
  },
  {
    filename: 'GUIDE_FINANCE_BALANCE_SHEET.md',
    title: 'Balance Sheet Guide',
    module: 'Balance Sheet',
    section: 'Finance & Accounting',
    roles: 'Director, Admin, Finance Manager, Accountant',
    overview: 'View a financial snapshot of the company including assets, liabilities, and equity.',
    features: ['View financial summaries', 'Filter by date range', 'Export reports'],
    steps: [
      { title: 'Viewing the Balance Sheet', content: '1. Click **Balance Sheet** in the sidebar.\n2. Select the desired **date range** or **month**.\n3. Review the breakdown of Assets, Liabilities, and Equity.\n4. Click **Export** to download the report.' }
    ]
  },
  {
    filename: 'GUIDE_FINANCE_PAYROLL.md',
    title: 'Payroll Guide',
    module: 'Payroll',
    section: 'Finance & Accounting',
    roles: 'Director, Admin, Finance Manager, Accountant',
    overview: 'Process employee payroll, calculate total wages, and finalize pay periods.',
    features: ['View payroll summaries', 'Process payroll for a given period', 'Review individual breakdowns'],
    steps: [
      { title: 'Processing Payroll', content: '1. Go to **Payroll** in the sidebar.\n2. View the summary for the current period.\n3. Click **Process Payroll** to generate salary records.\n4. Review the details and click **Confirm**.' }
    ]
  },
  {
    filename: 'GUIDE_FINANCE_SALARY.md',
    title: 'Salary Guide',
    module: 'Salary',
    section: 'Finance & Accounting',
    roles: 'Director, Admin, Finance Manager, Accountant',
    overview: 'Manage and review detailed salary records for individual employees.',
    features: ['View detailed salary slips', 'Filter by month/year', 'Check base pay, allowances, and deductions'],
    steps: [
      { title: 'Reviewing Salary Records', content: '1. Click **Salary** in the sidebar.\n2. Use the filters to select a specific month and year.\n3. Click on any employee\'s record to see the full breakdown.' }
    ]
  },
  // HR
  {
    filename: 'GUIDE_HR_TEACHERS.md',
    title: 'Teachers Guide',
    module: 'Teachers',
    section: 'Human Resources',
    roles: 'Director, Admin, HR Manager, HR Staff',
    overview: 'Manage teaching staff, including their subjects, hourly rates, and branch assignments.',
    features: ['Add new teachers', 'Edit teacher profiles', 'Track hourly rates'],
    steps: [
      { title: 'Adding a Teacher', content: '1. Go to **Teachers** in the sidebar.\n2. Click **+ Add Teacher**.\n3. Fill in details like Subject, Hourly Rate, and Branch.\n4. Click **Save**.' }
    ]
  },
  {
    filename: 'GUIDE_HR_EMPLOYEES.md',
    title: 'Employees Guide',
    module: 'Employees',
    section: 'Human Resources',
    roles: 'Director, Admin, HR Manager, HR Staff',
    overview: 'Manage all non-teaching staff, track departments, positions, and basic salary info.',
    features: ['Maintain employee directory', 'Add/edit/delete employee records'],
    steps: [
      { title: 'Adding an Employee', content: '1. Click **Employees** in the sidebar.\n2. Click **+ Add Employee**.\n3. Fill in Name, Email, Department, Position, Hire Date, and Salary.\n4. Click **Save**.' },
      { title: 'Editing an Employee', content: 'Click the **Edit** icon on the employee\'s row to update their information, then click **Save**.' }
    ]
  },
  {
    filename: 'GUIDE_HR_ATTENDANCE_TRACKING.md',
    title: 'Attendance Tracking Guide',
    module: 'Attendance Tracking',
    section: 'Human Resources',
    roles: 'Director, Admin, HR Manager, HR Staff',
    overview: 'Track daily attendance for all employees and teachers.',
    features: ['Daily attendance grid', 'Mark statuses (Present, Absent, Late, On Leave)', 'Export reports'],
    steps: [
      { title: 'Marking Attendance', content: '1. Go to **Attendance Tracking**.\n2. Use the date picker to select the correct day.\n3. Click on a staff member\'s status cell and select the appropriate status.\n4. Changes are saved automatically or click **Save All**.' }
    ]
  },
  {
    filename: 'GUIDE_HR_LEAVE_APPROVE.md',
    title: 'Leave Approve Guide',
    module: 'Leave Approve',
    section: 'Human Resources',
    roles: 'Director, Admin, HR Manager, HR Staff',
    overview: 'Review, approve, or reject employee leave requests.',
    features: ['View pending leave requests', 'Approve/Reject actions', 'Integration with Attendance Tracking'],
    steps: [
      { title: 'Processing Requests', content: '1. Click **Leave Approve** in the sidebar.\n2. Review the list of pending requests.\n3. Click **Approve** or **Reject**.\n4. Add any necessary notes and confirm.' }
    ]
  },
  // Academic
  {
    filename: 'GUIDE_ACADEMIC_STUDENTS.md',
    title: 'Students Guide',
    module: 'Students',
    section: 'Academic',
    roles: 'Director, Admin, Academic Manager, Academic Staff',
    overview: 'Manage student enrollments, profiles, and class assignments.',
    features: ['Student directory', 'Enroll new students', 'Edit student profiles'],
    steps: [
      { title: 'Enrolling a Student', content: '1. Go to **Students**.\n2. Click **+ Add Student**.\n3. Fill in Full Name, DOB, Parent Contact, Class, and Enrollment Date.\n4. Click **Save**.' }
    ]
  },
  {
    filename: 'GUIDE_ACADEMIC_CLASSES.md',
    title: 'Classes Guide',
    module: 'Classes',
    section: 'Academic',
    roles: 'Director, Admin, Academic Manager, Academic Staff',
    overview: 'Manage class listings, assign teachers, and set schedules and capacities.',
    features: ['Create new classes', 'Assign teachers and rooms', 'Set maximum student capacity'],
    steps: [
      { title: 'Creating a Class', content: '1. Click **Classes** in the sidebar.\n2. Click **+ New Class**.\n3. Fill in Class Name, Teacher, Room, Schedule, and Max Students.\n4. Click **Save**.' }
    ]
  },
  {
    filename: 'GUIDE_ACADEMIC_SCHEDULE.md',
    title: 'Schedule Guide',
    module: 'Schedule',
    section: 'Academic',
    roles: 'Director, Admin, Academic Manager, Academic Staff',
    overview: 'View and manage the weekly class schedule across all rooms and teachers.',
    features: ['Weekly calendar view', 'Add/Edit/Delete class sessions', 'Conflict detection'],
    steps: [
      { title: 'Scheduling a Session', content: '1. Go to **Schedule**.\n2. Click on a time slot in the calendar.\n3. Select the Class, Room, Teacher, and adjust the times.\n4. Click **Save**.' }
    ]
  },
  {
    filename: 'GUIDE_ACADEMIC_HOMEWORK.md',
    title: 'Homework Guide',
    module: 'Homework',
    section: 'Academic',
    roles: 'Director, Admin, Academic Manager, Academic Staff',
    overview: 'Assign homework to classes and track student submissions.',
    features: ['Create assignments', 'Set due dates', 'Track student completion'],
    steps: [
      { title: 'Assigning Homework', content: '1. Click **Homework**.\n2. Click **+ Add Homework**.\n3. Select the Class, Title, Description, and Due Date.\n4. Click **Save**.' },
      { title: 'Tracking Submissions', content: '1. Open a homework record.\n2. Toggle the submission status next to each student\'s name.' }
    ]
  },
  {
    filename: 'GUIDE_ACADEMIC_ATTENDANCE.md',
    title: 'Student Attendance Guide',
    module: 'Student Attendance',
    section: 'Academic',
    roles: 'Director, Admin, Academic Manager, Academic Staff',
    overview: 'Track daily attendance for students in specific classes.',
    features: ['Class-based attendance lists', 'Present/Absent toggles'],
    steps: [
      { title: 'Taking Attendance', content: '1. Go to **Attendance** under Academic.\n2. Select the **Class** and **Date**.\n3. Mark each student as Present or Absent.\n4. Click **Save All**.' }
    ]
  },
  {
    filename: 'GUIDE_ACADEMIC_ROOMS.md',
    title: 'Rooms Guide',
    module: 'Rooms',
    section: 'Academic',
    roles: 'Director, Admin, Academic Manager, Academic Staff',
    overview: 'Manage physical classroom spaces, capacities, and availability.',
    features: ['Add new rooms', 'Set room capacity', 'Update room status'],
    steps: [
      { title: 'Managing Rooms', content: '1. Click **Rooms** in the sidebar.\n2. Click **+ Add Room** to create a new space.\n3. Use **Edit** to update details or mark a room as unavailable.' }
    ]
  },
  // PM
  {
    filename: 'GUIDE_PM_PROJECTS.md',
    title: 'Projects Guide',
    module: 'Projects',
    section: 'Project Management',
    roles: 'All Roles',
    overview: 'High-level project tracking, team assignment, and progress monitoring.',
    features: ['Create projects', 'Assign team members', 'View project details and overall progress'],
    steps: [
      { title: 'Creating a Project', content: '1. Click **Projects** in the sidebar.\n2. Click **+ New Project**.\n3. Fill in Title, Description, Dates, and assign Team Members.\n4. Click **Save**.' }
    ]
  },
  {
    filename: 'GUIDE_PM_TASK_ASSIGNMENT.md',
    title: 'Task Assignment Guide',
    module: 'Task Assignment',
    section: 'Project Management',
    roles: 'All Roles',
    overview: 'Create, assign, and manage individual tasks. (Note: You can only assign tasks to users one level below you in your department).',
    features: ['Create tasks', 'Set priority and due dates', 'Assign to eligible team members', 'Update statuses'],
    steps: [
      { title: 'Assigning a Task', content: '1. Go to **Task Assignment**.\n2. Click **+ New Task**.\n3. Fill in details and select an eligible user from the **Assign To** dropdown.\n4. Click **Save**.' },
      { title: 'Updating Task Status', content: '1. Open a task.\n2. Change the Status dropdown (To Do -> In Progress -> Done).' }
    ]
  },
  {
    filename: 'GUIDE_PM_KANBAN_BOARD.md',
    title: 'Kanban Board Guide',
    module: 'Kanban Board',
    section: 'Project Management',
    roles: 'All Roles',
    overview: 'Visual task management using drag-and-drop columns.',
    features: ['Visual columns (To Do, In Progress, Review, Done)', 'Drag and drop cards', 'Quick task details'],
    steps: [
      { title: 'Using the Board', content: '1. Click **Kanban Board**.\n2. Drag a task card and drop it into a new column to update its status instantly.' }
    ]
  },
  {
    filename: 'GUIDE_PM_GANTT_CHART.md',
    title: 'Gantt Chart Guide',
    module: 'Gantt Chart',
    section: 'Project Management',
    roles: 'All Roles',
    overview: 'Timeline-based view of tasks to visualize schedules and dependencies.',
    features: ['Timeline visualization', 'Zoom (Day/Week/Month)'],
    steps: [
      { title: 'Viewing the Chart', content: '1. Click **Gantt Chart**.\n2. Use zoom controls to adjust the timeframe.\n3. Hover over bars to see task details.' }
    ]
  },
  {
    filename: 'GUIDE_PM_SPRINT_PLANNING.md',
    title: 'Sprint Planning Guide',
    module: 'Sprint Planning',
    section: 'Project Management',
    roles: 'All Roles',
    overview: 'Organize work into time-boxed sprints (Agile methodology).',
    features: ['Create sprints', 'Move tasks from Backlog to Sprint', 'Start/End Sprints'],
    steps: [
      { title: 'Planning a Sprint', content: '1. Go to **Sprint Planning**.\n2. Click **+ New Sprint**.\n3. Drag tasks from the Backlog into the active sprint.\n4. Click **Start Sprint**.' }
    ]
  },
  {
    filename: 'GUIDE_PM_WORKLOAD_VIEW.md',
    title: 'Workload View Guide',
    module: 'Workload View',
    section: 'Project Management',
    roles: 'All Roles',
    overview: 'Monitor team capacity to ensure tasks are distributed evenly.',
    features: ['Visual workload grid', 'Color-coded capacity indicators'],
    steps: [
      { title: 'Checking Workload', content: '1. Click **Workload View**.\n2. Review the number of tasks assigned to each user.\n3. Look for red indicators (heavy workload) to reassign tasks if necessary.' }
    ]
  },
  {
    filename: 'GUIDE_PM_COMMENTS_THREADS.md',
    title: 'Comments & Threads Guide',
    module: 'Comments & Threads',
    section: 'Project Management',
    roles: 'All Roles',
    overview: 'Communicate with team members regarding specific tasks or general topics.',
    features: ['Start new discussion threads', 'Reply to conversations', 'Tag users'],
    steps: [
      { title: 'Starting a Thread', content: '1. Go to **Comments & Threads**.\n2. Click **+ New Thread**.\n3. Enter Title and Message, then post.' },
      { title: 'Replying', content: 'Click on an existing thread to read it and type your response at the bottom.' }
    ]
  },
  {
    filename: 'GUIDE_PM_TIME_TRACKING.md',
    title: 'Time Tracking Guide',
    module: 'Time Tracking',
    section: 'Project Management',
    roles: 'All Roles',
    overview: 'Log the hours you spend working on specific tasks.',
    features: ['Log hours per task', 'View personal time logs'],
    steps: [
      { title: 'Logging Time', content: '1. Click **Time Tracking**.\n2. Click **+ Log Time**.\n3. Select the Task, Date, Hours Spent, and add notes.\n4. Click **Save**.' }
    ]
  },
  // Marketing
  {
    filename: 'GUIDE_MKT_LEADS.md',
    title: 'Leads Guide',
    module: 'Leads',
    section: 'Marketing',
    roles: 'Director, Admin, Marketing Manager, Marketing Staff',
    overview: 'Manage potential customers, their contact info, and their progress through the sales funnel.',
    features: ['Add new leads', 'Update lead status', 'View interaction history'],
    steps: [
      { title: 'Adding a Lead', content: '1. Go to **Leads** under Marketing.\n2. Click **+ Add Lead**.\n3. Fill in Name, Phone, Email, Source, etc.\n4. Click **Save**.' },
      { title: 'Updating Status', content: '1. Open a lead.\n2. Change the Status (e.g., New -> Contacted -> Enrolled).' }
    ]
  },
  {
    filename: 'GUIDE_MKT_CAMPAIGNS.md',
    title: 'Campaigns Guide',
    module: 'Campaigns',
    section: 'Marketing',
    roles: 'Director, Admin, Marketing Manager, Marketing Staff',
    overview: 'Plan, budget, and track marketing campaigns.',
    features: ['Create campaigns', 'Set budgets', 'Track performance metrics'],
    steps: [
      { title: 'Creating a Campaign', content: '1. Go to **Campaigns**.\n2. Click **+ New Campaign**.\n3. Fill in details like Channel, Budget, and Dates.\n4. Click **Save**.' }
    ]
  },
  {
    filename: 'GUIDE_MKT_SOURCES.md',
    title: 'Sources Guide',
    module: 'Sources',
    section: 'Marketing',
    roles: 'Director, Admin, Marketing Manager, Marketing Staff',
    overview: 'Manage the list of channels where leads originate (e.g., Facebook, Google, Referrals).',
    features: ['Add new sources', 'Enable/disable sources'],
    steps: [
      { title: 'Managing Sources', content: '1. Click **Sources**.\n2. Use **+ Add Source** to create a new one.\n3. Toggle the switch next to a source to enable or disable it for new leads.' }
    ]
  },
  {
    filename: 'GUIDE_MKT_PROMOTIONS.md',
    title: 'Promotions Guide',
    module: 'Promotions',
    section: 'Marketing',
    roles: 'Director, Admin, Marketing Manager, Marketing Staff',
    overview: 'Create and manage discount codes for marketing campaigns.',
    features: ['Create promo codes', 'Set discount types and values', 'Track expiry'],
    steps: [
      { title: 'Creating a Promo Code', content: '1. Click **Promotions**.\n2. Click **+ Add Promotion**.\n3. Enter the Code, Discount Type, Value, and Expiry Date.\n4. Click **Save**.' }
    ]
  },
  {
    filename: 'GUIDE_MKT_FOLLOW_UP.md',
    title: 'Follow-up Guide',
    module: 'Follow-up',
    section: 'Marketing',
    roles: 'Director, Admin, Marketing Manager, Marketing Staff',
    overview: 'Manage reminders and tasks related to contacting leads.',
    features: ['Create follow-up tasks', 'Set due dates and priorities', 'Mark as completed'],
    steps: [
      { title: 'Adding a Follow-up', content: '1. Go to **Follow-up**.\n2. Click **+ Add Follow-up**.\n3. Select the Lead, Due Date, and Priority.\n4. Click **Save**.' },
      { title: 'Completing a Task', content: 'Check the box next to a task to move it to the Completed section. Overdue tasks appear in red.' }
    ]
  },
  {
    filename: 'GUIDE_MKT_REPORTS.md',
    title: 'Marketing Reports Guide',
    module: 'Reports',
    section: 'Marketing',
    roles: 'Director, Admin, Marketing Manager, Marketing Staff',
    overview: 'View analytics and charts regarding marketing performance and lead conversion.',
    features: ['Visual charts (Lead Volume, Conversion Rates)', 'Filter by date range', 'Export data'],
    steps: [
      { title: 'Viewing Reports', content: '1. Click **Reports** under Marketing.\n2. Use the date picker to adjust the reporting period.\n3. Review the charts to analyze source performance and ROI.' }
    ]
  },
  // Admin
  {
    filename: 'GUIDE_ADMIN_USERS.md',
    title: 'User Management Guide',
    module: 'User Management',
    section: 'Administration',
    roles: 'Admin',
    overview: 'Manage system access, create new user accounts, and assign roles.',
    features: ['Add/Edit/Delete users', 'Block/Unblock access', 'Assign roles and departments'],
    steps: [
      { title: 'Managing Users', content: '1. Go to **User Management** under Administration.\n2. Click **+ Add User** to create a new account.\n3. Use the **Edit** icon to change roles.\n4. Use the **Block** button to temporarily revoke access without deleting the account.' }
    ]
  },
  {
    filename: 'GUIDE_ADMIN_AUDIT.md',
    title: 'Audit Logs Guide',
    module: 'Audit Logs',
    section: 'Administration',
    roles: 'Admin',
    overview: 'Review a chronological history of all actions performed within the system for security and tracking.',
    features: ['View action history', 'Filter by user, date, or action type'],
    steps: [
      { title: 'Reviewing Logs', content: '1. Click **Audit Logs**.\n2. Browse the table to see who performed what action and when.\n3. Use filters at the top to find specific events.' }
    ]
  },
  {
    filename: 'GUIDE_ADMIN_SYSTEM_SETUP.md',
    title: 'System Setup Guide',
    module: 'System Setup',
    section: 'Administration',
    roles: 'Admin',
    overview: 'Configure which roles have access to which modules across the ERP system.',
    features: ['Role-based access control grid', 'Toggle module access instantly'],
    steps: [
      { title: 'Configuring Access', content: '1. Go to **System Setup**.\n2. You will see a grid with Modules as rows and Roles as columns.\n3. Toggle a switch ON to grant access to a module for that role.\n4. Changes save automatically.' }
    ]
  }
];

guides.forEach(guide => {
  const content = `# 📘 ${guide.title}

> **Module:** ${guide.module}  
> **Section:** ${guide.section}  
> **Access Levels:** ${guide.roles}

---

## 🌐 Overview
${guide.overview}

## ✨ Key Features
${guide.features.map(f => `- ${f}`).join('\n')}

---

## 🚀 Step-by-Step Instructions

${guide.steps.map(step => `### ${step.title}\n\n${step.content}\n`).join('\n')}

---
*For further assistance, refer to the main User Guide or contact your System Administrator.*
`;

  fs.writeFileSync(path.join(outputDir, guide.filename), content, 'utf8');
});

console.log('Successfully generated ' + guides.length + ' guide files in ' + outputDir);
