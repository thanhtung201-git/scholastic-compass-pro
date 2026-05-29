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
import { Plus, Loader2, Trash2, Edit2, MoreHorizontal } from "lucide-react";
import { useMarketing } from "@/hooks/use-marketing";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/marketing/campaigns")({
  component: CampaignsPage,
});

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  Planning: "bg-gray-100 text-gray-800",
  Running: "bg-blue-100 text-blue-800",
  Paused: "bg-yellow-100 text-yellow-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const CHANNELS = [
  "Facebook Ads",
  "TikTok Ads",
  "Google Ads",
  "Workshop",
  "Offline Event",
  "Email",
  "SMS",
  "Other",
];

function CampaignsPage() {
  const { campaigns, loading, addCampaign, updateCampaign, deleteCampaign } = useMarketing();
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("__all__");
  const [filterChannel, setFilterChannel] = useState("__all__");

  // Add campaign form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    channel: "",
    budget: "",
    start_date: "",
    end_date: "",
    status: "Planning",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit campaign form
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    channel: "",
    budget: "",
    start_date: "",
    end_date: "",
    status: "Planning",
    description: "",
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(q.toLowerCase());
    const matchesStatus = filterStatus === "__all__" || !filterStatus || campaign.status === filterStatus;
    const matchesChannel = filterChannel === "__all__" || !filterChannel || campaign.channel === filterChannel;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addCampaign({
        ...formData,
        budget: parseFloat(formData.budget) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setFormData({
        name: "",
        channel: "",
        budget: "",
        start_date: "",
        end_date: "",
        status: "Planning",
        description: "",
      });
      setIsAddOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    try {
      await updateCampaign(editingCampaign.id, {
        ...editFormData,
        budget: parseFloat(editFormData.budget) || 0,
        updated_at: new Date().toISOString(),
      });
      setIsEditOpen(false);
      setEditingCampaign(null);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      await deleteCampaign(id);
    }
  };

  const openEditDialog = (campaign: any) => {
    setEditingCampaign(campaign);
    setEditFormData({
      name: campaign.name,
      channel: campaign.channel,
      budget: campaign.budget?.toString() || "",
      start_date: campaign.start_date?.split("T")[0] || "",
      end_date: campaign.end_date?.split("T")[0] || "",
      status: campaign.status,
      description: campaign.description || "",
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
      <PageHeader title="Campaigns" description="Manage marketing campaigns" />

      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex gap-4">
            <Input
              placeholder="Search campaigns..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="flex-1"
            />
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 size-4" />
                  Add Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Campaign</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCampaign} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Campaign Name *</Label>
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
                    <Label htmlFor="channel">Channel *</Label>
                    <Select
                      value={formData.channel}
                      onValueChange={(value) =>
                        setFormData({ ...formData, channel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNELS.map((channel) => (
                          <SelectItem key={channel} value={channel}>
                            {channel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budget">Budget</Label>
                    <Input
                      id="budget"
                      type="number"
                      step="0.01"
                      value={formData.budget}
                      onChange={(e) =>
                        setFormData({ ...formData, budget: e.target.value })
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
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, end_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
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
                        "Create Campaign"
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
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="Running">Running</SelectItem>
                <SelectItem value="Paused">Paused</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Channels</SelectItem>
                {CHANNELS.map((channel) => (
                  <SelectItem key={channel} value={channel}>
                    {channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No campaigns found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>{campaign.channel}</TableCell>
                    <TableCell>${campaign.budget?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>{new Date(campaign.start_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {campaign.end_date
                        ? new Date(campaign.end_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={CAMPAIGN_STATUS_COLORS[campaign.status]}>
                        {campaign.status}
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
                          <DropdownMenuItem onClick={() => openEditDialog(campaign)}>
                            <Edit2 className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteCampaign(campaign.id)}
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

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCampaign} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Campaign Name *</Label>
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
              <Label htmlFor="edit-channel">Channel *</Label>
              <Select
                value={editFormData.channel}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, channel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-budget">Budget</Label>
              <Input
                id="edit-budget"
                type="number"
                step="0.01"
                value={editFormData.budget}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, budget: e.target.value })
                }
              />
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
                  <SelectItem value="Planning">Planning</SelectItem>
                  <SelectItem value="Running">Running</SelectItem>
                  <SelectItem value="Paused">Paused</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
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
                  "Update Campaign"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
