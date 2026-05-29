# 🚀 Hướng Dẫn Tạo Bảng Trên Supabase

## ⚡ 3 Bước Nhanh

### **Bước 1: Mở File SQL**
```bash
Tìm file: SUPABASE_COMMANDS.sql
```

### **Bước 2: Copy Toàn Bộ**
- Mở file
- Chọn All: `Ctrl+A`
- Copy: `Ctrl+C`

### **Bước 3: Chạy Trên Supabase**
1. Mở: https://app.supabase.com
2. Chọn project MCNAEdu
3. Vào: SQL Editor (menu trái)
4. Click: New Query
5. Paste: `Ctrl+V`
6. Click: RUN
7. ✅ Xong!

---

## 📊 Kết Quả

Bạn sẽ thấy:
- ✅ 6 bảng được tạo
- ✅ ~25 bản ghi mẫu
- ✅ 6 indexes để tăng tốc độ
- ✅ Relationships được thiết lập

---

## ✅ Kiểm Tra

### 1. Trong Supabase
- Vào: Table Editor
- Xem: 6 bảng mới
  - marketing_sources
  - marketing_leads
  - marketing_campaigns
  - marketing_follow_ups
  - marketing_promotions
  - marketing_lead_activities

### 2. Trong Ứng Dụng
- Vào: http://localhost:8081/marketing/leads
- Xem: Dữ liệu đã load
- Thử: Add/Edit/Delete lead

---

## 📋 File Được Tạo

- **SUPABASE_COMMANDS.sql** ← Dùng cái này!
- Đầy đủ các comment
- Sẵn sàng copy-paste
- Có verification queries

---

## ⚠️ Lưu Ý

1. **IF NOT EXISTS** → An toàn chạy lại
2. **TRANSACTION** → Tất cả hoặc không
3. **RLS Disabled** → Cho development
4. **Sample Data** → Đủ để test

---

## 🚀 Go!

```bash
Copy → Paste → RUN
```

**Done!** ✅

---

## 📞 Nếu Có Lỗi

### Lỗi: "Table already exists"
✅ Bình thường! Chỉ cần chạy lại

### Lỗi: "Foreign key constraint"
✅ Các bảng được tạo theo thứ tự đúng

### Lỗi: Không có dữ liệu
✅ Check INSERT statements

---

**Ready?** Copy file và paste vào Supabase! 🚀
