import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { AuthProvider } from "@/lib/auth-context";
import { DatabaseProvider } from "@/hooks/use-database";
import { MarketingProvider } from "@/hooks/use-marketing";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <a href="/" className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Go home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MCNA ERP" },
      { name: "description", content: "MCNA ERP — multi-branch ERP for academic centers. Manage students, classes, schedules, tuition, and payroll." },
      { property: "og:title", content: "MCNA ERP" },
      { name: "twitter:title", content: "MCNA ERP" },
      { property: "og:description", content: "MCNA ERP — multi-branch ERP for academic centers. Manage students, classes, schedules, tuition, and payroll." },
      { name: "twitter:description", content: "MCNA ERP — multi-branch ERP for academic centers. Manage students, classes, schedules, tuition, and payroll." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d8bc899c-74fc-4878-8456-f285576a43b5/id-preview-d13ec1b1--3ad5b96d-128f-40c7-ad64-411eafce2108.lovable.app-1779162635133.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/d8bc899c-74fc-4878-8456-f285576a43b5/id-preview-d13ec1b1--3ad5b96d-128f-40c7-ad64-411eafce2108.lovable.app-1779162635133.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DatabaseProvider>
          <MarketingProvider>
            <TooltipProvider>
              <Outlet />
              <Toaster />
            </TooltipProvider>
          </MarketingProvider>
        </DatabaseProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
