# Marketing Module - Database Schema

## Overview
Các bảng dưới đây được thiết kế để hỗ trợ toàn bộ chức năng Marketing trong hệ thống MCNAEdu CRM.

---

## 📋 Danh Sách Bảng

### 1. **marketing_sources** - Nguồn Tiếp Thị
Lưu trữ các nguồn khác nhau mà khách hàng tiềm năng đến từ đó.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| `id` | UUID | Khóa chính (tự động tạo) |
| `name` | VARCHAR(255) | Tên nguồn (unique) |
| `description` | TEXT | Mô tả chi tiết |
| `is_active` | BOOLEAN | Trạng thái hoạt động |
| `created_at` | TIMESTAMP | Ngày tạo |
| `updated_at` | TIMESTAMP | Ngày cập nhật |

**Ví dụ giá trị:**
- Facebook Ads
- Google Ads
- Website
- Referral
- Workshop Event

---

### 2. **marketing_leads** - Khách Hàng Tiềm Năng
Lưu trữ thông tin về các khách hàng tiềm năng.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| `id` | UUID | Khóa chính |
| `full_name` | VARCHAR(255) | Họ và tên (bắt buộc) |
| `email` | VARCHAR(255) | Email |
| `phone` | VARCHAR(20) | Số điện thoại |
| `address` | TEXT | Địa chỉ |
| `source_id` | UUID | FK đến marketing_sources |
| `status` | VARCHAR(50) | Trạng thái (New/Contacted/Trial Scheduled/Enrolled/Lost) |
| `notes` | TEXT | Ghi chú |
| `created_at` | TIMESTAMP | Ngày tạo |
| `updated_at` | TIMESTAMP | Ngày cập nhật |

**Status Values:**
- `New` - Mới
- `Contacted` - Đã liên hệ
- `Trial Scheduled` - Lên lịch dùng thử
- `Enrolled` - Đã ghi danh
- `Lost` - Thất bại

---

### 3. **marketing_campaigns** - Chiến Dịch Tiếp Thị
Quản lý các chiến dịch quảng cáo và tiếp thị.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| `id` | UUID | Khóa chính |
| `name` | VARCHAR(255) | Tên chiến dịch |
| `channel` | VARCHAR(100) | Kênh (Facebook/Google/TikTok/Email/SMS/Event...) |
| `description` | TEXT | Mô tả |
| `budget` | DECIMAL(15,2) | Ngân sách (VND) |
| `start_date` | TIMESTAMP | Ngày bắt đầu |
| `end_date` | TIMESTAMP | Ngày kết thúc |
| `status` | VARCHAR(50) | Trạng thái (Planning/Running/Paused/Completed/Cancelled) |
| `created_at` | TIMESTAMP | Ngày tạo |
| `updated_at` | TIMESTAMP | Ngày cập nhật |

**Channel Values:**
- Facebook Ads
- TikTok Ads
- Google Ads
- Workshop
- Offline Event
- Email
- SMS
- Other

**Status Values:**
- `Planning` - Đang lên kế hoạch
- `Running` - Đang chạy
- `Paused` - Tạm dừng
- `Completed` - Hoàn tất
- `Cancelled` - Hủy

---

### 4. **marketing_follow_ups** - Theo Dõi Khách Hàng
Quản lý các tác vụ theo dõi và liên hệ với khách hàng tiềm năng.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| `id` | UUID | Khóa chính |
| `lead_id` | UUID | FK đến marketing_leads |
| `assigned_staff_id` | UUID | ID nhân viên được giao |
| `followup_type` | VARCHAR(50) | Loại theo dõi (Call/Email/Meeting/Trial Class...) |
| `title` | VARCHAR(255) | Tiêu đề tác vụ |
| `note` | TEXT | Ghi chú |
| `deadline` | TIMESTAMP | Hạn chót |
| `priority` | VARCHAR(50) | Mức độ ưu tiên (Low/Medium/High/Urgent) |
| `status` | VARCHAR(50) | Trạng thái (Pending/In Progress/Completed/Cancelled/Rescheduled) |
| `created_at` | TIMESTAMP | Ngày tạo |
| `updated_at` | TIMESTAMP | Ngày cập nhật |

**Follow-up Type Values:**
- Call - Gọi điện
- Email - Email
- Meeting - Họp
- Trial Class - Lớp thử nghiệm
- Consultation - Tư vấn
- Task - Công việc

**Priority Values:**
- Low, Medium, High, Urgent

**Status Values:**
- Pending, In Progress, Completed, Cancelled, Rescheduled

---

