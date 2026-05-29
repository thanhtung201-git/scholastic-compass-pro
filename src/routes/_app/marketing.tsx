import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/marketing")({
  component: MarketingLayout,
});

function MarketingLayout() {
  return <Outlet />;
}
