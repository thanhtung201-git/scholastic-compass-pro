import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Calendar, BarChart, Settings, Trash2 } from "lucide-react";
import { format, parseISO } from "date-fns";

type Project = {
  id: string;
  code: string;
  name: string;
  description: string;
  manager_id: string;
  start_date: string;
  end_date: string;
  status: string;
  progress: number;
  manager_name?: string;
};

type UserOption = { id: string; name: string };

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    manager_id: "",
    start_date: "",
    end_date: "",
    status: "Planning",
    progress: 0,
  });

  const fetchProjects = async () => {
    const { data, error } = await supabase.from("projects").select(`
      *,
      users!projects_manager_id_fkey(name)
    `).order("created_at", { ascending: false });

    if (!error && data) {
      setProjects(data.map((p: any) => ({
        ...p,
        manager_name: p.users?.name || "Unassigned"
      })));
    }
  };

  useEffect(() => {
    fetchProjects();
    supabase.from("users").select("id, name").then(({ data }) => {
      if (data) setUsers(data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      manager_id: form.manager_id || null,
      start_date: form.start_date,
      end_date: form.end_date || null,
      status: form.status,
      progress: form.progress,
    };

    const { error } = await supabase.from("projects").insert([payload]);
    setIsSubmitting(false);

    if (!error) {
      setOpen(false);
      setForm({ code: "", name: "", description: "", manager_id: "", start_date: "", end_date: "", status: "Planning", progress: 0 });
      fetchProjects();
    } else {
      console.error(error);
      alert("Failed to create project");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      await supabase.from("projects").delete().eq("id", id);
      fetchProjects();
    }
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all educational and internal projects.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="size-4 mr-2" /> New Project</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Code</label>
                  <Input required value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="e.g. PRJ-2026" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Project Name</label>
                  <Input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Manager</label>
                  <Select value={form.manager_id} onValueChange={v => setForm(p => ({ ...p, manager_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                    <SelectContent>
                      {users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Planning">Planning</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <Input type="date" required value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <Input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Create Project"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <Search className="size-4 text-muted-foreground absolute ml-3" />
        <Input 
          className="pl-9" 
          placeholder="Search projects..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div key={project.id} className="border rounded-xl bg-card hover:shadow-md transition-shadow flex flex-col">
            <div className="p-5 border-b">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                  {project.code}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  project.status === 'Active' ? 'bg-green-100 text-green-700' :
                  project.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {project.status}
                </span>
              </div>
              <h3 className="font-semibold text-lg line-clamp-1">
                <Link to={`/projects/${project.id}`} className="hover:underline">{project.name}</Link>
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1 min-h-[40px]">
                {project.description || "No description provided."}
              </p>
            </div>
            
            <div className="p-5 flex-1 flex flex-col gap-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">
                  {project.manager_name?.charAt(0) || "?"}
                </div>
                <span>{project.manager_name}</span>
              </div>
              
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-4" />
                  <span>{project.start_date ? format(parseISO(project.start_date), "MMM d, yyyy") : "N/A"}</span>
                </div>
              </div>

              <div className="mt-auto pt-2">
                <div className="flex justify-between text-xs mb-1.5">
                  <span>Progress</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${project.progress === 100 ? 'bg-green-500' : 'bg-primary'}`} 
                    style={{ width: project.progress + '%' }} 
                  />
                </div>
              </div>
            </div>

            <div className="p-3 border-t bg-muted/20 flex justify-between items-center">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/projects/${project.id}`}>
                  View Details
                </Link>
              </Button>
              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(project.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      
      {filteredProjects.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-card/50 text-muted-foreground">
          No projects found matching your criteria.
        </div>
      )}
    </div>
  );
}

export const Route = createFileRoute("/_app/projects")({
  component: ProjectsPage,
});
