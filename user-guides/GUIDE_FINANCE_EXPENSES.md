# 📘 Expenses & Vouchers Guide

> **Module:** Expenses
> **Section:** Finance & Accounting
> **Access Levels:** Director, Admin, Finance Manager, Accountant

---

## 🌐 Overview
The **Expenses** menu (often referred to as Phiếu Thu / Phiếu Chi) is the central ledger for recording all cash flow in and out of the organization that isn't directly tied to standard tuition. This ensures your Balance Sheet remains perfectly accurate.

## ✨ Key Features
- **Voucher Creation:** Create detailed "Phiếu thu" (Receipts) and "Phiếu chi" (Payment Vouchers).
- **Approval Workflows:** Vouchers can be submitted, approved, or cancelled by authorized managers.
- **Excel Imports:** Bulk import historical financial data.
- **Document Generation:** Print physical vouchers or download them as PDFs.

---

## 🚀 How to Use (Step-by-Step)

### 1. Creating a New Payment or Receipt Voucher
- **Step 1:** Navigate to **Finance & Accounting > Expenses**.
- **Step 2:** Click to create a new voucher. The dialog title will say either **Tạo phiếu thu** (Create Receipt) or **Tạo phiếu chi** (Create Payment).
- **Step 3:** Fill out the mandatory form fields:
  - **Loại phiếu (Type):** Select Thu (In) or Chi (Out).
  - **Ngày lập phiếu:** Date of the transaction.
  - **Nguồn gốc / Chọn nguồn:** Source of the funds.
  - **Người nộp / Người nhận:** Who gave you the money, or who you paid.
  - **Lý do thu/chi *:** A detailed description (Required).
  - **Số tiền * & Số tiền bằng chữ:** The amount in numbers and spelled out in text.
  - **Phòng ban:** Assign the expense to a specific department.
  - **Đính kèm file:** Upload any receipts or invoices.
- **Step 4:** Click **Xác nhận** to save.

### 2. Managing and Printing Vouchers
- **Step 1:** In the main table, you will see columns for **Số phiếu, Ngày, Loại, Lý do, Người nộp/nhận, Số tiền, Trạng thái**.
- **Step 2:** Click on the **Actions** menu for a specific voucher.
- **Step 3:** Select **Chi tiết phiếu** to view its full history.
- **Step 4:** You can use the **In phiếu** (Print) or **Tải PDF** (Download PDF) buttons to generate hard copies for your physical accounting books.
- **Step 5:** Managers can use the **Duyệt phiếu** (Approve) or **Huỷ phiếu** (Cancel) actions to finalize the transaction state.

### 3. Bulk Importing Data
- **Step 1:** Click **Import Excel** to open the import dialog.
- **Step 2:** Upload your file. Review the **Dòng** (Row) and **Lỗi** (Errors) columns.
- **Step 3:** Click **Xác nhận import** only if `r.errors.length === 0`.

---

> [!TIP]
> **Pro Tip:** Always utilize the "Đính kèm file" (File Attachment) field to upload photos of physical receipts. This will save your accounting team hours of headaches during tax season audits!

*For further assistance, refer to the main User Guide or contact your System Administrator.*