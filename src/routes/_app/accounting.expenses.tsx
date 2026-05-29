import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Trash2, Edit2, Loader2, Link as LinkIcon, Download } from "lucide-react";
import { useDatabase } from "@/hooks/use-database";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_app/accounting/expenses")({
  component: ExpensesPage,
});

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const EXPENSE_CATEGORIES = ["Marketing", "Rent", "Utilities", "Salary", "Equipment", "Other"];

function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense, addAuditLog, loading } = useDatabase();
  const { user: currentUser } = useAuth();
  
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const filtered = expenses.filter((e) => {
    const matchesSearch = e.description?.toLowerCase().includes(q.toLowerCase());
    const matchesCat = catFilter === "All" || e.category === catFilter;
    return matchesSearch && matchesCat;
  });

  const totalExpense = filtered.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Form State
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: "Other",
    amount: "",
    expense_date: new Date().toISOString().slice(0, 10),
    description: "",
    receipt_url: ""
  });

  const handleOpenEdit = (exp: any) => {
    setEditingId(exp.id);
    setFormData({
      category: exp.category,
      amount: String(exp.amount),
      expense_date: exp.expense_date,
      description: exp.description || "",
      receipt_url: exp.receipt_url || ""
    });
    setIsOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      category: "Other",
      amount: "",
      expense_date: new Date().toISOString().slice(0, 10),
      description: "",
      receipt_url: ""
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const dataToSave = {
        category: formData.category,
        amount: Number(formData.amount),
        expense_date: formData.expense_date,
        description: formData.description,
        receipt_url: formData.receipt_url,
        created_by: currentUser?.name || "Unknown"
      };

      if (editingId) {
        await updateExpense(editingId, dataToSave);
        await addAuditLog(currentUser?.name || "Unknown", `Updated expense: ${formatVND(dataToSave.amount)}`, `Category: ${dataToSave.category}`, "update");
      } else {
        await addExpense(dataToSave);
        await addAuditLog(currentUser?.name || "Unknown", `Added expense: ${formatVND(dataToSave.amount)}`, `Category: ${dataToSave.category}`, "create");
      }
      setIsOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, amount: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      await deleteExpense(id);
      await addAuditLog(currentUser?.name || "Unknown", `Deleted expense of ${formatVND(amount)}`, `Expense ID: ${id}`, "delete");
    }
  };

  const exportCSV = () => {
    const headers = ["Category", "Amount", "Date", "Description", "Created By"];
    const rows = filtered.map(e => [
      e.category,
      e.amount,
      e.expense_date,
      e.description,
      e.created_by
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader title="Expense Management" description="Track and categorize operational costs." />
        <Button onClick={handleOpenAdd}>
          <Plus className="mr-2 size-4" /> Add Expense
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-4 border-destructive/30 bg-destructive/5">
          <div className="text-xs text-muted-foreground">Total Expenses (Filtered)</div>
          <div className="text-2xl font-semibold mt-1 text-destructive">{formatVND(totalExpense)}</div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative flex-1 min-w-[250px] max-w-sm">
            <Search className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              value={q} 
              onChange={(e) => setQ(e.target.value)} 
              placeholder="Search description..." 
              className="pl-8 h-9" 
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[180px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge variant="secondary">{filtered.length} records</Badge>

          <Button variant="outline" size="sm" className="ml-auto" onClick={exportCSV}>
            <Download className="mr-2 size-4" /> Export CSV
          </Button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Receipt</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No expense records found.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.expense_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{e.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{e.description || "—"}</TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      {formatVND(Number(e.amount || 0))}
                    </TableCell>
                    <TableCell>
                      {e.receipt_url ? (
                        <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs">
                          <LinkIcon className="size-3" /> View
                        </a>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.created_by}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(e)}>
                          <Edit2 className="size-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(e.id, e.amount)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>
              Record an operational cost.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Amount (VND) *</Label>
              <Input 
                type="number" 
                required 
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Date *</Label>
              <Input 
                type="date" 
                required 
                value={formData.expense_date} 
                onChange={(e) => setFormData({...formData, expense_date: e.target.value})} 
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="What was this expense for?"
              />
            </div>
            <div className="grid gap-2">
              <Label>Receipt URL</Label>
              <Input 
                type="url" 
                value={formData.receipt_url} 
                onChange={(e) => setFormData({...formData, receipt_url: e.target.value})} 
                placeholder="https://..."
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                {editingId ? "Save Changes" : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
