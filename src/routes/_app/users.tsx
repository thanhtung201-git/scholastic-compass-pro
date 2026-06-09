import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";
import { Loader2, Trash2, ChevronLeft, ChevronRight, Upload, Download, FileSpreadsheet } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_ROLES, type Role } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/_app/users")({ component: UsersPage });

// ─── Invite / Add User Dialog ─────────────────────────────────────────────────

function InviteUserDialog() {
  const { branches } = useDatabase();
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // role_name → department_name mapping from roles table
  const [roleMappings, setRoleMappings] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<string[]>([]);
  const [roleOptions, setRoleOptions]   = useState<string[]>([]);

  const [formData, setFormData] = useState({
    full_name:     "",
    email:         "",
    phone_number:  "",
    role:          "Academic Staff" as Role,
    department:    "",
    contract_type: "Full-time",
    base_salary:   0,
    bonus_salary:  "" as number | "",
    start_date:    "",
    branch_id:     "",
  });

  // Load role→department mappings once
  useEffect(() => {
    async function loadOptions() {
      const [rolesRes, deptsRes] = await Promise.all([
        supabase.from("roles").select("role_name, department_name"),
        supabase.from("department").select("department_name").order("department_name"),
      ]);

      if (rolesRes.data) {
        const mapping: Record<string, string> = {};
        rolesRes.data.forEach((r: any) => { mapping[r.role_name] = r.department_name; });
        setRoleMappings(mapping);
        setRoleOptions(rolesRes.data.map((r: any) => r.role_name));
        setFormData((prev) => ({
          ...prev,
          department: !prev.department && mapping[prev.role] ? mapping[prev.role] : prev.department,
        }));
      }

      if (deptsRes.data) {
        setDepartments(deptsRes.data.map((d: any) => d.department_name).filter(Boolean));
      }
    }
    loadOptions();
  }, []);

  function reset() {
    setFormData({
      full_name: "", email: "", phone_number: "",
      role: "Academic Staff",
      department: roleMappings["Academic Staff"] || "",
      contract_type: "Full-time", base_salary: 0, bonus_salary: "" as number | "", start_date: "", branch_id: "",
    });
    setError(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side bonus_salary validation
    if (formData.bonus_salary !== "" && formData.bonus_salary !== null) {
      const bonus = Number(formData.bonus_salary);
      const base  = Number(formData.base_salary);
      if (bonus < 0) {
        setError("Bonus salary cannot be negative.");
        setLoading(false);
        return;
      }
      if (base > 0 && bonus >= base * 0.7) {
        setError(`Bonus salary must be less than 70% of base salary (max: ${Math.floor(base * 0.7).toLocaleString("en-US")} ₫).`);
        setLoading(false);
        return;
      }
    }

    try {
      // ── Step 1: Create auth account using an isolated client ─────────────
      // persistSession: false means this client never writes to localStorage
      // and never fires auth state change events — the admin stays logged in
      // and the form is completely unaffected.
      const anonKey  = (supabase as any).supabaseKey  as string;
      const supabaseUrl = (supabase as any).supabaseUrl as string;

      const tempClient = createClient(supabaseUrl, anonKey, {
        auth: {
          persistSession:    false,
          autoRefreshToken:  false,
          detectSessionInUrl: false,
        },
      });

      const { data: signUpData, error: signUpErr } = await tempClient.auth.signUp({
        email:    formData.email.trim(),
        password: "password123",
      });

      if (signUpErr || !signUpData.user) {
        throw new Error(signUpErr?.message ?? "Failed to create auth account");
      }

      const authId = signUpData.user.id;

      // ── Step 2: Upsert into public.users with the new auth ID ─────────────
      const { data: newUser, error: userErr } = await supabase
        .from("users")
        .upsert({
          id:        authId,
          name:      formData.full_name.trim(),
          email:     formData.email.trim(),
          role:      formData.role,
          branch_id: formData.branch_id || null,
          status:    "Active",  // only 'Active' or 'Blocked' allowed
        }, { onConflict: "id" })
        .select("id")
        .single();

      if (userErr || !newUser) {
        throw new Error(userErr?.message ?? "Failed to create user record");
      }

      // ── Step 3: Insert into employee table ───────────────────────────────
      // DB trigger (update_employee_full_name) auto-fills full_name from users.name
      const { error: empErr } = await supabase.from("employee").insert({
        user_id:       newUser.id,
        phone_number:  formData.phone_number.trim() || null,
        department:    formData.department || null,
        role:          formData.role,
        contract_type: formData.contract_type || null,
        base_salary:   formData.base_salary > 0 ? formData.base_salary : null,
        bonus_salary:  formData.bonus_salary !== "" ? Number(formData.bonus_salary) : 0,
        start_date:    formData.start_date || null,
        status:        "Active",
      });

      if (empErr) {
        await supabase.from("users").delete().eq("id", newUser.id);
        throw new Error(empErr.message);
      }

      setOpen(false);
      reset();
    } catch (err: any) {
      setError(err.message ?? "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) reset(); }}>
      <DialogTrigger asChild>
        <Button>Invite User</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Invite New User &amp; Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error banner */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Full Name → saved as users.name */}
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                required
                value={formData.full_name}
                onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                required
                value={formData.phone_number}
                onChange={(e) => setFormData((p) => ({ ...p, phone_number: e.target.value }))}
              />
            </div>

            {/* Role — auto-fills Department */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={formData.role}
                onValueChange={(val) => {
                  const newRole = val as Role;
                  setFormData((p) => ({
                    ...p,
                    role: newRole,
                    department: roleMappings[newRole] || "",
                  }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select
                required
                value={formData.branch_id}
                onValueChange={(val) => setFormData((p) => ({ ...p, branch_id: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name.replace("MCNAEdu — ", "")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department — auto-selected by role, but can be overridden */}
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                required
                value={formData.department}
                onValueChange={(val) => setFormData((p) => ({ ...p, department: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Auto-filled by role" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contract Type */}
            <div className="space-y-2">
              <Label>Contract Type</Label>
              <Select
                required
                value={formData.contract_type}
                onValueChange={(val) => setFormData((p) => ({ ...p, contract_type: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Base Salary */}
            <div className="space-y-2">
              <Label>Base Salary</Label>
              <Input
                type="number"
                required
                min="0"
                value={formData.base_salary}
                onChange={(e) => setFormData((p) => ({ ...p, base_salary: Number(e.target.value), bonus_salary: "" }))}
              />
            </div>

            {/* Bonus Salary */}
            <div className="space-y-2">
              <Label>
                Bonus Salary
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (optional, max 70% of base)
                </span>
              </Label>
              <Input
                type="number"
                min="0"
                placeholder="Default: 0"
                value={formData.bonus_salary}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((p) => ({ ...p, bonus_salary: val === "" ? "" : Number(val) }));
                }}
              />
              {formData.bonus_salary !== "" && Number(formData.bonus_salary) > 0 && formData.base_salary > 0 && (
                Number(formData.bonus_salary) >= formData.base_salary * 0.7
                  ? <p className="text-xs text-red-500">
                      Must be less than 70% of base ({Math.floor(formData.base_salary * 0.7).toLocaleString("en-US")} ₫)
                    </p>
                  : <p className="text-xs text-green-600">
                      ✓ {((Number(formData.bonus_salary) / formData.base_salary) * 100).toFixed(1)}% of base salary
                    </p>
              )}
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Saving..." : "Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Import Users Dialog ──────────────────────────────────────────────────────

function ImportUsersDialog({ onImportSuccess }: { onImportSuccess: () => void }) {
  const { branches } = useDatabase();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importResult, setImportResult] = useState("");
  const [roleMappings, setRoleMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("roles").select("role_name, department_name");
      if (data) {
        const mapping: Record<string, string> = {};
        data.forEach((r: any) => { mapping[r.role_name] = r.department_name; });
        setRoleMappings(mapping);
      }
    }
    if (open) load();
  }, [open]);

  const handleDownloadSample = async () => {
    const xlsx = await import("xlsx");
    const sampleData = [
      {
        full_name: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
        phone_number: "0901234567",
        role: "Academic Staff",
        department: "Academic",
        contract_type: "Full-time",
        base_salary: 15000000,
        bonus_salary: 2000000,
        start_date: new Date().toISOString().slice(0, 10),
        branch_name: branches[0]?.name.replace("MCNAEdu — ", "") || "Branch A",
      },
    ];
    const ws = xlsx.utils.json_to_sheet(sampleData);
    ws["!cols"] = [
      { wch: 25 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
    ];
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Sample");
    xlsx.writeFile(wb, "sample_import_users.xlsx");
  };

  const parseExcelDate = (value: any, xlsx: typeof import("xlsx")) => {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value === "number") {
      const parsed = xlsx.SSF.parse_date_code(value);
      if (parsed) return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    setImportResult("");
    const xlsx = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = xlsx.read(buffer, { type: "array", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows = xlsx.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
    
    const branchNames = branches.map(b => b.name.replace("MCNAEdu — ", ""));

    const parsed = rawRows.map((row, index) => {
      let phone = String(row.phone_number || "").trim();
      if (phone.length === 9 && !phone.startsWith("0")) {
        phone = "0" + phone;
      }
      
      const startDate = parseExcelDate(row.start_date, xlsx);
      const baseSalary = Number(row.base_salary);
      const bonusSalary = row.bonus_salary !== "" && row.bonus_salary !== undefined ? Number(row.bonus_salary) : 0;
      const expectedDept = roleMappings[row.role];
      const actualDept = row.department;

      const errors = [
        row.full_name ? "" : "Cột 'full_name' không được để trống",
        row.email ? "" : "Cột 'email' không được để trống",
        phone ? "" : "Cột 'phone_number' không được để trống",
        ALL_ROLES.includes(row.role as Role) ? "" : `Cột 'role' sai giá trị (không tồn tại role '${row.role}')`,
        (!actualDept || actualDept === expectedDept) ? "" : `Cột 'department' sai giá trị (role '${row.role}' thuộc phòng '${expectedDept}', nhưng file ghi là '${actualDept}')`,
        ["Full-time", "Part-time"].includes(row.contract_type) ? "" : "Cột 'contract_type' phải là Full-time hoặc Part-time",
        row.base_salary !== "" && !isNaN(baseSalary) && baseSalary > 0 ? "" : "Cột 'base_salary' sai kiểu (phải là số > 0)",
        row.bonus_salary === "" || row.bonus_salary === undefined || (!isNaN(bonusSalary) && bonusSalary >= 0 && bonusSalary < baseSalary * 0.7) ? "" : "Cột 'bonus_salary' sai (phải >= 0 và < 70% lương cơ bản)",
        startDate ? "" : "Cột 'start_date' sai định dạng",
        branchNames.includes(row.branch_name) ? "" : `Cột 'branch_name' sai giá trị (nhánh '${row.branch_name}' không tồn tại)`,
      ].filter(Boolean);

      return {
        rowNumber: index + 2,
        ...row,
        phone_number: phone,
        start_date: startDate,
        base_salary: baseSalary,
        bonus_salary: bonusSalary,
        errors,
      };
    });
    setImportRows(parsed);
  };

  const confirmImport = async () => {
    if (importRows.some((row) => row.errors.length > 0)) {
      return toast.error("Vui lòng sửa các dòng bị lỗi trong file trước khi import.");
    }
    const validRows = importRows.filter((row) => row.errors.length === 0);
    if (!validRows.length) return toast.error("Không có dòng hợp lệ để import.");

    setLoading(true);
    let successCount = 0;
    
    // Auth clients
    const anonKey = (supabase as any).supabaseKey as string;
    const supabaseUrl = (supabase as any).supabaseUrl as string;
    const tempClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    try {
      for (const row of validRows) {
        // Find branch_id
        const branch = branches.find(b => b.name.replace("MCNAEdu — ", "") === row.branch_name);
        if (!branch) continue; // Should be caught by validation

        const dept = roleMappings[row.role] || "";

        // 1. Create auth
        const { data: signUpData, error: signUpErr } = await tempClient.auth.signUp({
          email: row.email.trim(),
          password: "password123",
        });
        if (signUpErr || !signUpData.user) throw new Error(`[Dòng ${row.rowNumber}] Lỗi Auth: ${signUpErr?.message}`);

        const authId = signUpData.user.id;

        // 2. Insert user
        const { data: newUser, error: userErr } = await supabase.from("users").upsert({
          id: authId,
          name: row.full_name.trim(),
          email: row.email.trim(),
          role: row.role,
          branch_id: branch.id,
          status: "Active",
        }, { onConflict: "id" }).select("id").single();
        if (userErr || !newUser) throw new Error(`[Dòng ${row.rowNumber}] Lỗi thêm User: ${userErr?.message}`);

        // 3. Insert employee
        const { error: empErr } = await supabase.from("employee").insert({
          user_id: newUser.id,
          phone_number: row.phone_number.trim() || null,
          department: dept || null,
          role: row.role,
          contract_type: row.contract_type || null,
          base_salary: row.base_salary > 0 ? row.base_salary : null,
          bonus_salary: row.bonus_salary !== "" ? Number(row.bonus_salary) : 0,
          start_date: row.start_date || null,
          status: "Active",
        });
        if (empErr) {
          await supabase.from("users").delete().eq("id", newUser.id);
          throw new Error(`[Dòng ${row.rowNumber}] Lỗi thêm Employee: ${empErr.message}`);
        }
        successCount++;
      }
      
      toast.success(`Import hoàn tất (${successCount} nhân viên).`);
      onImportSuccess();
      setImportRows([]);
      setOpen(false);
    } catch (err: any) {
      setImportResult(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) setImportRows([]); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="mr-2 size-4" /> Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Users (Nhân viên)</DialogTitle>
          <DialogDescription>
            File .xlsx cần có các cột: full_name, email, phone_number, role, department, contract_type, base_salary, bonus_salary, start_date, branch_name.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-md border p-4 bg-muted/30 mb-2">
          <div className="text-sm">
            <p className="font-medium">Chưa có file mẫu?</p>
            <p className="text-muted-foreground">Tải file mẫu với đúng định dạng và kiểu dữ liệu chuẩn.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadSample}>
            <Download className="mr-2 size-4" /> Tải file mẫu
          </Button>
        </div>
        <div className="rounded-lg border border-dashed p-6 text-center">
          <Upload className="mx-auto mb-3 size-8 text-muted-foreground" />
          <Input type="file" accept=".xlsx" onChange={(event) => handleImportFile(event.target.files?.[0])} disabled={loading} />
        </div>
        {importRows.length > 0 && (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dòng</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Nhánh</TableHead>
                  <TableHead>Lỗi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {importRows.map((row) => (
                  <TableRow key={row.rowNumber} className={row.errors.length ? "bg-red-50" : ""}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell>{row.full_name}</TableCell>
                    <TableCell>{row.email}</TableCell>
                    <TableCell>{row.role}</TableCell>
                    <TableCell>{row.branch_name}</TableCell>
                    <TableCell className="text-red-700">{row.errors.join("; ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {importResult && <div className="text-sm text-red-600 mt-2">{importResult}</div>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Đóng</Button>
          <Button onClick={confirmImport} disabled={loading || !importRows.length || importRows.some((r) => r.errors.length > 0)}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Đang import..." : "Xác nhận import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


// ─── Users Page ───────────────────────────────────────────────────────────────

function UsersPage() {
  const { users, loading, branches, currentUser, toggleUserStatus, updateUserRole, addAuditLog, deleteUser } = useDatabase();
  const [page, setPage] = useState(1);
  const pageSize = 15;
  
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [roleMappings, setRoleMappings] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    async function loadOptions() {
      const { data } = await supabase.from("roles").select("role_name, department_name");
      if (data) {
        const mapping: Record<string, string> = {};
        const depts = new Set<string>();
        data.forEach((r: any) => { 
          mapping[r.role_name] = r.department_name;
          if (r.department_name) depts.add(r.department_name);
        });
        setRoleMappings(mapping);
        setDepartments(Array.from(depts));
      }
    }
    loadOptions();
  }, []);

  const filteredUsers = React.useMemo(() => {
    return users.filter((u: any) => {
      const matchSearch = (u.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter === "All" || u.role === roleFilter;
      const userDept = roleMappings[u.role] || "";
      const matchDept = departmentFilter === "All" || userDept === departmentFilter;
      return matchSearch && matchRole && matchDept;
    });
  }, [users, searchTerm, roleFilter, departmentFilter, roleMappings]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setPage(1); // Reset page on filter change
  }, [searchTerm, roleFilter, departmentFilter]);

  const toggle = async (id: string, currentStatus: string, email: string) => {
    await toggleUserStatus(id, currentStatus);
    if (currentUser) {
      const action = currentStatus === "Active" ? "Blocked user account" : "Activated user account";
      await addAuditLog(currentUser.name, action, email, "security");
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="User Management"
        description="Toggle account status and review roles."
        actions={
          <div className="flex gap-2">
            <ImportUsersDialog onImportSuccess={() => window.location.reload()} />
            <InviteUserDialog />
          </div>
        }
      />
      
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <Input 
            placeholder="Search name or email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Roles</SelectItem>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Active</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  {currentUser?.role === "Admin" ? (
                    <Select
                      value={u.role}
                      onValueChange={async (newRole) => {
                        await updateUserRole(u.id, newRole as Role);
                        await addAuditLog(
                          currentUser.name,
                          `Changed role of user ${u.name} to ${newRole}`,
                          u.email,
                          "security"
                        );
                      }}
                    >
                      <SelectTrigger className="h-7 w-[140px] text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => (
                          <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="secondary">{u.role}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {branches.find((b) => b.id === u.branch_id)?.name.replace("MCNAEdu — ", "") || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={u.status === "Active" ? "default" : "destructive"}>
                    {u.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={u.status === "Active"}
                    onCheckedChange={() => toggle(u.id, u.status, u.email)}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this user?")) {
                        await deleteUser(u.id);
                        if (currentUser) {
                          await addAuditLog(currentUser.name, `Deleted user ${u.name}`, u.email, "security");
                        }
                      }
                    }}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="size-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}