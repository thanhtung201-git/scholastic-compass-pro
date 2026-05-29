# 📊 Hướng Dẫn Tạo Bảng Marketing

## ✅ Các File Đã Tạo

### 1. **marketing-tables.sql** (Đầy đủ - Có dữ liệu mẫu)
- Tạo tất cả 6 bảng
- Thêm dữ liệu mẫu (seed data)
- Bao gồm 30+ bản ghi mẫu

### 2. **marketing-tables-schema-only.sql** (Chỉ schema)
- Tạo tất cả 6 bảng
- Không có dữ liệu mẫu
- Dùng khi đã có dữ liệu hoặc muốn tạo mới

### 3. **MARKETING_SCHEMA.md** (Tài liệu chi tiết)
- Mô tả từng bảng
- Danh sách các cột
- Các ràng buộc (constraints)
- Ví dụ giá trị

---

## 🚀 Cách Thực Hiện

### **Tùy Chọn 1: Tạo Bảng + Dữ Liệu Mẫu** (Khuyến Nghị)

```bash
# Bước 1: Mở Supabase Dashboard
# https://app.supabase.com

# Bước 2: Chọn Project
# Bước 3: Vào SQL Editor

# Bước 4: Copy toàn bộ nội dung từ file:
# marketing-tables.sql

# Bước 5: Paste vào SQL Editor và click RUN
```

**Lợi ích:**
✅ Bảng được tạo ngay lập tức
✅ Có dữ liệu mẫu để test
✅ Có thể thấy ngay các tính năng hoạt động

---

### **Tùy Chọn 2: Chỉ Tạo Schema (Không Dữ Liệu)**

```bash
# Copy nội dung từ file:
# marketing-tables-schema-only.sql

# Paste vào Supabase SQL Editor và click RUN
```

**Lợi ích:**
✅ Bảng trống sạch sẽ
✅ Tùy chỉnh dữ liệu mẫu sau

---

## 📋 Danh Sách 6 Bảng Được Tạo

| # | Tên Bảng | Mô Tả |
|---|----------|-------|
| 1 | `marketing_sources` | Nguồn khách hàng (Facebook, Google, Website...) |
| 2 | `marketing_leads` | Danh sách khách hàng tiềm năng |
| 3 | `marketing_campaigns` | Chiến dịch tiếp thị (IELTS Summer, TOEIC...) |
| 4 | `marketing_follow_ups` | Theo dõi & tác vụ liên hệ khách hàng |
| 5 | `marketing_promotions` | Khuyến mại & mã giảm giá |
| 6 | `marketing_lead_activities` | Lịch sử hoạt động khách hàng |

---

## 🔧 Các Công Cụ Được Tạo

### Indexes (Chỉ mục để tăng tốc độ)
```sql
-- Truy vấn nhanh theo điều kiện thường dùng
CREATE INDEX idx_marketing_leads_status
CREATE INDEX idx_marketing_leads_created_at
CREATE INDEX idx_marketing_follow_ups_deadline
-- ... và nhiều cái khác
```

### Constraints (Ràng buộc để bảo vệ dữ liệu)
```sql
-- Kiểm tra status phải hợp lệ
CONSTRAINT marketing_leads_status_check 
  CHECK (status IN ('New', 'Contacted', 'Trial Scheduled', 'Enrolled', 'Lost'))

-- Kiểm tra budget không âm
CONSTRAINT marketing_campaigns_budget_check 
  CHECK (budget >= 0)

-- Kiểm tra ngày kết thúc >= ngày bắt đầu
CONSTRAINT marketing_campaigns_date_check 
  CHECK (end_date IS NULL OR end_date >= start_date)
```

---

## 📊 Dữ Liệu Mẫu Được Tạo

### Sources (10 nguồn)
- Facebook Ads
- Google Ads
- Website
- Referral (Giới thiệu)
- Workshop Event
- TikTok Ads
- Instagram
- Phone Call
- Email
- Other

### Campaigns (5 chiến dịch)
1. Summer IELTS Intensive 2026
2. TOEIC Bootcamp Launch
3. Kids English Spring Class
4. Business English Professional Series
5. Workshop Week Grand Event

### Leads (5 khách hàng tiềm năng)
- Tran Minh Duc (Facebook Ads)
- Nguyen Thu Ha (Google Ads)
- Pham Hoang Long (Website)
- Dang Thi Hoa (Referral)
- Le Van Son (TikTok Ads)

### Promotions (5 khuyến mại)
- SUMMER20: 20% off
- IELTS500K: 500K VND off
- REFERRAL15: 15% off
- FRIEND1M: 1M VND off
- NEWSTUDENT30: 30% off (expired)

---

## ✨ Các Tính Năng Hỗ Trợ

Sau khi tạo bảng, ứng dụng sẽ tự động hỗ trợ:

### 📱 Leads Page
- ✅ Quản lý danh sách khách hàng
- ✅ Lọc theo Status & Source
- ✅ Tìm kiếm theo tên/email/phone
- ✅ Thêm, sửa, xóa khách hàng
- ✅ Xem chi tiết khách hàng

