# 📘 System Setup Guide

> **Module:** System Setup
> **Section:** Admin Settings
> **Access Levels:** Director, Super Admin

---

## 🌐 Overview
The **System Setup** menu is the foundational configuration hub of the ERP. It is where you define the structural components of your organization, including Departments, Roles, Branches, and Menu Permissions. Because these settings cascade down to every other module, extreme care should be taken here.

## ✨ Key Features
- **Organizational Structure:** Define your company's Departments and assign hierarchy Levels.
- **Branch Management:** Add new physical or virtual branch locations.
- **Role Permissions:** Granularly control exactly which "Menu Items" each Role can view and interact with.
- **Bulk Imports:** Quickly set up the system using Excel file imports for Departments, Roles, and Branches.

---

## 🚀 How to Use (Step-by-Step)

### 1. Creating a New Role
- **Step 1:** Navigate to **Admin Settings > System Setup**.
- **Step 2:** Click the **+ Add Role** button (or open the **Edit Role** dialog for an existing role).
- **Step 3:** Fill out the required form fields:
  - **Role Name:** e.g., "Senior Academic Manager".
  - **Department:** Select which department this role belongs to.
  - **Level:** Assign a hierarchy level (e.g., 1 for Director, 5 for Staff).
- **Step 4:** Click **Save**.

### 2. Configuring Role Permissions
- **Step 1:** On the System Setup dashboard, locate the **Permissions Table**.
- **Step 2:** The table displays rows of **Menu Items** (e.g., Students, Tuition, Payroll) and columns for **Roles Assigned**.
- **Step 3:** Click the **Quick Select** dropdown next to a menu item to quickly assign access to multiple roles at once.
- **Step 4:** Changes to permissions are usually saved automatically or require clicking a confirmation button.

### 3. Bulk Importing Data
- **Step 1:** If you are setting up a new branch, click the **Import Branches**, **Import Departments**, or **Import Roles** button.
- **Step 2:** Download the **Sample** Excel file provided in the modal.
- **Step 3:** Fill out your data following the sample columns (e.g., Row, Department Name, Level).
- **Step 4:** Upload the file. The system will pre-validate it and show any **Errors** in a preview table before you click **Xác nhận import** (Confirm Import).

---

> [!WARNING]  
> **Warning:** Changing Menu Permissions applies immediately to all users holding that Role. If you remove access to the "Payroll" menu from the "Accountant" role, any accountant currently logged in will instantly lose access!

*For further assistance, refer to the main User Guide or contact your System Administrator.*