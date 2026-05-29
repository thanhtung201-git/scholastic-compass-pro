import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Loader2, TrendingUp, Users, CheckCircle2, DollarSign } from "lucide-react";
import { useMarketing } from "@/hooks/use-marketing";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/_app/marketing/reports")({
  component: ReportsPage,
});

function ReportsPage() {
  const { leads, campaigns, loading } = useMarketing();

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  // Lead statistics
  const leadStats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "New").length,
    contacted: leads.filter((l) => l.status === "Contacted").length,
    trialScheduled: leads.filter((l) => l.status === "Trial Scheduled").length,
    enrolled: leads.filter((l) => l.status === "Enrolled").length,
    lost: leads.filter((l) => l.status === "Lost").length,
  };

  const conversionRate =
    leadStats.total > 0
      ? ((leadStats.enrolled / leadStats.total) * 100).toFixed(2)
      : "0.00";

  // Campaign statistics
  const campaignStats = {
    total: campaigns.length,
    running: campaigns.filter((c) => c.status === "Running").length,
    completed: campaigns.filter((c) => c.status === "Completed").length,
    totalBudget: campaigns.reduce((sum, c) => sum + (c.budget || 0), 0),
  };

  // Lead status distribution
  const leadStatusData = [
    { name: "New", value: leadStats.new },
    { name: "Contacted", value: leadStats.contacted },
    { name: "Trial Scheduled", value: leadStats.trialScheduled },
    { name: "Enrolled", value: leadStats.enrolled },
    { name: "Lost", value: leadStats.lost },
  ];

  // Leads by source
  const sourceMap = new Map();
  leads.forEach((lead) => {
    const sourceName = lead.source?.name || "Unknown";
    sourceMap.set(sourceName, (sourceMap.get(sourceName) || 0) + 1);
  });
  const leadsBySource = Array.from(sourceMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  // Campaign status distribution
  const campaignStatusData = [
    { name: "Planning", value: campaigns.filter((c) => c.status === "Planning").length },
    { name: "Running", value: campaigns.filter((c) => c.status === "Running").length },
    { name: "Paused", value: campaigns.filter((c) => c.status === "Paused").length },
    { name: "Completed", value: campaigns.filter((c) => c.status === "Completed").length },
    { name: "Cancelled", value: campaigns.filter((c) => c.status === "Cancelled").length },
  ];

  // Campaign by channel
  const channelMap = new Map();
  campaigns.forEach((campaign) => {
    channelMap.set(campaign.channel, (channelMap.get(campaign.channel) || 0) + 1);
  });
  const campaignByChannel = Array.from(channelMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Marketing Reports" description="Analytics and insights" />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
              <p className="text-3xl font-bold mt-2">{leadStats.total}</p>
            </div>
            <Users className="size-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Enrolled</p>
              <p className="text-3xl font-bold mt-2">{leadStats.enrolled}</p>
              <p className="text-xs text-muted-foreground mt-1">{conversionRate}% conversion</p>
            </div>
            <CheckCircle2 className="size-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
              <p className="text-3xl font-bold mt-2">{campaignStats.running}</p>
            </div>
            <TrendingUp className="size-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <p className="text-3xl font-bold mt-2">${campaignStats.totalBudget.toFixed(2)}</p>
            </div>
            <DollarSign className="size-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Lead Status Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Lead Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={leadStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {leadStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Campaign Status Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Campaign Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={campaignStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {campaignStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Leads by Source */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Leads by Source</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsBySource}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Campaigns by Channel */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Campaigns by Channel</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignByChannel}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Tables */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Lead Summary */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Lead Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Leads</span>
              <span className="font-semibold">{leadStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">New</span>
              <span className="font-semibold text-blue-600">{leadStats.new}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Contacted</span>
              <span className="font-semibold text-purple-600">{leadStats.contacted}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Trial Scheduled</span>
              <span className="font-semibold text-yellow-600">{leadStats.trialScheduled}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Enrolled</span>
              <span className="font-semibold text-green-600">{leadStats.enrolled}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Lost</span>
              <span className="font-semibold text-red-600">{leadStats.lost}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-medium">Conversion Rate</span>
              <span className="font-semibold text-lg">{conversionRate}%</span>
            </div>
          </div>
        </Card>

        {/* Campaign Summary */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Campaign Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Campaigns</span>
              <span className="font-semibold">{campaignStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Running</span>
              <span className="font-semibold text-blue-600">{campaignStats.running}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Completed</span>
              <span className="font-semibold text-green-600">{campaignStats.completed}</span>
            </div>
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-sm font-medium">Total Budget</span>
              <span className="font-semibold text-lg">
                ${campaignStats.totalBudget.toFixed(2)}
              </span>
            </div>
            {campaignStats.running > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Avg Budget per Campaign</span>
                <span className="font-semibold">
                  ${(campaignStats.totalBudget / campaignStats.total).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