### 📢 Campaigns Page
- ✅ Quản lý chiến dịch tiếp thị
- ✅ Lọc theo Status & Channel
- ✅ Tìm kiếm chiến dịch
- ✅ Theo dõi ngân sách

### ⏰ Follow-ups Page
- ✅ Quản lý tác vụ theo dõi
- ✅ Lọc theo Status & Priority
- ✅ Cảnh báo hạn chót quá
- ✅ Đánh dấu hoàn thành

### 🎁 Promotions Page
- ✅ Quản lý mã khuyến mại
- ✅ Lọc theo Status
- ✅ Copy mã khuyến mại
- ✅ Theo dõi ngày hết hạn

### 📊 Reports Page
- ✅ Thống kê khách hàng
- ✅ Biểu đồ trạng thái
- ✅ Phân tích chiến dịch
- ✅ Tỉ lệ chuyển đổi

### 🔗 Sources Page
- ✅ Quản lý nguồn khách hàng
- ✅ Bật/tắt nguồn
- ✅ Thêm sửa xóa nguồn

---

## 🔗 Mối Quan Hệ Giữa Bảng

```
┌─────────────────────┐
│ marketing_sources   │ (Tây ban nha của khách hàng)
└──────────┬──────────┘
           │
           ├──────────────────────────────────┐
           │                                  │
      ┌────▼──────────────┐        ┌──────────▼──────────┐
      │ marketing_leads   │        │ (lọc theo source)   │
      │ (Khách tiềm năng) │        │                     │
      └────┬──────────────┘        └─────────────────────┘
           │
           ├──────────────────────────────────┐
           │                                  │
    ┌──────▼─────────────┐        ┌──────────▼──────────────┐
    │ marketing_follow   │        │ marketing_lead_        │
    │ _ups               │        │ activities             │
    │ (Theo dõi)         │        │ (Lịch sử)             │
    └───────────────────┘        └───────────────────────┘

┌──────────────────────────┐
│ marketing_campaigns      │ (Chiến dịch - độc lập)
└──────────────────────────┘

┌──────────────────────────┐
│ marketing_promotions     │ (Khuyến mại - độc lập)
└──────────────────────────┘
```

---

## ✅ Kiểm Tra Sau Khi Tạo

### 1. Kiểm tra bảng đã tạo
```bash
# Vào Supabase Dashboard → Table Editor
# Kiểm tra có hiện các bảng:
- marketing_sources
- marketing_leads
- marketing_campaigns
- marketing_follow_ups
- marketing_promotions
- marketing_lead_activities
```

### 2. Kiểm tra dữ liệu mẫu (nếu dùng marketing-tables.sql)
```bash
# Click vào từng bảng
# Xem có dữ liệu mẫu hay không
# Ví dụ: marketing_sources có 10 bản ghi
```

### 3. Kiểm tra ứng dụng
```bash
# Truy cập http://localhost:8081/marketing/leads
# Xem dữ liệu được load lên
# Kiểm tra các chức năng (add, edit, delete)
```

---

## ⚠️ Ghi Chú Quan Trọng

### Row Level Security (RLS)
- ✅ RLS **đã bị vô hiệu hóa** cho môi trường phát triển
- ⚠️ Trước khi deploy production, **hãy bật RLS**

### Foreign Keys
- ✅ `marketing_follows.lead_id` → `marketing_leads.id` (CASCADE DELETE)
- ✅ `marketing_leads.source_id` → `marketing_sources.id` (SET NULL)

### Timestamps
- ✅ `created_at` - Tự động set khi tạo
- ✅ `updated_at` - Tự động set khi cập nhật

### UUID
- ✅ Tất cả ID đều dùng UUID v4
- ✅ Tự động generate bởi Postgres

---

## 🆘 Troubleshooting

### Lỗi: "Table already exists"
**Giải pháp:** File SQL dùng `CREATE TABLE IF NOT EXISTS`
- Nếu chạy lại sẽ không lỗi
- Nếu muốn reset, chạy câu lệnh DROP trước

### Lỗi: "Foreign key constraint"
**Giải pháp:** Tạo source trước khi tạo lead

### Không thấy dữ liệu mẫu
**Giải pháp:** Chắc chắn dùng `marketing-tables.sql` chứ không phải `marketing-tables-schema-only.sql`

### Tính năng không hoạt động
**Giải pháp:**
1. Kiểm tra bảng tồn tại trong Supabase
2. Kiểm tra RLS settings
3. Kiểm tra API keys trong environment

---

## 📚 Tài Liệu Thêm

- **MARKETING_SCHEMA.md** - Chi tiết từng bảng
- **src/hooks/use-marketing.tsx** - Code sử dụng bảng
- **src/routes/_app/marketing.*.tsx** - Giao diện

---

## 🎯 Tiếp Theo

✅ Bảng đã tạo
✅ Ứng dụng sẽ tự động sử dụng
✅ Tất cả tính năng Marketing sẽ hoạt động

---

**Ngày tạo:** May 27, 2026
**Phiên bản:** 1.0
**Database:** Supabase PostgreSQL
