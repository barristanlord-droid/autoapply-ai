"use client";

import { useQuery } from "@tanstack/react-query";
import { applicationsAPI } from "@/lib/api";
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Building2,
  Target,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  draft: "#9ca3af",
  queued: "#eab308",
  ready: "#3b82f6",
  submitted: "#6366f1",
  viewed: "#a855f7",
  interview: "#10b981",
  rejected: "#ef4444",
  offer: "#22c55e",
  accepted: "#16a34a",
  withdrawn: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  queued: "Queued",
  ready: "Ready",
  submitted: "Applied",
  viewed: "Viewed",
  interview: "Interview",
  rejected: "Rejected",
  offer: "Offer",
  accepted: "Accepted",
  withdrawn: "Withdrawn",
};

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => applicationsAPI.analytics().then((r) => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => applicationsAPI.dashboard().then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">Analytics</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Loading your data...</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-64 animate-pulse bg-gray-50 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  const totalApps = stats?.total_applications || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100">Analytics</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track your job search progress and trends
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalApps}</div>
          <div className="text-xs text-gray-400 dark:text-gray-500">applications</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">This Week</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.applications_this_week || 0}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">new applications</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-purple-600" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Interview</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {stats?.interview_rate || 0}%
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">conversion rate</div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Companies</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {analytics?.top_companies?.length || 0}
          </div>
          <div className="text-xs text-gray-400 dark:text-gray-500">applied to</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Weekly Applications
            </h2>
          </div>
          {analytics?.weekly_trend?.some((w: any) => w.applications > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.weekly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #f0f0f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar
                  dataKey="applications"
                  fill="#6366f1"
                  radius={[6, 6, 0, 0]}
                  name="Applications"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              No application data yet
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Status Breakdown
            </h2>
          </div>
          {analytics?.status_breakdown?.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={analytics.status_breakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                  >
                    {analytics.status_breakdown.map((entry: any, idx: number) => (
                      <Cell
                        key={idx}
                        fill={STATUS_COLORS[entry.status] || "#9ca3af"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      STATUS_LABELS[name] || name,
                    ]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f0f0f0",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {analytics.status_breakdown.map((entry: any) => (
                  <div key={entry.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            STATUS_COLORS[entry.status] || "#9ca3af",
                        }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {STATUS_LABELS[entry.status] || entry.status}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                      {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              No status data yet
            </div>
          )}
        </div>

        {/* Daily Activity */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              30-Day Activity
            </h2>
          </div>
          {analytics?.daily_activity?.some((d: any) => d.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.daily_activity}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  interval={4}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #f0f0f0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorActivity)"
                  name="Applications"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              No activity data yet
            </div>
          )}
        </div>

        {/* Top Companies */}
        <div className="card">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Top Companies
            </h2>
          </div>
          {analytics?.top_companies?.length > 0 ? (
            <div className="space-y-3">
              {analytics.top_companies.map((company: any, idx: number) => {
                const maxCount = analytics.top_companies[0].count;
                const percent = (company.count / maxCount) * 100;
                return (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mr-4">
                        {company.company}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 shrink-0">
                        {company.count} app{company.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              Apply to jobs to see company breakdown
            </div>
          )}
        </div>

        {/* Match Score Distribution */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-5 h-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Match Score Distribution
            </h2>
          </div>
          {analytics?.score_distribution?.some((s: any) => s.count > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={analytics.score_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="range"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #f0f0f0",
                  }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} name="Applications">
                  {analytics.score_distribution.map((_: any, idx: number) => (
                    <Cell
                      key={idx}
                      fill={["#ef4444", "#f59e0b", "#6366f1", "#10b981"][idx]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
              No match score data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
