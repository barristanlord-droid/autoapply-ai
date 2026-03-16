"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsAPI, jobsAPI } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import Link from "next/link";
import {
  TrendingUp,
  Send,
  MessageSquare,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Circle,
  MapPin,
  Zap,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import ApplyPreviewModal from "@/components/ApplyPreviewModal";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [previewJob, setPreviewJob] = useState<any>(null);

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => applicationsAPI.dashboard().then((r) => r.data),
  });

  const { data: matchedJobs } = useQuery({
    queryKey: ["matched-jobs-preview"],
    queryFn: () => jobsAPI.matches({ page: 1 }).then((r) => r.data),
  });

  // Quick apply mutation
  const quickApply = useMutation({
    mutationFn: (jobId: string) =>
      applicationsAPI.create({ job_id: jobId, auto_generate_materials: true }),
    onSuccess: () => {
      toast.success("Applied! AI is preparing your materials.");
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["matched-jobs-preview"] });
      setApplyingJobId(null);
      setPreviewJob(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to apply");
      setApplyingJobId(null);
      setPreviewJob(null);
    },
  });

  const handleQuickApply = (e: React.MouseEvent, job: any) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewJob(job);
  };

  const handleConfirmApply = ({ tone }: { tone: string }) => {
    if (!previewJob) return;
    setApplyingJobId(previewJob.id);
    quickApply.mutate(previewJob.id);
  };

  // Calculate profile completeness
  const completenessSteps = [
    { label: "Basic info", done: !!(user?.full_name && user?.email) },
    { label: "Headline & summary", done: !!(profile?.headline && profile?.summary) },
    { label: "Work experience", done: (profile?.work_experiences?.length || 0) > 0 },
    { label: "Skills", done: (profile?.skills?.length || 0) > 0 },
    { label: "Career preferences", done: !!(profile?.desired_job_titles?.length) },
  ];
  const completedCount = completenessSteps.filter((s) => s.done).length;
  const completenessPercent = Math.round((completedCount / completenessSteps.length) * 100);

  const statCards = [
    {
      label: "Applications",
      value: stats?.total_applications || 0,
      sub: `${stats?.applications_this_week || 0} this week`,
      icon: Send,
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30",
    },
    {
      label: "Interview Rate",
      value: `${stats?.interview_rate || 0}%`,
      sub: "of applications",
      icon: MessageSquare,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30",
    },
    {
      label: "Response Rate",
      value: `${stats?.response_rate || 0}%`,
      sub: "got replies",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30",
    },
    {
      label: "Auto-Apply Credits",
      value: stats?.credits_remaining?.auto_apply || 0,
      sub: "remaining",
      icon: Target,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30",
    },
  ];

  // Get time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = user?.full_name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8">
      {/* Personalized Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {greeting}, {firstName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Your job search at a glance</p>
      </div>

      {/* Profile Completeness */}
      {completenessPercent < 100 && (
        <div className="card bg-gradient-to-r from-brand-50 dark:from-brand-900/30 to-purple-50 dark:to-purple-900/30 border-brand-100">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Complete your profile</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                A complete profile gets {completenessPercent < 60 ? "3x" : "2x"} more job matches
              </p>
            </div>
            <span className="text-sm font-bold text-brand-600">{completenessPercent}%</span>
          </div>
          <div className="w-full bg-white/60 dark:bg-gray-800/60 rounded-full h-2 mb-3">
            <div
              className="bg-brand-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${completenessPercent}%` }}
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {completenessSteps.map((step) => (
              <div key={step.label} className="flex items-center gap-1.5">
                {step.done ? (
                  <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                )}
                <span className={`text-xs ${step.done ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500"}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          {completenessPercent < 100 && (
            <Link
              href="/settings"
              className="inline-block mt-3 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Complete now &rarr;
            </Link>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color} mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/jobs"
          className="card hover:border-brand-200 hover:shadow-md transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/30 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-brand-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">Browse Matched Jobs</h3>
            <p className="text-sm text-gray-500">
              {matchedJobs?.total || 0} jobs matched to your profile
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
        </Link>

        <Link
          href="/chat"
          className="card hover:border-brand-200 hover:shadow-md transition-all group flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">AI Career Coach</h3>
            <p className="text-sm text-gray-500">
              Get advice, prep for interviews, improve your resume
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
        </Link>
      </div>

      {/* Recent Applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Applications</h2>
          <Link href="/applications" className="text-sm text-brand-600 font-medium">
            View all
          </Link>
        </div>

        {stats?.status_breakdown && Object.keys(stats.status_breakdown).length > 0 ? (
          <div className="card">
            <div className="space-y-3">
              {Object.entries(stats.status_breakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        status === "submitted"
                          ? "bg-blue-500"
                          : status === "interview"
                          ? "bg-emerald-500"
                          : status === "offer"
                          ? "bg-purple-500"
                          : status === "rejected"
                          ? "bg-red-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{count as number}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-400 mb-4">No applications yet</p>
            <Link href="/jobs" className="btn-primary inline-block text-sm">
              Start Applying
            </Link>
          </div>
        )}
      </div>

      {/* Top Matches Preview with Quick Apply */}
      {matchedJobs?.jobs?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Top Matches</h2>
            <Link href="/jobs" className="text-sm text-brand-600 font-medium">
              See all
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {matchedJobs.jobs.slice(0, 4).map((job: any) => (
              <div key={job.id} className="card hover:shadow-md transition-shadow">
                <Link href={`/jobs?id=${job.id}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{job.title}</h3>
                      <p className="text-sm text-gray-500">{job.company_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {job.location || "Remote"}
                        </span>
                        {job.is_remote && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                            Remote
                          </span>
                        )}
                      </div>
                    </div>
                    {job.match_score && (
                      <div className="badge-success shrink-0">{job.match_score}%</div>
                    )}
                  </div>
                  {job.salary_min && (
                    <p className="text-xs text-gray-500 mt-2">
                      {job.salary_currency || "$"}
                      {(job.salary_min / 1000).toFixed(0)}k - {(job.salary_max / 1000).toFixed(0)}k
                    </p>
                  )}
                </Link>

                {/* Quick Apply Button */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => handleQuickApply(e, job)}
                    disabled={applyingJobId === job.id}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors disabled:opacity-60"
                  >
                    {applyingJobId === job.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        Quick Apply
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply Preview Modal */}
      {previewJob && (
        <ApplyPreviewModal
          job={previewJob}
          onConfirm={handleConfirmApply}
          onCancel={() => setPreviewJob(null)}
          isLoading={quickApply.isPending}
        />
      )}
    </div>
  );
}
