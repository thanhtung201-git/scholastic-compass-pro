import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Loader2, Trash2, Edit2, MoreHorizontal, Check, X } from "lucide-react";
import { useMarketing } from "@/hooks/use-marketing";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_app/marketing/sources")({
  component: SourcesPage,
});

function SourcesPage() {
  const { sources, loading, addSource, updateSource, deleteSource } = useMarketing();
  const [q, setQ] = useState("");

  // Add source form
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit source form
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const filteredSources = sources.filter((source) =>
    source.name.toLowerCase().includes(q.toLowerCase())
  );

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addSource({
        ...formData,
        created_at: new Date().toISOString(),
      });
      setFormData({
        name: "",
        description: "",
        is_active: true,
      });
      setIsAddOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSource = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditSubmitting(true);
    try {
      await updateSource(editingSource.id, editFormData);
      setIsEditOpen(false);
      setEditingSource(null);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteSource = async (id: string) => {
    if (confirm("Are you sure you want to delete this source?")) {
      await deleteSource(id);
    }
  };

  const openEditDialog = (source: any) => {
    setEditingSource(source);
    setEditFormData({
      name: source.name,
      description: source.description || "",
      is_active: source.is_active,
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
      <PageHeader title="Lead Sources" description="Manage lead sources" />

      {/* Filters and Actions */}
      <Card className="p-4">
        <div className="flex gap-4">
          <Input
            placeholder="Search sources..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="flex-1"
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 size-4" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Lead Source</DialogTitle>
                <DialogDescription>Create a new lead source</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSource} className="space-y-4">
                <div>
                  <Label htmlFor="name">Source Name *</Label>
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
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                  />
                  <Label htmlFor="is-active">Active</Label>
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
                      "Create Source"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Sources Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    No sources found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {source.description || "-"}
                    </TableCell>
                    <TableCell>
                      {source.is_active ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="size-4" /> Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-red-600">
                          <X className="size-4" /> Inactive
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{new Date(source.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(source)}>
                            <Edit2 className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteSource(source.id)}
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

      {/* Edit Source Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lead Source</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSource} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Source Name *</Label>
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
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is-active"
                checked={editFormData.is_active}
                onCheckedChange={(checked) =>
                  setEditFormData({ ...editFormData, is_active: checked })
                }
              />
              <Label htmlFor="edit-is-active">Active</Label>
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
                  "Update Source"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
