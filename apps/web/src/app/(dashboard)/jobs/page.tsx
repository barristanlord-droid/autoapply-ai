"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { jobsAPI, applicationsAPI } from "@/lib/api";
import {
  Search,
  MapPin,
  Building2,
  Clock,
  DollarSign,
  Heart,
  X,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Globe,
  Send,
  Bookmark,
  BookmarkCheck,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import ApplyPreviewModal from "@/components/ApplyPreviewModal";

export default function JobsPage() {
  const [view, setView] = useState<"feed" | "search" | "saved">("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewJob, setPreviewJob] = useState<any>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    is_remote: undefined as boolean | undefined,
    job_type: "",
    experience_level: "",
  });
  const queryClient = useQueryClient();

  // Check URL for ?id= param (from dashboard links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("id");
    if (jobId) {
      setSelectedJobId(jobId);
    }
  }, []);

  // Swipe feed
  const { data: feedJobs, isLoading: feedLoading } = useQuery({
    queryKey: ["job-feed"],
    queryFn: () => jobsAPI.feed(10).then((r) => r.data),
    enabled: view === "feed",
  });

  // Search results
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ["job-search", searchQuery, filters],
    queryFn: () =>
      jobsAPI.search({ query: searchQuery, ...filters }).then((r) => r.data),
    enabled: view === "search" && searchQuery.length > 0,
  });

  // Saved jobs
  const { data: savedJobs, isLoading: savedLoading } = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: () => jobsAPI.saved().then((r) => r.data),
    enabled: view === "saved",
  });

  // Job detail
  const { data: jobDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["job-detail", selectedJobId],
    queryFn: () => jobsAPI.detail(selectedJobId!).then((r) => r.data),
    enabled: !!selectedJobId,
  });

  // Swipe action
  const swipeMutation = useMutation({
    mutationFn: (data: { job_id: string; action: string }) => jobsAPI.swipe(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["job-feed"] }),
  });

  // Quick apply
  const applyMutation = useMutation({
    mutationFn: (jobId: string) =>
      applicationsAPI.create({ job_id: jobId, auto_generate_materials: true }),
    onSuccess: () => {
      toast.success("Application started! AI is preparing your materials.");
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["job-detail", selectedJobId] });
      setPreviewJob(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to apply");
      setPreviewJob(null);
    },
  });

  // Bookmark toggle
  const bookmarkMutation = useMutation({
    mutationFn: (data: { job_id: string; action: "saved" | "liked" }) =>
      jobsAPI.swipe(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["job-detail", selectedJobId] });
      queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      toast.success(
        variables.action === "saved" ? "Job saved!" : "Bookmark removed"
      );
    },
  });

  const handleSwipe = (jobId: string, action: "liked" | "disliked") => {
    swipeMutation.mutate({ job_id: jobId, action });
    if (action === "liked") {
      applyMutation.mutate(jobId);
    }
  };

  const currentJob = feedJobs?.[0];

  // ── Job Detail Panel ──
  if (selectedJobId) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => {
            setSelectedJobId(null);
            // Clean URL param
            window.history.replaceState({}, "", "/jobs");
          }}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to jobs
        </button>

        {detailLoading ? (
          <div className="card text-center py-16 text-gray-400 dark:text-gray-500">
            Loading job details...
          </div>
        ) : jobDetail ? (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    {jobDetail.company_logo_url ? (
                      <img
                        src={jobDetail.company_logo_url}
                        alt={jobDetail.company_name}
                        className="w-14 h-14 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {jobDetail.title}
                      </h1>
                      <p className="text-gray-600 dark:text-gray-300 mt-0.5">
                        {jobDetail.company_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {jobDetail.location || "Remote"}
                        </span>
                        {jobDetail.job_type && (
                          <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="capitalize">{jobDetail.job_type}</span>
                          </span>
                        )}
                        {jobDetail.posted_at && (
                          <span className="text-xs text-gray-400">
                            Posted {new Date(jobDetail.posted_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {jobDetail.match_score && (
                    <div className="badge-success text-sm shrink-0">
                      {jobDetail.match_score}% match
                    </div>
                  )}
                </div>

                {/* Quick Info Badges */}
                <div className="flex flex-wrap gap-2">
                  {jobDetail.is_remote && (
                    <span className="badge-info">Remote</span>
                  )}
                  {jobDetail.experience_level && (
                    <span className="badge bg-purple-50 text-purple-700 capitalize">
                      {jobDetail.experience_level} level
                    </span>
                  )}
                  {jobDetail.visa_sponsorship && (
                    <span className="badge bg-green-50 text-green-700">
                      <Globe className="w-3 h-3 inline mr-1" />
                      Visa Sponsorship
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Job Description
                </h2>
                <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {jobDetail.description || "No description available."}
                </div>
              </div>

              {/* Requirements */}
              {(jobDetail.min_years_experience || jobDetail.education_requirement) && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Requirements
                  </h2>
                  <div className="space-y-3">
                    {jobDetail.min_years_experience && (
                      <div className="flex items-center gap-3">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {jobDetail.min_years_experience}+ years of experience
                        </span>
                      </div>
                    )}
                    {jobDetail.education_requirement && (
                      <div className="flex items-center gap-3">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700 capitalize">
                          {jobDetail.education_requirement}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Apply Card */}
              <div className="card border-brand-100 bg-brand-50/30">
                {jobDetail.application_status ? (
                  <div className="text-center py-2">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Send className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="font-semibold text-gray-900">Already Applied</p>
                    <p className="text-sm text-gray-500 mt-1 capitalize">
                      Status: {jobDetail.application_status}
                    </p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        setPreviewJob({
                          id: jobDetail.id,
                          title: jobDetail.title,
                          company_name: jobDetail.company_name,
                          location: jobDetail.location,
                          match_score: jobDetail.match_score,
                        })
                      }
                      disabled={applyMutation.isPending}
                      className="btn-primary w-full mb-3 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {applyMutation.isPending ? "Applying..." : "Quick Apply with AI"}
                    </button>
                    <p className="text-xs text-gray-500 text-center">
                      AI will generate a tailored cover letter and resume
                    </p>
                  </>
                )}

                {jobDetail.apply_url && (
                  <a
                    href={jobDetail.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary w-full mt-3 flex items-center justify-center gap-2 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Apply on Company Site
                  </a>
                )}

                {/* Bookmark Button */}
                <button
                  onClick={() =>
                    bookmarkMutation.mutate({
                      job_id: jobDetail.id,
                      action: jobDetail.is_saved ? "liked" : "saved",
                    })
                  }
                  disabled={bookmarkMutation.isPending}
                  className={`w-full mt-3 flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl transition-colors ${
                    jobDetail.is_saved
                      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {jobDetail.is_saved ? (
                    <>
                      <BookmarkCheck className="w-4 h-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4" />
                      Save for Later
                    </>
                  )}
                </button>
              </div>

              {/* Salary */}
              {jobDetail.salary_min && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Compensation
                  </h3>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="text-lg font-bold text-gray-900">
                      {jobDetail.salary_currency || "$"}
                      {(jobDetail.salary_min / 1000).toFixed(0)}k
                      {jobDetail.salary_max && (
                        <> - {(jobDetail.salary_max / 1000).toFixed(0)}k</>
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">per year</p>
                </div>
              )}

              {/* Required Skills */}
              {jobDetail.required_skills?.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {jobDetail.required_skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-brand-50 text-brand-700 rounded-lg text-xs font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferred Skills */}
              {jobDetail.preferred_skills?.length > 0 && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Nice to Have
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {jobDetail.preferred_skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Info */}
              {jobDetail.source && (
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    Source
                  </h3>
                  <p className="text-sm text-gray-500 capitalize">{jobDetail.source}</p>
                  {jobDetail.source_url && (
                    <a
                      href={jobDetail.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-600 hover:text-brand-700 mt-1 inline-flex items-center gap-1"
                    >
                      View original <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="card text-center py-16">
            <p className="text-gray-400">Job not found</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 mt-1">
            {view === "feed"
              ? "Swipe through matched jobs"
              : view === "saved"
              ? "Your bookmarked jobs"
              : "Search all jobs"}
          </p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setView("feed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "feed" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            <Sparkles className="w-4 h-4 inline mr-1" />
            Feed
          </button>
          <button
            onClick={() => setView("search")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "search" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            <Search className="w-4 h-4 inline mr-1" />
            Search
          </button>
          <button
            onClick={() => setView("saved")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              view === "saved" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            <Bookmark className="w-4 h-4 inline mr-1" />
            Saved
          </button>
        </div>
      </div>

      {/* Search View */}
      {view === "search" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Job title, company, or keywords..."
              className="input-field !pl-12"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setFilters({ ...filters, is_remote: filters.is_remote ? undefined : true })
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                filters.is_remote
                  ? "bg-brand-50 border-brand-200 text-brand-700"
                  : "border-gray-200 text-gray-600"
              }`}
            >
              Remote Only
            </button>
            {["full-time", "part-time", "contract", "internship"].map((type) => (
              <button
                key={type}
                onClick={() =>
                  setFilters({
                    ...filters,
                    job_type: filters.job_type === type ? "" : type,
                  })
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                  filters.job_type === type
                    ? "bg-brand-50 border-brand-200 text-brand-700"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                {type}
              </button>
            ))}
            <span className="w-px h-6 bg-gray-200" />
            {["entry", "mid", "senior", "lead"].map((level) => (
              <button
                key={level}
                onClick={() =>
                  setFilters({
                    ...filters,
                    experience_level: filters.experience_level === level ? "" : level,
                  })
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
                  filters.experience_level === level
                    ? "bg-purple-50 border-purple-200 text-purple-700"
                    : "border-gray-200 text-gray-600"
                }`}
              >
                {level}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-3">
            {searchLoading && (
              <div className="text-center py-12 text-gray-400">Searching...</div>
            )}
            {searchResults?.jobs?.map((job: any) => (
              <div
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className="card cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {job.company_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location || "Remote"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {job.is_remote && <span className="badge-info">Remote</span>}
                      {job.job_type && (
                        <span className="badge bg-gray-50 text-gray-600 capitalize">
                          {job.job_type}
                        </span>
                      )}
                      {job.salary_min && (
                        <span className="text-xs text-gray-500">
                          ${(job.salary_min / 1000).toFixed(0)}k-${(job.salary_max / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {job.match_score && (
                      <div className="badge-success">{job.match_score}%</div>
                    )}
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved View */}
      {view === "saved" && (
        <div className="space-y-3">
          {savedLoading ? (
            <div className="text-center py-12 text-gray-400">Loading saved jobs...</div>
          ) : savedJobs?.length > 0 ? (
            savedJobs.map((job: any) => (
              <div
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className="card cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {job.company_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location || "Remote"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {job.is_remote && <span className="badge-info">Remote</span>}
                      {job.job_type && (
                        <span className="badge bg-gray-50 text-gray-600 capitalize">
                          {job.job_type}
                        </span>
                      )}
                      {job.salary_min && (
                        <span className="text-xs text-gray-500">
                          ${(job.salary_min / 1000).toFixed(0)}k-${(job.salary_max / 1000).toFixed(0)}k
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <BookmarkCheck className="w-4 h-4 text-amber-500" />
                    {job.match_score && (
                      <div className="badge-success">{job.match_score}%</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card text-center py-16">
              <Bookmark className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No saved jobs yet
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Bookmark jobs you&apos;re interested in to review later
              </p>
              <button
                onClick={() => setView("feed")}
                className="btn-primary text-sm"
              >
                Browse Jobs
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feed View (Swipe Interface) */}
      {view === "feed" && (
        <div className="flex flex-col items-center">
          {feedLoading ? (
            <div className="py-20 text-gray-400">Loading matches...</div>
          ) : currentJob ? (
            <div className="w-full max-w-md">
              {/* Job Card */}
              <div className="card relative overflow-hidden">
                {currentJob.match_score && (
                  <div className="absolute top-4 right-4 badge-success text-sm">
                    {currentJob.match_score}% match
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{currentJob.title}</h2>
                  <p className="text-gray-600 mt-1">{currentJob.company_name}</p>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    {currentJob.location || "Location not specified"}
                    {currentJob.is_remote && " · Remote"}
                  </div>
                  {currentJob.salary_min && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <DollarSign className="w-4 h-4" />
                      {currentJob.salary_currency || "$"}
                      {(currentJob.salary_min / 1000).toFixed(0)}k -{" "}
                      {(currentJob.salary_max / 1000).toFixed(0)}k
                    </div>
                  )}
                  {currentJob.job_type && (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span className="capitalize">{currentJob.job_type}</span>
                    </div>
                  )}
                </div>

                {currentJob.required_skills?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-medium text-gray-500 mb-2">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentJob.required_skills.slice(0, 8).map((skill: string) => (
                        <span
                          key={skill}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Details Link */}
                <button
                  onClick={() => setSelectedJobId(currentJob.id)}
                  className="w-full text-center text-sm text-brand-600 font-medium hover:text-brand-700 mb-4 transition-colors"
                >
                  View Full Details &rarr;
                </button>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleSwipe(currentJob.id, "disliked")}
                    className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleSwipe(currentJob.id, "liked")}
                    className="w-16 h-16 rounded-full bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 transition-colors shadow-lg"
                  >
                    <Heart className="w-7 h-7" />
                  </button>
                </div>
              </div>

              <p className="text-center text-xs text-gray-400 mt-4">
                Swipe right to apply, left to skip
              </p>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-400 mb-4">
                No more jobs in your feed right now
              </p>
              <button
                onClick={() => setView("search")}
                className="btn-primary text-sm"
              >
                Search Jobs
              </button>
            </div>
          )}
        </div>
      )}

      {/* Apply Preview Modal */}
      {previewJob && (
        <ApplyPreviewModal
          job={previewJob}
          onConfirm={() => applyMutation.mutate(previewJob.id)}
          onCancel={() => setPreviewJob(null)}
          isLoading={applyMutation.isPending}
        />
      )}
    </div>
  );
}
