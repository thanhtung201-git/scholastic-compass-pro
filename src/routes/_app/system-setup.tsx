import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Pencil, Trash2, Save, Settings2, Building2, Briefcase, GitBranch, ShieldCheck, Eye, EyeOff, MoreHorizontal, Check, CheckSquare, X, Upload, Download, FileSpreadsheet } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";
import { NAV_SECTIONS } from "@/lib/nav-config";
import { ALL_ROLES } from "@/lib/types";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

// ─── Import Departments Dialog ────────────────────────────────────────────────

function ImportDepartmentsDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const handleDownload = async () => {
    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet([{ department_name: "Academic" }, { department_name: "Finance" }]);
    ws["!cols"] = [{ wch: 30 }];
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Departments");
    xlsx.writeFile(wb, "sample_departments.xlsx");
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    const xlsx = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = xlsx.read(buf, { type: "array" });
    const raw = xlsx.utils.sheet_to_json<Record<string, any>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const parsed = raw.map((r, i) => ({
      rowNumber: i + 2,
      department_name: String(r.department_name || "").trim(),
      errors: [!String(r.department_name || "").trim() ? "Column 'department_name' cannot be empty" : ""].filter(Boolean),
    }));
    setRows(parsed);
  };

  const handleConfirm = async () => {
    if (rows.some(r => r.errors.length)) return toast.error("Fix all errors before importing.");
    setLoading(true);
    try {
      for (const row of rows) {
        const { error } = await supabase.from("department").insert([{ id: crypto.randomUUID(), department_name: row.department_name }]);
        if (error) throw new Error(`[Row ${row.rowNumber}] ${error.message}`);
      }
      toast.success(`Imported ${rows.length} department(s).`);
      onSuccess();
      setRows([]);
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setRows([]); }}>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="size-4" /> Import Excel
      </Button>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Departments</DialogTitle>
          <DialogDescription>File must have column: <code>department_name</code></DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-md border p-3 bg-muted/30">
          <p className="text-sm text-muted-foreground">Download the sample template first.</p>
          <Button variant="outline" size="sm" onClick={handleDownload}><Download className="mr-2 size-4" />Sample</Button>
        </div>
        <div className="rounded-lg border border-dashed p-5 text-center">
          <Upload className="mx-auto mb-2 size-7 text-muted-foreground" />
          <Input type="file" accept=".xlsx" onChange={(e) => handleFile(e.target.files?.[0])} disabled={loading} />
        </div>
        {rows.length > 0 && (
          <Table>
            <TableHeader><TableRow><TableHead>Row</TableHead><TableHead>Department Name</TableHead><TableHead>Errors</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.rowNumber} className={r.errors.length ? "bg-red-50" : ""}>
                  <TableCell>{r.rowNumber}</TableCell>
                  <TableCell>{r.department_name}</TableCell>
                  <TableCell className="text-red-700 text-xs">{r.errors.join("; ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading || !rows.length || rows.some(r => r.errors.length)}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {loading ? "Importing..." : "Confirm Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Import Roles Dialog ──────────────────────────────────────────────────────

function ImportRolesDialog({ onSuccess, departments }: { onSuccess: () => void; departments: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const deptNames = departments.map((d: any) => d.department_name);

  const handleDownload = async () => {
    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet([
      { role_name: "Academic Staff", department_name: deptNames[0] || "Academic", level: 3 },
    ]);
    ws["!cols"] = [{ wch: 25 }, { wch: 25 }, { wch: 10 }];
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Roles");
    xlsx.writeFile(wb, "sample_roles.xlsx");
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    const xlsx = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = xlsx.read(buf, { type: "array" });
    const raw = xlsx.utils.sheet_to_json<Record<string, any>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const parsed = raw.map((r, i) => {
      const roleName = String(r.role_name || "").trim();
      const deptName = String(r.department_name || "").trim();
      const level = parseInt(String(r.level)) || 0;
      const errors = [
        !roleName ? "Column 'role_name' cannot be empty" : "",
        !deptName ? "Column 'department_name' cannot be empty" : deptNames.includes(deptName) ? "" : `Department '${deptName}' does not exist in the system — create it first`,
        !level || level < 1 ? "Column 'level' must be a number ≥ 1" : "",
      ].filter(Boolean);
      return { rowNumber: i + 2, role_name: roleName, department_name: deptName, level, errors };
    });
    setRows(parsed);
  };

  const handleConfirm = async () => {
    if (rows.some(r => r.errors.length)) return toast.error("Fix all errors before importing.");
    setLoading(true);
    try {
      for (const row of rows) {
        const { error } = await supabase.from("roles").insert([{ id: crypto.randomUUID(), role_name: row.role_name, department_name: row.department_name, level: row.level }]);
        if (error) throw new Error(`[Row ${row.rowNumber}] ${error.message}`);
      }
      toast.success(`Imported ${rows.length} role(s).`);
      onSuccess();
      setRows([]);
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setRows([]); }}>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="size-4" /> Import Excel
      </Button>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Roles</DialogTitle>
          <DialogDescription>File must have columns: <code>role_name</code>, <code>department_name</code>, <code>level</code>. Department must already exist.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-md border p-3 bg-muted/30">
          <p className="text-sm text-muted-foreground">Download the sample template first.</p>
          <Button variant="outline" size="sm" onClick={handleDownload}><Download className="mr-2 size-4" />Sample</Button>
        </div>
        <div className="rounded-lg border border-dashed p-5 text-center">
          <Upload className="mx-auto mb-2 size-7 text-muted-foreground" />
          <Input type="file" accept=".xlsx" onChange={(e) => handleFile(e.target.files?.[0])} disabled={loading} />
        </div>
        {rows.length > 0 && (
          <Table>
            <TableHeader><TableRow><TableHead>Row</TableHead><TableHead>Role</TableHead><TableHead>Department</TableHead><TableHead>Level</TableHead><TableHead>Errors</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.rowNumber} className={r.errors.length ? "bg-red-50" : ""}>
                  <TableCell>{r.rowNumber}</TableCell>
                  <TableCell>{r.role_name}</TableCell>
                  <TableCell>{r.department_name}</TableCell>
                  <TableCell>{r.level}</TableCell>
                  <TableCell className="text-red-700 text-xs">{r.errors.join("; ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading || !rows.length || rows.some(r => r.errors.length)}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {loading ? "Importing..." : "Confirm Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Import Branches Dialog ───────────────────────────────────────────────────

function ImportBranchesDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<any[]>([]);

  const handleDownload = async () => {
    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet([{ branch_name: "MCNAEdu — District 1" }, { branch_name: "MCNAEdu — District 7" }]);
    ws["!cols"] = [{ wch: 35 }];
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Branches");
    xlsx.writeFile(wb, "sample_branches.xlsx");
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    const xlsx = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = xlsx.read(buf, { type: "array" });
    const raw = xlsx.utils.sheet_to_json<Record<string, any>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const parsed = raw.map((r, i) => ({
      rowNumber: i + 2,
      branch_name: String(r.branch_name || "").trim(),
      errors: [!String(r.branch_name || "").trim() ? "Column 'branch_name' cannot be empty" : ""].filter(Boolean),
    }));
    setRows(parsed);
  };

  const handleConfirm = async () => {
    if (rows.some(r => r.errors.length)) return toast.error("Fix all errors before importing.");
    setLoading(true);
    try {
      for (const row of rows) {
        const { error } = await supabase.from("branches").insert([{ id: crypto.randomUUID(), name: row.branch_name }]);
        if (error) throw new Error(`[Row ${row.rowNumber}] ${error.message}`);
      }
      toast.success(`Imported ${rows.length} branch(es).`);
      onSuccess();
      setRows([]);
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setRows([]); }}>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <FileSpreadsheet className="size-4" /> Import Excel
      </Button>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Branches</DialogTitle>
          <DialogDescription>File must have column: <code>branch_name</code></DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-md border p-3 bg-muted/30">
          <p className="text-sm text-muted-foreground">Download the sample template first.</p>
          <Button variant="outline" size="sm" onClick={handleDownload}><Download className="mr-2 size-4" />Sample</Button>
        </div>
        <div className="rounded-lg border border-dashed p-5 text-center">
          <Upload className="mx-auto mb-2 size-7 text-muted-foreground" />
          <Input type="file" accept=".xlsx" onChange={(e) => handleFile(e.target.files?.[0])} disabled={loading} />
        </div>
        {rows.length > 0 && (
          <Table>
            <TableHeader><TableRow><TableHead>Row</TableHead><TableHead>Branch Name</TableHead><TableHead>Errors</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.rowNumber} className={r.errors.length ? "bg-red-50" : ""}>
                  <TableCell>{r.rowNumber}</TableCell>
                  <TableCell>{r.branch_name}</TableCell>
                  <TableCell className="text-red-700 text-xs">{r.errors.join("; ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading || !rows.length || rows.some(r => r.errors.length)}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {loading ? "Importing..." : "Confirm Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const Route = createFileRoute("/_app/system-setup")({ component: SystemSetupPage });

// ─── Module Access Control Tab ────────────────────────────────────────────────

function ModuleAccessTab() {
  const { moduleAccess, updateModuleAccess, dbRoles } = useDatabase();
  const [localAccess, setLocalAccess] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // All toggleable items across all sections
  const allModules = NAV_SECTIONS.flatMap((section) =>
    section.items
      .filter((item) => !item.alwaysVisible)
      .map((item) => ({ ...item, section: section.label }))
  );

  // Aggregate roles from DB; include any legacy roles already saved in module_access
  const allRoleNames = useMemo(() => {
    const fromDb = dbRoles.map((r: { role_name: string }) => r.role_name);
    const fromSaved = Object.values(moduleAccess).flat() as string[];
    const merged = fromDb.length > 0 ? [...fromDb, ...fromSaved] : [...ALL_ROLES, ...fromSaved];
    return Array.from(new Set(merged)).sort((a, b) => a.localeCompare(b));
  }, [dbRoles, moduleAccess]);

  // Group roles by department for quick-select bulk actions
  const departmentGroups = useMemo(() => {
    const groups: Record<string, string[]> = {};
    for (const role of dbRoles) {
      const dept = role.department_name?.trim() || "Unassigned";
      groups[dept] = groups[dept] ? [...groups[dept], role.role_name] : [role.role_name];
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [dbRoles]);

  // Initialize local state from DB (or nav-config defaults)
  useEffect(() => {
    const init: Record<string, string[]> = {};
    allModules.forEach((item) => {
      init[item.key] = (moduleAccess[item.key] as string[]) ?? [...item.roles];
    });
    setLocalAccess(init);
    setDirty(false);
  }, [moduleAccess]);

  const toggleRole = (moduleKey: string, role: string) => {
    setLocalAccess((prev) => {
      const current = prev[moduleKey] ?? [];
      const updated = current.includes(role)
        ? current.filter((r) => r !== role)
        : [...current, role];
      return { ...prev, [moduleKey]: updated };
    });
    setDirty(true);
  };

  const setAccess = (moduleKey: string, roles: string[]) => {
    setLocalAccess((prev) => ({ ...prev, [moduleKey]: roles }));
    setDirty(true);
  };

  const addAccess = (moduleKey: string, roles: string[]) => {
    setLocalAccess((prev) => {
      const current = prev[moduleKey] ?? [];
      const updated = Array.from(new Set([...current, ...roles]));
      return { ...prev, [moduleKey]: updated };
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateModuleAccess(localAccess);
      setDirty(false);
    } catch (e) {
      // toast already handled in use-database
    } finally {
      setSaving(false);
    }
  };

  // Group modules by section for display
  const sections = NAV_SECTIONS
    .map((section) => ({
      ...section,
      items: section.items.filter((i) => !i.alwaysVisible),
    }))
    .filter((s) => s.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Configure which roles can access each menu item. Changes take effect immediately after saving.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !dirty} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
        <span className="font-medium">Roles ({allRoleNames.length}):</span>
        {allRoleNames.map((r) => (
          <Badge key={r} variant="outline" className="text-[10px] font-normal">{r}</Badge>
        ))}
      </div>

      {sections.map((section) => (
        <Card key={section.label} className="overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <CardTitle className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              {section.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-48">Menu Item</TableHead>
                    {allRoleNames.map((role) => (
                      <TableHead key={role} className="text-center text-[11px] px-1 whitespace-nowrap">
                        {role.replace(" Manager", " Mgr").replace(" Staff", " Stf")}
                      </TableHead>
                    ))}
                    <TableHead className="text-right text-[11px]">Quick Select</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.items.map((item) => {
                    const allowed = localAccess[item.key] ?? [...item.roles];
                    const allChecked = allRoleNames.length > 0 && allRoleNames.every((r) => allowed.includes(r));
                    const noneChecked = allowed.length === 0;
                    return (
                      <TableRow key={item.key}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <item.icon className="size-4 text-muted-foreground shrink-0" />
                            <span className="text-sm">{item.title}</span>
                          </div>
                        </TableCell>
                        {allRoleNames.map((role) => (
                          <TableCell key={role} className="text-center px-1">
                            <Checkbox
                              id={`${item.key}-${role}`}
                              checked={allowed.includes(role)}
                              onCheckedChange={() => toggleRole(item.key, role)}
                              className="mx-auto"
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {noneChecked ? (
                              <Badge variant="destructive" className="gap-1 text-[10px]">
                                <EyeOff className="size-3" /> Hidden
                              </Badge>
                            ) : allChecked ? (
                              <Badge variant="secondary" className="gap-1 text-[10px]">
                                <Eye className="size-3" /> All
                              </Badge>
                            ) : (
                              <Badge className="text-[10px]">{allowed.length} roles</Badge>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="text-xs">Bulk Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setAccess(item.key, allRoleNames)}>
                                  <CheckSquare className="mr-2 size-3.5" /> Check All
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setAccess(item.key, [])}>
                                  <X className="mr-2 size-3.5" /> Uncheck All
                                </DropdownMenuItem>
                                {departmentGroups.length > 0 && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs font-medium py-1">Add Department</DropdownMenuLabel>
                                    {departmentGroups.map(([dept, roles]) => (
                                      <DropdownMenuItem key={dept} onClick={() => addAccess(item.key, roles)}>
                                        <Plus className="mr-2 size-3.5" /> {dept}
                                      </DropdownMenuItem>
                                    ))}
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {dirty && (
        <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-background/95 backdrop-blur border-t py-3 px-1">
          <p className="text-sm text-amber-600 font-medium">⚠ You have unsaved changes</p>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Departments Tab ──────────────────────────────────────────────────────────

function DepartmentsTab() {
  const { departments, addDepartment, renameDepartment, deleteDepartment, dbRoles } = useDatabase();
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try { await addDepartment(newName.trim()); setNewName(""); }
    catch {} finally { setAdding(false); }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(id);
    try { await renameDepartment(id, editName.trim()); setEditId(null); }
    catch {} finally { setSaving(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this department? Existing employees won't be affected.")) return;
    await deleteDepartment(id);
  };

  return (
    <div className="space-y-6">
      {/* Add form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add Department</CardTitle>
          <CardDescription className="text-xs">Departments are used when inviting new employees.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="e.g. Customer Success"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="max-w-xs"
            />
            <Button onClick={handleAdd} disabled={adding || !newName.trim()} className="gap-2">
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add
            </Button>
            <ImportDepartmentsDialog onSuccess={() => window.location.reload()} />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead>Roles Assigned</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {departments.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-8">
                  No departments found. Add one above.
                </TableCell>
              </TableRow>
            )}
            {departments.map((dept: any) => {
              const roleCount = dbRoles.filter((r: any) => r.department_name === dept.department_name).length;
              const isEditing = editId === dept.id;
              return (
                <TableRow key={dept.id}>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(dept.id);
                          if (e.key === "Escape") setEditId(null);
                        }}
                        className="h-7 max-w-xs"
                      />
                    ) : (
                      <span className="font-medium">{dept.department_name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{roleCount} role{roleCount !== 1 ? "s" : ""}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm" variant="default" className="h-7 text-xs gap-1"
                            onClick={() => handleSaveEdit(dept.id)}
                            disabled={saving === dept.id}
                          >
                            {saving === dept.id && <Loader2 className="size-3 animate-spin" />}
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon" variant="ghost" className="size-8"
                            onClick={() => { setEditId(dept.id); setEditName(dept.department_name); }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(dept.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────

function RolesTab() {
  const { dbRoles, departments, addDbRole, renameDbRole, deleteDbRole } = useDatabase();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [form, setForm] = useState({ role_name: "", department_name: "", level: 1 });
  const [saving, setSaving] = useState(false);

  const openAdd = () => {
    setEditingRole(null);
    setForm({ role_name: "", department_name: departments[0]?.department_name ?? "", level: 1 });
    setDialogOpen(true);
  };

  const openEdit = (role: any) => {
    setEditingRole(role);
    setForm({ role_name: role.role_name, department_name: role.department_name, level: role.level ?? 1 });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.role_name.trim() || !form.department_name) return;
    setSaving(true);
    try {
      if (editingRole) {
        await renameDbRole(editingRole.id, form.role_name.trim(), form.department_name, form.level);
      } else {
        await addDbRole(form.role_name.trim(), form.department_name, form.level);
      }
      setDialogOpen(false);
    } catch {} finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this role? Existing users with this role won't be affected.")) return;
    await deleteDbRole(id);
  };

  // Group by department
  const grouped = dbRoles.reduce((acc: Record<string, any[]>, role: any) => {
    const dept = role.department_name || "Unassigned";
    acc[dept] = acc[dept] ? [...acc[dept], role] : [role];
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage system roles and their department assignments. Roles appear in the user invite form.
        </p>
        <div className="flex gap-2">
          <ImportRolesDialog onSuccess={() => window.location.reload()} departments={departments} />
          <Button onClick={openAdd} className="gap-2">
            <Plus className="size-4" /> Add Role
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Level</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dbRoles.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground text-sm py-8">
                  No roles found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {Object.entries(grouped).map(([dept, roles]) =>
              (roles as any[]).map((role, idx) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.role_name}</TableCell>
                  <TableCell>
                    {idx === 0 && (
                      <Badge variant="outline" className="text-xs">{dept}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">Level {role.level ?? 1}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="size-8" onClick={() => openEdit(role)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(role.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Role" : "Add Role"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                value={form.role_name}
                onChange={(e) => setForm((p) => ({ ...p, role_name: e.target.value }))}
                placeholder="e.g. Sales Staff"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={form.department_name}
                onValueChange={(val) => setForm((p) => ({ ...p, department_name: val }))}
              >
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d: any) => (
                    <SelectItem key={d.id} value={d.department_name}>{d.department_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Input
                type="number"
                min={1}
                value={form.level}
                onChange={(e) => setForm((p) => ({ ...p, level: parseInt(e.target.value) || 1 }))}
              />
              <p className="text-[10px] text-muted-foreground">Lower number = higher ranking (e.g., Level 1 = Admin).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.role_name.trim() || !form.department_name} className="gap-2">
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editingRole ? "Save" : "Add Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Branches Tab ─────────────────────────────────────────────────────────────

function BranchesTab() {
  const { branches, addBranch, renameBranch, deleteBranch } = useDatabase();
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try { await addBranch(newName.trim()); setNewName(""); }
    catch {} finally { setAdding(false); }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSaving(id);
    try { await renameBranch(id, editName.trim()); setEditId(null); }
    catch {} finally { setSaving(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this branch? Existing users/students assigned here won't be moved.")) return;
    await deleteBranch(id);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Add Branch</CardTitle>
          <CardDescription className="text-xs">Branches are used when assigning users, students, and teachers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="e.g. MCNAEdu — District 7"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              className="max-w-sm"
            />
            <Button onClick={handleAdd} disabled={adding || !newName.trim()} className="gap-2">
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add
            </Button>
            <ImportBranchesDialog onSuccess={() => window.location.reload()} />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch Name</TableHead>
              <TableHead className="w-28 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {branches.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground text-sm py-8">
                  No branches found.
                </TableCell>
              </TableRow>
            )}
            {branches.map((branch: any) => {
              const isEditing = editId === branch.id;
              return (
                <TableRow key={branch.id}>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(branch.id);
                          if (e.key === "Escape") setEditId(null);
                        }}
                        className="h-7 max-w-sm"
                      />
                    ) : (
                      <span className="font-medium">{branch.name}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm" variant="default" className="h-7 text-xs gap-1"
                            onClick={() => handleSaveEdit(branch.id)}
                            disabled={saving === branch.id}
                          >
                            {saving === branch.id && <Loader2 className="size-3 animate-spin" />}
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon" variant="ghost" className="size-8"
                            onClick={() => { setEditId(branch.id); setEditName(branch.name); }}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(branch.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ─── System Setup Page ────────────────────────────────────────────────────────

function SystemSetupPage() {
  const { user } = useAuth();

  if (user?.role !== "Admin") {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <ShieldCheck className="size-12 text-muted-foreground" />
        <h2 className="font-semibold text-lg">Access Restricted</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          The System Setup page is only accessible to Admin users.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Setup"
        description="Configure menu access, departments, roles, and branches for your organization."
      />

      <Tabs defaultValue="access" className="space-y-6">
        <TabsList className="h-10 gap-1">
          <TabsTrigger value="access" className="gap-2 text-sm">
            <Settings2 className="size-4" /> Menu Access
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2 text-sm">
            <Building2 className="size-4" /> Departments
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2 text-sm">
            <Briefcase className="size-4" /> Roles
          </TabsTrigger>
          <TabsTrigger value="branches" className="gap-2 text-sm">
            <GitBranch className="size-4" /> Branches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="access">
          <ModuleAccessTab />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>

        <TabsContent value="branches">
          <BranchesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
