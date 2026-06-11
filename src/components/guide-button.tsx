import { useState, useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { BookOpen, Lightbulb, AlertTriangle, Info, AlertCircle, XCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const urlToGuideMap: Record<string, string> = {
  "/dashboard": "GUIDE_CORE_DASHBOARD.md",
  "/tuition": "GUIDE_FINANCE_TUITION.md",
  "/accounting/payments": "GUIDE_FINANCE_PAYMENTS.md",
  "/accounting/expenses": "GUIDE_FINANCE_EXPENSES.md",
  "/accounting/balance-sheet": "GUIDE_FINANCE_BALANCE_SHEET.md",
  "/payroll": "GUIDE_FINANCE_PAYROLL.md",
  "/salary": "GUIDE_FINANCE_SALARY.md",
  "/teachers": "GUIDE_HR_TEACHERS.md",
  "/employees": "GUIDE_HR_EMPLOYEES.md",
  "/attendance-tracking": "GUIDE_HR_ATTENDANCE_TRACKING.md",
  "/leave-approve": "GUIDE_HR_LEAVE_APPROVE.md",
  "/students": "GUIDE_ACADEMIC_STUDENTS.md",
  "/classes": "GUIDE_ACADEMIC_CLASSES.md",
  "/schedule": "GUIDE_ACADEMIC_SCHEDULE.md",
  "/homework": "GUIDE_ACADEMIC_HOMEWORK.md",
  "/attendance": "GUIDE_ACADEMIC_ATTENDANCE.md",
  "/rooms": "GUIDE_ACADEMIC_ROOMS.md",
  "/projects": "GUIDE_PM_PROJECTS.md",
  "/task-assignment": "GUIDE_PM_TASK_ASSIGNMENT.md",
  "/kanban-board": "GUIDE_PM_KANBAN_BOARD.md",
  "/gantt-chart": "GUIDE_PM_GANTT_CHART.md",
  "/sprint-planning": "GUIDE_PM_SPRINT_PLANNING.md",
  "/workload-view": "GUIDE_PM_WORKLOAD_VIEW.md",
  "/comments-threads": "GUIDE_PM_COMMENTS_THREADS.md",
  "/time-tracking": "GUIDE_PM_TIME_TRACKING.md",
  "/marketing/leads": "GUIDE_MKT_LEADS.md",
  "/marketing/campaigns": "GUIDE_MKT_CAMPAIGNS.md",
  "/marketing/sources": "GUIDE_MKT_SOURCES.md",
  "/marketing/promotions": "GUIDE_MKT_PROMOTIONS.md",
  "/marketing/follow-up": "GUIDE_MKT_FOLLOW_UP.md",
  "/marketing/reports": "GUIDE_MKT_REPORTS.md",
  "/users": "GUIDE_ADMIN_USERS.md",
  "/audit": "GUIDE_ADMIN_AUDIT.md",
  "/system-setup": "GUIDE_ADMIN_SYSTEM_SETUP.md",
};

// Use raw import for all guides
const rawGuides = import.meta.glob('../../user-guides/*.md', { query: '?raw', import: 'default' });

// --- Callout types config ---
type CalloutType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

const calloutConfig: Record<CalloutType, { icon: React.ElementType; className: string; label: string }> = {
  NOTE:      { icon: Info,          className: "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300",    label: "Note" },
  TIP:       { icon: Lightbulb,     className: "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-300",  label: "Tip" },
  IMPORTANT: { icon: AlertCircle,   className: "border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300", label: "Important" },
  WARNING:   { icon: AlertTriangle, className: "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300", label: "Warning" },
  CAUTION:   { icon: XCircle,       className: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300",        label: "Caution" },
};

// Custom blockquote renderer to handle GitHub-style callouts > [!TIP] etc.
function CustomBlockquote({ children }: { children?: React.ReactNode }) {
  // Extract text from children to detect callout type
  const childrenArray = Array.isArray(children) ? children : [children];
  let calloutType: CalloutType | null = null;
  let filteredChildren: React.ReactNode[] = [];

  for (const child of childrenArray) {
    if (child && typeof child === "object" && "props" in child) {
      const el = child as React.ReactElement<{ children?: React.ReactNode }>;
      // Check if the first <p> child starts with [!TYPE]
      if (!calloutType) {
        const pChildren = el.props?.children;
        const firstText = typeof pChildren === "string"
          ? pChildren
          : Array.isArray(pChildren) && typeof pChildren[0] === "string"
          ? pChildren[0]
          : "";
        const match = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
        if (match) {
          calloutType = match[1].toUpperCase() as CalloutType;
          // Strip the marker text from this paragraph's content
          const rest = firstText.replace(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/i, "");
          const newPChildren = Array.isArray(pChildren)
            ? [rest, ...pChildren.slice(1)]
            : rest;
          filteredChildren.push(
            <p key="callout-first" className="m-0">{newPChildren}</p>
          );
          continue;
        }
      }
      filteredChildren.push(child);
    } else {
      filteredChildren.push(child);
    }
  }

  if (calloutType && calloutConfig[calloutType]) {
    const { icon: Icon, className, label } = calloutConfig[calloutType];
    return (
      <div className={`my-4 flex gap-3 rounded-lg border p-4 ${className}`}>
        <Icon className="mt-0.5 size-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm mb-1">{label}</p>
          <div className="text-sm [&>p]:m-0">{filteredChildren}</div>
        </div>
      </div>
    );
  }

  // Default blockquote
  return (
    <blockquote className="border-l-4 border-muted-foreground/30 pl-4 text-muted-foreground italic my-4">
      {children}
    </blockquote>
  );
}

export function GuideButton() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const [guideContent, setGuideContent] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Find the longest matching URL prefix
  const matchedUrl = Object.keys(urlToGuideMap)
    .filter((url) => path === url || path.startsWith(url + "/"))
    .sort((a, b) => b.length - a.length)[0];

  const guideFileName = matchedUrl ? urlToGuideMap[matchedUrl] : null;

  useEffect(() => {
    if (guideFileName && isOpen) {
      setGuideContent(null); // reset while loading
      const guidePath = `../../user-guides/${guideFileName}`;
      const loadGuide = rawGuides[guidePath];
      if (loadGuide) {
        // @ts-ignore
        loadGuide().then((content: string) => {
          setGuideContent(content);
        }).catch((err) => {
          console.error("Failed to load guide:", err);
          setGuideContent("Failed to load guide content.");
        });
      } else {
        setGuideContent("Guide not found for this page.");
      }
    }
  }, [guideFileName, isOpen]);

  if (!guideFileName) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookOpen className="size-4" />
          Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" />
            Page Guide
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-4 prose prose-sm dark:prose-invert max-w-none
            prose-headings:font-semibold prose-h1:text-xl prose-h2:text-base prose-h3:text-sm
            prose-hr:my-4 prose-p:leading-relaxed prose-li:my-0.5
            prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs">
            {guideContent ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  blockquote: ({ children }) => <CustomBlockquote>{children}</CustomBlockquote>,
                  // Render horizontal rules as a thin divider
                  hr: () => <hr className="my-6 border-border" />,
                }}
              >
                {guideContent}
              </ReactMarkdown>
            ) : (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <div className="text-center space-y-2">
                  <BookOpen className="size-8 mx-auto opacity-40" />
                  <p className="text-sm">Loading guide...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