### 5. **marketing_promotions** - Khuyến Mại và Giảm Giá
Quản lý các mã khuyến mại, giảm giá.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| `id` | UUID | Khóa chính |
| `code` | VARCHAR(50) | Mã khuyến mại (unique) |
| `name` | VARCHAR(255) | Tên khuyến mại |
| `description` | TEXT | Mô tả chi tiết |
| `discount_type` | VARCHAR(50) | Loại (Percentage/Fixed Amount) |
| `discount_value` | DECIMAL(10,2) | Giá trị giảm |
| `max_discount_value` | DECIMAL(15,2) | Giảm tối đa (nếu là %) |
| `start_date` | TIMESTAMP | Ngày bắt đầu |
| `end_date` | TIMESTAMP | Ngày kết thúc |
| `status` | VARCHAR(50) | Trạng thái (Active/Inactive/Expired/Scheduled) |
| `created_at` | TIMESTAMP | Ngày tạo |
| `updated_at` | TIMESTAMP | Ngày cập nhật |

**Discount Type Values:**
- `Percentage` - Giảm theo % (ví dụ: 20%)
- `Fixed Amount` - Giảm cố định (ví dụ: 500,000 VND)

**Status Values:**
- Active - Đang hoạt động
- Inactive - Không hoạt động
- Expired - Hết hạn
- Scheduled - Sắp tới

---

### 6. **marketing_lead_activities** - Lịch Sử Hoạt Động Khách Hàng
Ghi lại tất cả hoạt động liên quan đến khách hàng tiềm năng.

| Cột | Kiểu | Mô Tả |
|-----|------|-------|
| `id` | UUID | Khóa chính |
| `lead_id` | UUID | FK đến marketing_leads |
| `activity_type` | VARCHAR(100) | Loại hoạt động |
| `description` | TEXT | Mô tả hoạt động |
| `created_at` | TIMESTAMP | Ngày tạo |
| `updated_at` | TIMESTAMP | Ngày cập nhật |

---

## 🔧 Cách Sử Dụng

### Bước 1: Tạo Bảng
1. Mở **Supabase Dashboard** → **SQL Editor**
2. Copy toàn bộ nội dung từ file `marketing-tables.sql`
3. Paste vào SQL Editor
4. Click **RUN**

### Bước 2: Xác Nhận
Kiểm tra xem các bảng đã được tạo trong **Table Editor** của Supabase

### Bước 3: Sử Dụng Ứng Dụng
Ứng dụng sẽ tự động sử dụng các bảng này thông qua hook `useMarketing()`

---

## 📊 Mối Quan Hệ (Relationships)

```
marketing_sources
    ↓
marketing_leads → marketing_follow_ups
    ↓                    ↓
marketing_lead_activities    (references marketing_leads)

marketing_campaigns (standalone)
marketing_promotions (standalone)
```

---

## ✅ Dữ Liệu Mẫu Được Tạo

Khi chạy script, dữ liệu mẫu sau sẽ được tạo:

### Sources (10 bản ghi)
- Facebook Ads, Google Ads, Website, Referral, Workshop Event, v.v.

### Campaigns (5 bản ghi)
- Summer IELTS Intensive, TOEIC Bootcamp Launch, v.v.

### Leads (5 bản ghi mẫu)
- Tran Minh Duc, Nguyen Thu Ha, v.v.

### Promotions (5 bản ghi)
- SUMMER20 (20% off), IELTS500K (500K off), v.v.

---

## 🔐 Bảo Mật

Row Level Security (RLS) được **vô hiệu hóa** cho môi trường phát triển. Để bật RLS trong production:

```sql
ALTER TABLE "marketing_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_leads" ENABLE ROW LEVEL SECURITY;
-- ... etc
```

---

## 📝 Các Ràng Buộc (Constraints)

- ✅ Kiểm tra `status` phải là giá trị hợp lệ
- ✅ Kiểm tra `channel` phải là giá trị hợp lệ
- ✅ Kiểm tra `discount_value > 0`
- ✅ Kiểm tra `end_date >= start_date`
- ✅ Kiểm tra tên không được trống

---

## 🚀 Các Chức Năng Được Hỗ Trợ

- ✅ Quản lý Khách Hàng Tiềm Năng (Leads)
- ✅ Theo Dõi & Liên Hệ (Follow-ups)
- ✅ Quản lý Chiến Dịch (Campaigns)
- ✅ Quản lý Khuyến Mại (Promotions)
- ✅ Báo Cáo & Thống Kê (Reports)

---

## 📞 Liên Hệ

Nếu có vấn đề, kiểm tra logs trong **Supabase Dashboard** → **Logs**
