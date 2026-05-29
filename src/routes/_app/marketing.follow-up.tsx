import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus, Loader2, Trash2, Edit2, MoreHorizontal, AlertCircle } from "lucide-react";
import { useMarketing } from "@/hooks/use-marketing";
import { useDatabase } from "@/hooks/use-database"; // <-- Import hook này giống file Leads
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/marketing/follow-up")({
  component: FollowUpPage,
});

const FOLLOWUP_TYPE_COLORS: Record<string, string> = {
  Call: "bg-blue-100 text-blue-800",
  Email: "bg-green-100 text-green-800",
  Meeting: "bg-purple-100 text-purple-800",
  "Trial Class": "bg-yellow-100 text-yellow-800",
  Consultation: "bg-orange-100 text-orange-800",
  Task: "bg-gray-100 text-gray-800",
};

const PRIORITY_COLORS: Record<string, string> = {
  Low: "bg-blue-100 text-blue-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High: "bg-orange-100 text-orange-800",
  Urgent: "bg-red-100 text-red-800",
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-gray-100 text-gray-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
  Rescheduled: "bg-purple-100 text-purple-800",
};

function FollowUpPage() {
  const { followUps, leads, loading: marketingLoading, addFollowUp, updateFollowUp, deleteFollowUp } = useMarketing();
  const { users, loading: dbLoading } = useDatabase(); // <-- Lấy dữ liệu users hệ thống về giống file Leads
  
  const loading = marketingLoading || dbLoading;

  const [filterStatus, setFilterStatus] = useState("__all__");
  const [filterPriority, setFilterPriority] = useState("__all__");

  // Add follow-up form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    lead_id: "",
    assigned_staff_id: "",
    followup_type: "",
    title: "",
    note: "",
    deadline: "",
    priority: "Medium",
    status: "Pending",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit follow-up form
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    lead_id: "",
    assigned_staff_id: "",
    followup_type: "",
    title: "",
    note: "",
    deadline: "",
    priority: "Medium",
    status: "Pending",
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const filteredFollowUps = followUps?.filter((followUp) => {
    const matchesStatus = filterStatus === "__all__" || followUp.status === filterStatus;
    const matchesPriority = filterPriority === "__all__" || followUp.priority === filterPriority;
    return matchesStatus && matchesPriority;
  }) || [];

  const isOverdue = (deadline: string, status: string) => {
    if (status === "Completed" || !deadline) return false;
    return new Date(deadline) < new Date();
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.lead_id || !formData.followup_type || !formData.assigned_staff_id || !formData.deadline) {
      toast.error("Please fill in all required fields (*)");
      return;
    }

    setIsSubmitting(true);
    try {
      const cleanFormData = {
        ...formData,
        title: formData.title.trim() === "" ? null : formData.title,
        note: formData.note.trim() === "" ? null : formData.note,
      };

      await addFollowUp({
        ...cleanFormData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setFormData({
        lead_id: "",
        assigned_staff_id: "",
        followup_type: "",
        title: "",
        note: "",
        deadline: "",
        priority: "Medium",
        status: "Pending",
      });
      setIsAddOpen(false);
      toast.success("Follow-up created successfully");
    } catch (error) {
      toast.error("Failed to create follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editFormData.lead_id || !editFormData.followup_type || !editFormData.assigned_staff_id || !editFormData.deadline) {
      toast.error("Please fill in all required fields (*)");
      return;
    }

    setIsEditSubmitting(true);
    try {
      const cleanEditData = {
        ...editFormData,
        title: editFormData.title.trim() === "" ? null : editFormData.title,
        note: editFormData.note.trim() === "" ? null : editFormData.note,
      };

      await updateFollowUp(editingFollowUp.id, {
        ...cleanEditData,
        updated_at: new Date().toISOString(),
      });
      setIsEditOpen(false);
      setEditingFollowUp(null);
      toast.success("Follow-up updated successfully");
    } catch (error) {
      toast.error("Failed to update follow-up");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteFollowUp = async (id: string) => {
    if (confirm("Are you sure you want to delete this follow-up?")) {
      try {
        await deleteFollowUp(id);
        toast.success("Follow-up deleted successfully");
      } catch (error) {
        toast.error("Failed to delete follow-up");
      }
    }
  };

  const openEditDialog = (followUp: any) => {
    setEditingFollowUp(followUp);
    setEditFormData({
      lead_id: followUp.lead_id || "",
      assigned_staff_id: followUp.assigned_staff_id || "",
      followup_type: followUp.followup_type || "",
      title: followUp.title || "",
      note: followUp.note || "",
      deadline: followUp.deadline?.split("T")[0] || "",
      priority: followUp.priority || "Medium",
      status: followUp.status || "Pending",
    });
    setIsEditOpen(true);
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
      <PageHeader title="Follow-ups" description="Manage customer follow-up tasks" />

      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="Rescheduled">Rescheduled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Priority</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="ml-auto">
                <Plus className="mr-2 size-4" />
                Add Follow-up
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Follow-up</DialogTitle>
                <DialogDescription>Create a new follow-up task</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddFollowUp} className="space-y-4">
                {/* Lead Field */}
                <div className="space-y-2">
                  <Label htmlFor="lead">Lead *</Label>
                  <Select
                    value={formData.lead_id}
                    onValueChange={(value) => setFormData({ ...formData, lead_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lead" />
                    </SelectTrigger>
                    <SelectContent>
                      {leads && leads.length > 0 ? (
                        leads.map((lead) => (
                          <SelectItem key={lead.id} value={lead.id}>
                            {lead.full_name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-xs text-center text-muted-foreground">No leads found</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assigned Staff Field - Đồng bộ theo file Leads */}
                <div className="space-y-2">
                  <Label htmlFor="assigned_staff">Assigned Staff *</Label>
                  <Select
                    value={formData.assigned_staff_id}
                    onValueChange={(value) => setFormData({ ...formData, assigned_staff_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select staff" />
                    </SelectTrigger>
                    <SelectContent>
                      {users && users.length > 0 ? (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-xs text-center text-muted-foreground">No staff found</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Field */}
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select
                    value={formData.followup_type}
                    onValueChange={(value) => setFormData({ ...formData, followup_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Trial Class">Trial Class</SelectItem>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Task">Task</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title Field */}
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                {/* Deadline Field */}
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>

                {/* Priority Field */}
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Note Field */}
                <div className="space-y-2">
                  <Label htmlFor="note">Note</Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  />
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !formData.lead_id || !formData.followup_type || !formData.assigned_staff_id || !formData.deadline}
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Follow-up"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Follow-ups Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead</TableHead>
                <TableHead>Assigned Staff</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFollowUps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No follow-ups found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFollowUps.map((followUp) => (
                  <TableRow
                    key={followUp.id}
                    className={isOverdue(followUp.deadline, followUp.status) ? "bg-red-50/50 hover:bg-red-50" : ""}
                  >
                    <TableCell className="font-medium">
                      {followUp.lead?.full_name || "-"}
                    </TableCell>
                    <TableCell>
                      {/* Thay đổi logic tìm tên Staff dựa theo mảng users giống file Leads */}
                      {users.find((u) => u.id === followUp.assigned_staff_id)?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={FOLLOWUP_TYPE_COLORS[followUp.followup_type] || "bg-gray-100 text-gray-800"}>
                        {followUp.followup_type}
                      </Badge>
                    </TableCell>
                    <TableCell>{followUp.title || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isOverdue(followUp.deadline, followUp.status) && (
                          <AlertCircle className="size-4 text-red-600" />
                        )}
                        {followUp.deadline ? new Date(followUp.deadline).toLocaleDateString() : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[followUp.priority] || "bg-gray-100 text-gray-800"}>
                        {followUp.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[followUp.status] || "bg-gray-100 text-gray-800"}>
                        {followUp.status}
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
                          <DropdownMenuItem onClick={() => openEditDialog(followUp)}>
                            <Edit2 className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteFollowUp(followUp.id)}
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

      {/* Edit Follow-up Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Follow-up</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditFollowUp} className="space-y-4">
            {/* Lead Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-lead">Lead *</Label>
              <Select
                value={editFormData.lead_id}
                onValueChange={(value) => setEditFormData({ ...editFormData, lead_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads?.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Field in Edit */}
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type *</Label>
              <Select
                value={editFormData.followup_type}
                onValueChange={(value) => setEditFormData({ ...editFormData, followup_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Trial Class">Trial Class</SelectItem>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title Field in Edit */}
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              />
            </div>

            {/* Deadline Field in Edit */}
            <div className="space-y-2">
              <Label htmlFor="edit-deadline">Deadline *</Label>
              <Input
                id="edit-deadline"
                type="date"
                required
                value={editFormData.deadline}
                onChange={(e) => setEditFormData({ ...editFormData, deadline: e.target.value })}
              />
            </div>

            {/* Status Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assigned Staff Field - Đồng bộ theo file Leads */}
            <div className="space-y-2">
              <Label htmlFor="edit-assigned-staff">Assigned Staff *</Label>
              <Select
                value={editFormData.assigned_staff_id}
                onValueChange={(value) => setEditFormData({ ...editFormData, assigned_staff_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select
                value={editFormData.priority}
                onValueChange={(value) => setEditFormData({ ...editFormData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Note Field */}
            <div className="space-y-2">
              <Label htmlFor="edit-note">Note</Label>
              <Textarea
                id="edit-note"
                value={editFormData.note}
                onChange={(e) => setEditFormData({ ...editFormData, note: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={isEditSubmitting || !editFormData.lead_id || !editFormData.followup_type || !editFormData.assigned_staff_id || !editFormData.deadline}
                className="w-full"
              >
                {isEditSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Follow-up"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}