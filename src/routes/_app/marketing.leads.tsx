import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
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
import { Search, Plus, Loader2, Trash2, Edit2, MoreHorizontal, Eye, LayoutGrid, List } from "lucide-react";
import { useMarketing } from "@/hooks/use-marketing";
import { useDatabase } from "@/hooks/use-database";
import { Textarea } from "@/components/ui/textarea";
import { LeadKanbanView } from "@/components/lead-kanban-view";

export const Route = createFileRoute("/_app/marketing/leads")({
  component: LeadsPage,
});

const LEAD_STATUS_COLORS: Record<string, string> = {
  New: "bg-blue-100 text-blue-800",
  Interested: "bg-blue-100 text-blue-800",
  "Trial Scheduled": "bg-yellow-100 text-yellow-800",
  Registered: "bg-green-100 text-green-800",
  Paid: "bg-green-100 text-green-800",
  Lost: "bg-red-100 text-red-800",
};

function formatLastContact(date?: string) {
  if (!date) return "-";
  const lastContact = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - lastContact.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return lastContact.toLocaleDateString();
}

function LeadsPage() {
  const { leads, sources, loading: marketingLoading, addLead, updateLead, deleteLead, updateLeadStatus } = useMarketing();
  const { users, loading: dbLoading } = useDatabase();
  const loading = marketingLoading || dbLoading;
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState('__all__');
  const [filterSource, setFilterSource] = useState('__all__');
  const [filterStaff, setFilterStaff] = useState('__all__');
  const [filterType, setFilterType] = useState('__all__');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Add lead form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    source_id: "",
    assigned_staff_id: "",
    status: "New",
    notes: "",
    lead_type: "B2C",
    company_name: "",
    job_title: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit lead form
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    source_id: "",
    assigned_staff_id: "",
    status: "New",
    notes: "",
    lead_type: "B2C",
    company_name: "",
    job_title: "",
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.full_name.toLowerCase().includes(q.toLowerCase()) ||
      lead.email?.toLowerCase().includes(q.toLowerCase()) ||
      lead.phone?.includes(q);
    const matchesStatus = filterStatus === '__all__' || lead.status === filterStatus;
    const matchesSource = filterSource === '__all__' || lead.source_id === filterSource;
    const matchesStaff = filterStaff === '__all__' || lead.assigned_staff_id === filterStaff;
    const matchesType = filterType === '__all__' || lead.lead_type === filterType;
    return matchesSearch && matchesStatus && matchesSource && matchesStaff && matchesType;
  });

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addLead({
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        source_id: "",
        assigned_staff_id: "",
        status: "New",
        notes: "",
        lead_type: "B2C",
        company_name: "",
        job_title: "",
      });
      setIsAddOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    try {
      await updateLead(editingLead.id, {
        ...editFormData,
        updated_at: new Date().toISOString(),
      });
      setIsEditOpen(false);
      setEditingLead(null);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm("Are you sure you want to delete this lead?")) {
      await deleteLead(id);
    }
  };

  const openEditDialog = (lead: any) => {
    setEditingLead(lead);
    setEditFormData({
      full_name: lead.full_name,
      email: lead.email || "",
      phone: lead.phone || "",
      address: lead.address || "",
      source_id: lead.source_id || "",
      assigned_staff_id: lead.assigned_staff_id || "",
      status: lead.status,
      notes: lead.notes || "",
      lead_type: lead.lead_type || "B2C",
      company_name: lead.company_name || "",
      job_title: lead.job_title || "",
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
      <div className="flex items-center justify-between">
        <PageHeader title="Leads" description="Manage potential students and leads" />
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <List className="mr-1 size-4" />
            Table
          </Button>
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="mr-1 size-4" />
            Kanban
          </Button>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Add Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                  <DialogDescription>
                    Create a new lead record for a potential student
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddLead} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="lead_type">Lead Type</Label>
                    <Select
                      value={formData.lead_type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, lead_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="B2C">B2C (Individual)</SelectItem>
                        <SelectItem value="B2B">B2B (Business)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.lead_type === 'B2B' && (
                    <>
                      <div>
                        <Label htmlFor="company_name">Company Name</Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) =>
                            setFormData({ ...formData, company_name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="job_title">Job Title</Label>
                        <Input
                          id="job_title"
                          value={formData.job_title}
                          onChange={(e) =>
                            setFormData({ ...formData, job_title: e.target.value })
                          }
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Select
                      value={formData.source_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, source_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assigned_staff">Assigned Staff</Label>
                    <Select
                      value={formData.assigned_staff_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, assigned_staff_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
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
                        "Create Lead"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Status</SelectItem>
                <SelectItem value="New">New</SelectItem>
                <SelectItem value="Interested">Interested</SelectItem>
                <SelectItem value="Trial Scheduled">Trial Scheduled</SelectItem>
                <SelectItem value="Registered">Registered</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Lost">Lost</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                <SelectItem value="B2C">B2C</SelectItem>
                <SelectItem value="B2B">B2B</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Sources</SelectItem>
                {sources.map((source) => (
                  <SelectItem key={source.id} value={source.id}>
                    {source.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStaff} onValueChange={setFilterStaff}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Staff</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Leads Views */}
      {viewMode === 'kanban' ? (
        <LeadKanbanView 
          leads={filteredLeads}
          users={users}
          onStatusChange={async (id, status) => {
            await updateLeadStatus(id, status);
          }}
        />
      ) : (
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Contact</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No leads found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.full_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{lead.lead_type || 'B2C'}</Badge>
                    </TableCell>
                    <TableCell>{lead.company_name || "-"}</TableCell>
                    <TableCell>{lead.phone || "-"}</TableCell>
                    <TableCell>{lead.email || "-"}</TableCell>
                    <TableCell>{lead.source?.name || "-"}</TableCell>
                    <TableCell>
                      {users.find(u => u.id === lead.assigned_staff_id)?.name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={LEAD_STATUS_COLORS[lead.status]}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLastContact(lead.last_contact_at)}
                    </TableCell>
                    <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/marketing/leads/${lead.id}`}>
                              <Eye className="mr-2 size-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(lead)}>
                            <Edit2 className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteLead(lead.id)}
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
      )}

      {/* Edit Lead Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditLead} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                required
                value={editFormData.full_name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, full_name: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-lead_type">Lead Type</Label>
              <Select
                value={editFormData.lead_type}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, lead_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2C">B2C (Individual)</SelectItem>
                  <SelectItem value="B2B">B2B (Business)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editFormData.lead_type === 'B2B' && (
              <>
                <div>
                  <Label htmlFor="edit-company_name">Company Name</Label>
                  <Input
                    id="edit-company_name"
                    value={editFormData.company_name}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, company_name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-job_title">Job Title</Label>
                  <Input
                    id="edit-job_title"
                    value={editFormData.job_title}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, job_title: e.target.value })
                    }
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.address}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, address: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-source">Source</Label>
              <Select
                value={editFormData.source_id}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, source_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((source) => (
                    <SelectItem key={source.id} value={source.id}>
                      {source.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-assigned_staff">Assigned Staff</Label>
              <Select
                value={editFormData.assigned_staff_id}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, assigned_staff_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
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
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Interested">Interested</SelectItem>
                  <SelectItem value="Trial Scheduled">Trial Scheduled</SelectItem>
                  <SelectItem value="Registered">Registered</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editFormData.notes}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, notes: e.target.value })
                }
              />
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
                  "Update Lead"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
