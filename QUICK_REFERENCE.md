# 🚀 Quick Copy-Paste SQL Commands

## 📋 Danh Sách Files

| File | Mục Đích |
|------|---------|
| `marketing-tables.sql` | ✅ **DÙNG CÁI NÀY** - Tạo bảng + dữ liệu mẫu |
| `marketing-tables-schema-only.sql` | Chỉ tạo bảng trống |
| `MARKETING_SCHEMA.md` | Tài liệu chi tiết |
| `SETUP_GUIDE.md` | Hướng dẫn đầu đủ |

---

## ⚡ Các Bảng Được Tạo

### 1️⃣ marketing_sources
**Nguồn khách hàng**
```sql
SELECT COUNT(*) FROM marketing_sources;
-- Sẽ có 10 bản ghi mẫu
```

Các nguồn:
- Facebook Ads
- Google Ads
- Website
- Referral
- Workshop Event
- TikTok Ads
- Instagram
- Phone Call
- Email
- Other

---

### 2️⃣ marketing_leads
**Khách hàng tiềm năng**
```sql
SELECT * FROM marketing_leads;
-- Có fields: id, full_name, email, phone, address, source_id, status, notes
```

Status values:
- New
- Contacted
- Trial Scheduled
- Enrolled
- Lost

---

### 3️⃣ marketing_campaigns
**Chiến dịch tiếp thị**
```sql
SELECT * FROM marketing_campaigns;
-- Có fields: id, name, channel, description, budget, start_date, end_date, status
```

Channel values:
- Facebook Ads
- TikTok Ads
- Google Ads
- Workshop
- Offline Event
- Email
- SMS
- Other

Status values:
- Planning
- Running
- Paused
- Completed
- Cancelled

---

### 4️⃣ marketing_follow_ups
**Theo dõi khách hàng**
```sql
SELECT * FROM marketing_follow_ups;
-- Có fields: id, lead_id, assigned_staff_id, followup_type, title, note, deadline, priority, status
```

Follow-up Type:
- Call
- Email
- Meeting
- Trial Class
- Consultation
- Task

Priority:
- Low
- Medium
- High
- Urgent

Status:
- Pending
- In Progress
- Completed
- Cancelled
- Rescheduled

---

### 5️⃣ marketing_promotions
**Khuyến mại**
```sql
SELECT * FROM marketing_promotions;
-- Có fields: id, code, name, description, discount_type, discount_value, max_discount_value, start_date, end_date, status
```

Discount Type:
- Percentage (%)
- Fixed Amount (VND)

Status:
- Active
- Inactive
- Expired
- Scheduled

---

### 6️⃣ marketing_lead_activities
**Lịch sử hoạt động**
```sql
SELECT * FROM marketing_lead_activities;
-- Có fields: id, lead_id, activity_type, description, created_at
```

---

## 🔍 Các Query Hữu Ích

### Đếm Leads theo Source
```sql
SELECT s.name, COUNT(l.id) as lead_count
FROM marketing_leads l
RIGHT JOIN marketing_sources s ON l.source_id = s.id
GROUP BY s.name
ORDER BY lead_count DESC;
```

### Đếm Leads theo Status
```sql
SELECT status, COUNT(*) as count
FROM marketing_leads
GROUP BY status;
```

### Follow-ups sắp hạn
```sql
SELECT l.full_name, f.title, f.deadline, f.priority
FROM marketing_follow_ups f
JOIN marketing_leads l ON f.lead_id = l.id
WHERE f.deadline < NOW() + INTERVAL '3 days'
  AND f.status != 'Completed'
ORDER BY f.deadline ASC;
```

### Chiến dịch đang chạy
```sql
SELECT * FROM marketing_campaigns
WHERE status = 'Running'
ORDER BY start_date DESC;
```

### Tổng ngân sách chiến dịch
```sql
SELECT 
  SUM(budget) as total_budget,
  COUNT(*) as campaign_count,
  AVG(budget) as avg_budget
FROM marketing_campaigns;
```

### Mã khuyến mại còn hiệu lực
```sql
SELECT code, name, discount_type, discount_value, end_date
FROM marketing_promotions
WHERE status IN ('Active', 'Scheduled')
  AND end_date > NOW()
ORDER BY end_date DESC;
```

---

