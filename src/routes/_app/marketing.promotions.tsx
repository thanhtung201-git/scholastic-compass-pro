import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Loader2, Trash2, Edit2, MoreHorizontal, Copy } from "lucide-react";
import { useMarketing } from "@/hooks/use-marketing";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/marketing/promotions")({
  component: PromotionsPage,
});

const PROMOTION_STATUS_COLORS: Record<string, string> = {
  Active: "bg-green-100 text-green-800",
  Inactive: "bg-gray-100 text-gray-800",
  Expired: "bg-red-100 text-red-800",
  Scheduled: "bg-blue-100 text-blue-800",
};

function PromotionsPage() {
  const { promotions, loading, addPromotion, updatePromotion, deletePromotion } = useMarketing();
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("__all__");

  // Add promotion form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "Percentage",
    discount_value: "",
    max_discount_value: "",
    start_date: "",
    end_date: "",
    status: "Scheduled",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit promotion form
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    code: "",
    name: "",
    description: "",
    discount_type: "Percentage",
    discount_value: "",
    max_discount_value: "",
    start_date: "",
    end_date: "",
    status: "Scheduled",
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const filteredPromotions = promotions.filter((promo) => {
    const matchesSearch =
      promo.code.toLowerCase().includes(q.toLowerCase()) ||
      promo.name.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = filterStatus === "__all__" || promo.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addPromotion({
        ...formData,
        discount_value: parseFloat(formData.discount_value) || 0,
        max_discount_value: formData.max_discount_value ? parseFloat(formData.max_discount_value) : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setFormData({
        code: "",
        name: "",
        description: "",
        discount_type: "Percentage",
        discount_value: "",
        max_discount_value: "",
        start_date: "",
        end_date: "",
        status: "Scheduled",
      });
      setIsAddOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditPromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    try {
      await updatePromotion(editingPromotion.id, {
        ...editFormData,
        discount_value: parseFloat(editFormData.discount_value) || 0,
        max_discount_value: editFormData.max_discount_value ? parseFloat(editFormData.max_discount_value) : null,
        updated_at: new Date().toISOString(),
      });
      setIsEditOpen(false);
      setEditingPromotion(null);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (confirm("Are you sure you want to delete this promotion?")) {
      await deletePromotion(id);
    }
  };

  const openEditDialog = (promo: any) => {
    setEditingPromotion(promo);
    setEditFormData({
      code: promo.code,
      name: promo.name,
      description: promo.description || "",
      discount_type: promo.discount_type,
      discount_value: promo.discount_value?.toString() || "",
      max_discount_value: promo.max_discount_value?.toString() || "",
      start_date: promo.start_date?.split("T")[0] || "",
      end_date: promo.end_date?.split("T")[0] || "",
      status: promo.status,
    });
    setIsEditOpen(true);
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Promotions" description="Manage discounts and promotions" />

      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search promotions..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1"
            />
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Add Promotion
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Promotion</DialogTitle>
                  <DialogDescription>Create a new discount promotion</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddPromotion} className="space-y-4">
                  <div>
                    <Label htmlFor="code">Promo Code *</Label>
                    <Input
                      id="code"
                      required
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="e.g., SUMMER20"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Promotion Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="discount-type">Discount Type *</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, discount_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Percentage">Percentage (%)</SelectItem>
                        <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="discount-value">
                      Discount Value {formData.discount_type === "Percentage" ? "(%)" : ""}*
                    </Label>
                    <Input
                      id="discount-value"
                      type="number"
                      step="0.01"
                      required
                      value={formData.discount_value}
                      onChange={(e) =>
                        setFormData({ ...formData, discount_value: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="start-date">Start Date *</Label>
                    <Input
                      id="start-date"
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date *</Label>
                    <Input
                      id="end-date"
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Promotion"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Promotions Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPromotions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No promotions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromotions.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell className="font-mono font-semibold">
                      {promo.code}
                    </TableCell>
                    <TableCell className="font-medium">{promo.name}</TableCell>
                    <TableCell>
                      {promo.discount_type === "Percentage"
                        ? `${promo.discount_value}%`
                        : `$${promo.discount_value}`}
                    </TableCell>
                    <TableCell>{new Date(promo.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>{new Date(promo.end_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={PROMOTION_STATUS_COLORS[promo.status]}>
                        {promo.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => copyPromoCode(promo.code)}>
                            <Copy className="mr-2 size-4" />
                            Copy Code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(promo)}>
                            <Edit2 className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeletePromotion(promo.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Promotion Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Promotion</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditPromotion} className="space-y-4">
            <div>
              <Label htmlFor="edit-code">Promo Code</Label>
              <Input
                id="edit-code"
                disabled
                value={editFormData.code}
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Promotion Name *</Label>
              <Input
                id="edit-name"
                required
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-discount-type">Discount Type</Label>
              <Select
                value={editFormData.discount_type}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, discount_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Percentage">Percentage (%)</SelectItem>
                  <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={isEditSubmitting}
                className="w-full"
              >
                {isEditSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Promotion"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
