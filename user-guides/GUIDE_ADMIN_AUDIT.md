# 📘 System Audit Guide

> **Module:** Audit
> **Section:** Admin Settings
> **Access Levels:** Director, Super Admin

---

## 🌐 Overview
The **System Audit** menu is the ultimate security and accountability tool within the ERP. It acts as an unalterable "black box" flight recorder, automatically logging every significant action taken by any user in the system.

## ✨ Key Features
- **Historical Accountability:** See exactly who deleted a record, when they did it, and what data was lost.
- **Security Monitoring:** Track failed login attempts or unauthorized access requests.
- **Unalterable Logs:** Standard users cannot edit or delete audit logs, ensuring total data integrity.

---

## 🚀 How to Use (Step-by-Step)

### 1. Investigating a System Event
- **Step 1:** Navigate to **Admin Settings > Audit**.
- **Step 2:** The dashboard displays a massive chronological ledger of system events.
- **Step 3:** Review the columns: **User, Action, Timestamp, IP Address, and Target Record**.
- **Step 4:** If a teacher claims they didn't delete a student's grade, you can search this log by the student's ID or the teacher's name to see the exact timestamp of when the deletion occurred.

### 2. Filtering Logs for Security Audits
- **Step 1:** Use the search bar and filter dropdowns at the top of the page.
- **Step 2:** Filter by **Event Type** (e.g., "DELETE" or "LOGIN_FAILED") to quickly identify malicious activity or accidental data destruction.
- **Step 3:** Export the filtered list if required for a formal HR or IT security investigation.

---

> [!WARNING]  
> **Warning:** Because the Audit log records *everything*, it can grow very large. When investigating an incident, always use the Date filters first to narrow down the massive list of records to the specific day the incident occurred.

*For further assistance, refer to the main User Guide or contact your System Administrator.*