## 🎯 Các Bước Thực Hiện

### Step 1: Mở Supabase
```
https://app.supabase.com
```

### Step 2: Chọn Project
- Chọn project MCNAEdu

### Step 3: Vào SQL Editor
- Menu trái → SQL Editor
- Click "New Query"

### Step 4: Copy SQL
- Copy toàn bộ nội dung từ `marketing-tables.sql`
- Paste vào SQL Editor

### Step 5: Chạy
- Click "RUN" button (hoặc Cmd+Enter)

### Step 6: Xác nhận
- Vào Table Editor
- Kiểm tra 6 bảng mới

---

## ✅ Dữ Liệu Mẫu

### Leads Mẫu
1. Tran Minh Duc - Facebook Ads - Contacted
2. Nguyen Thu Ha - Google Ads - Trial Scheduled
3. Pham Hoang Long - Website - New
4. Dang Thi Hoa - Referral - Enrolled
5. Le Van Son - TikTok Ads - New

### Campaigns Mẫu
1. Summer IELTS Intensive 2026 - 5M VND - Running
2. TOEIC Bootcamp Launch - 3M VND - Completed
3. Kids English Spring Class - 2.5M VND - Completed
4. Business English Professional Series - 1M VND - Running
5. Workshop Week Grand Event - 8M VND - Planning

### Promotions Mẫu
1. SUMMER20 - 20% off - Active
2. IELTS500K - 500K VND off - Active
3. REFERRAL15 - 15% off - Active
4. FRIEND1M - 1M VND off - Scheduled
5. NEWSTUDENT30 - 30% off - Expired

---

## 🔗 Relationships

```
marketing_sources (1) ── (N) marketing_leads
marketing_leads (1) ── (N) marketing_follow_ups
marketing_leads (1) ── (N) marketing_lead_activities
```

---

## 🛡️ RLS Settings

Mặc định: **DISABLED** (để dev dễ hơn)

Bật RLS:
```sql
ALTER TABLE "marketing_sources" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_follow_ups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_promotions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "marketing_lead_activities" ENABLE ROW LEVEL SECURITY;
```

---

## 📊 Chỉ số (Indexes)

Tất cả tạo tự động:
- `idx_marketing_leads_source_id` - Tìm lead theo source
- `idx_marketing_leads_status` - Lọc lead theo status
- `idx_marketing_follow_ups_deadline` - Sắp xếp theo hạn
- `idx_marketing_campaigns_status` - Lọc campaign
- `idx_marketing_promotions_code` - Tìm promo code
- ... và nhiều cái khác

---

## 💥 Drop (Xóa) Bảng

Nếu cần reset:
```sql
DROP TABLE IF EXISTS "marketing_lead_activities" CASCADE;
DROP TABLE IF EXISTS "marketing_follow_ups" CASCADE;
DROP TABLE IF EXISTS "marketing_leads" CASCADE;
DROP TABLE IF EXISTS "marketing_campaigns" CASCADE;
DROP TABLE IF EXISTS "marketing_promotions" CASCADE;
DROP TABLE IF EXISTS "marketing_sources" CASCADE;
```

Sau đó chạy lại `marketing-tables.sql`

---

## 🆘 Lỗi Thường Gặp

| Lỗi | Giải Pháp |
|-----|---------|
| "Table already exists" | Bình thường, có `IF NOT EXISTS` |
| "Foreign key constraint" | Tạo source trước lead |
| Không thấy dữ liệu | Dùng `marketing-tables.sql` |
| Query timeout | Chạy từng bảng riêng |

---

## 📱 Ứng Dụng Hỗ Trợ

Sau khi tạo bảng, các trang sẽ hoạt động:

- ✅ http://localhost:8081/marketing/leads
- ✅ http://localhost:8081/marketing/campaigns
- ✅ http://localhost:8081/marketing/follow-ups
- ✅ http://localhost:8081/marketing/promotions
- ✅ http://localhost:8081/marketing/sources
- ✅ http://localhost:8081/marketing/reports

---

## 📞 Support

Xem chi tiết:
- **MARKETING_SCHEMA.md** - Tài liệu bảng
- **SETUP_GUIDE.md** - Hướng dẫn chi tiết
- **src/hooks/use-marketing.tsx** - Code sử dụng

---

**Ready? Let's go! 🚀**
