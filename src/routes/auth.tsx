import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { type Role, ALL_ROLES } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, signIn, signUp, switchRole, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <GraduationCap className="size-6" />
          </div>
          <div>
            <div className="font-semibold tracking-tight text-lg">MCNAEdu CRM</div>
            <div className="text-xs text-white/70">Academic ERP Suite</div>
          </div>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold tracking-tight leading-tight">
            Replace your Excel chaos with a system built for academic centers.
          </h1>
          <p className="text-white/80 leading-relaxed max-w-md">
            One source of truth for 2 branches, 25 teachers, and 400+ students. Schedule classes, track tuition,
            grade homework, and approve payroll — without juggling spreadsheets.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-md pt-4">
            {[
              { k: "Branches", v: "2" },
              { k: "Teachers", v: "25" },
              { k: "Students", v: "400+" },
            ].map((s) => (
              <div key={s.k} className="rounded-lg bg-white/10 backdrop-blur p-4">
                <div className="text-2xl font-bold">{s.v}</div>
                <div className="text-xs text-white/70">{s.k}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-white/60">© 2026 MCNAEdu. All rights reserved.</div>
      </div>

      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden flex items-center gap-2">
            <div className="size-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
            <div className="font-semibold">MCNAEdu CRM</div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Sign in or create an account to continue.</p>
          </div>

          <Card className="p-6">
            <Tabs defaultValue="signin">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="signin" className="mt-6">
                <SignInForm onSubmit={signIn} onSuccess={() => navigate({ to: "/dashboard" })} />
              </TabsContent>
              <TabsContent value="signup" className="mt-6">
                <SignUpForm onSubmit={signUp} onSuccess={() => navigate({ to: "/dashboard" })} />
              </TabsContent>
            </Tabs>
          </Card>



          <Link to="/auth" className="hidden">.</Link>
        </div>
      </div>
    </div>
  );
}

function SignInForm({ onSubmit, onSuccess }: { onSubmit: ReturnType<typeof useAuth>["signIn"]; onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    setLoading(true);
    const { error } = await onSubmit(email, password);
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Signed in!");
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mcnaedu.vn" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="si-password">Password</Label>
        <Input id="si-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />} Sign In
      </Button>
    </form>
  );
}

function SignUpForm({ onSubmit, onSuccess }: { onSubmit: ReturnType<typeof useAuth>["signUp"]; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role>("Student");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Please enter your full name.");
    if (password.length < 6) return toast.error("Password must be at least 6 characters.");
    if (password !== confirm) return toast.error("Passwords do not match.");
    setLoading(true);
    const { error } = await onSubmit({ name, email, password, role });
    setLoading(false);
    if (error) return toast.error(error);
    toast.success("Account created!");
    onSuccess();
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="su-name">Full Name</Label>
        <Input id="su-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nguyen Van A" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-email">Email</Label>
        <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@mcnaedu.vn" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="su-pw">Password</Label>
          <Input id="su-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 chars" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-cf">Confirm</Label>
          <Input id="su-cf" type="password" required minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-role">Role</Label>
        <Select value={role} onValueChange={(v) => setRole(v as Role)}>
          <SelectTrigger id="su-role">
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {ALL_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" />} Create Account
      </Button>
    </form>
  );
}
