import { createFileRoute } from "@tanstack/react-router";
import ReceptionistDashboard from "@/components/dashboards/receptionist";

export const Route = createFileRoute("/_app/rooms")({ component: ReceptionistDashboard });
