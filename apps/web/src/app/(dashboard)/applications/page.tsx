"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { applicationsAPI, aiAPI } from "@/lib/api";
import {
  FileText,
  MoreVertical,
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Building2,
  RefreshCw,
  ChevronDown,
  Loader2,
  Pencil,
  Save,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const STATUS_CONFIG: Record<string, { label: string; class: string; dot: string }> = {
  draft: { label: "Draft", class: "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300", dot: "bg-gray-400" },
  queued: { label: "Queued", class: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700", dot: "bg-yellow-500" },
  ready: { label: "Ready", class: "bg-blue-50 dark:bg-blue-900/30 text-blue-700", dot: "bg-blue-500" },
  submitted: { label: "Applied", class: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700", dot: "bg-indigo-500" },
  viewed: { label: "Viewed", class: "bg-purple-50 dark:bg-purple-900/30 text-purple-700", dot: "bg-purple-500" },
  interview: { label: "Interview", class: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", class: "bg-red-50 dark:bg-red-900/30 text-red-600", dot: "bg-red-500" },
  offer: { label: "Offer!", class: "bg-green-50 dark:bg-green-900/20 text-green-700", dot: "bg-green-500" },
  accepted: { label: "Accepted", class: "bg-green-100 dark:bg-green-900/20 text-green-800", dot: "bg-green-600" },
  withdrawn: { label: "Withdrawn", class: "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400", dot: "bg-gray-400" },
};

export default function ApplicationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showToneMenu, setShowToneMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toneRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery({
    queryKey: ["applications", statusFilter],
    queryFn: () =>
      applicationsAPI
        .list({ status: statusFilter || undefined })
        .then((r) => r.data),
  });

  // Application detail
  const { data: appDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["application-detail", selectedAppId],
    queryFn: () => applicationsAPI.detail(selectedAppId!).then((r) => r.data),
    enabled: !!selectedAppId,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      applicationsAPI.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      queryClient.invalidateQueries({ queryKey: ["application-detail", selectedAppId] });
      setOpenMenuId(null);
      toast.success("Status updated");
    },
  });

  // Regenerate cover letter mutation
  const regenerateCoverLetter = useMutation({
    mutationFn: (data: { job_id: string; tone: string }) =>
      aiAPI.generateCoverLetter(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", selectedAppId] });
      setShowToneMenu(false);
      toast.success("Cover letter regenerated!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to regenerate cover letter");
    },
  });

  // Notes editing
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");

  const saveNotes = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      applicationsAPI.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["application-detail", selectedAppId] });
      setEditingNotes(false);
      toast.success("Notes saved");
    },
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
      if (toneRef.current && !toneRef.current.contains(e.target as Node)) {
        setShowToneMenu(false);
      }
    };
    if (openMenuId || showToneMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId, showToneMenu]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // ── Application Detail View ──
  if (selectedAppId) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedAppId(null)}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to applications
        </button>

        {detailLoading ? (
          <div className="card text-center py-16 text-gray-400">
            Loading application details...
          </div>
        ) : appDetail ? (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">
                      {appDetail.job_title || "Job Application"}
                    </h1>
                    <p className="text-gray-600">
                      {appDetail.company_name || "Company"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {appDetail.job_location && (
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3.5 h-3.5" />
                          {appDetail.job_location}
                        </span>
                      )}
                      {appDetail.job_type && (
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="capitalize">{appDetail.job_type}</span>
                        </span>
                      )}
                      {appDetail.job_salary_min && (
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <DollarSign className="w-3.5 h-3.5" />
                          {appDetail.job_salary_currency || "$"}
                          {(appDetail.job_salary_min / 1000).toFixed(0)}k
                          {appDetail.job_salary_max && (
                            <> - {(appDetail.job_salary_max / 1000).toFixed(0)}k</>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`badge ${STATUS_CONFIG[appDetail.status]?.class || STATUS_CONFIG.draft.class}`}>
                    {STATUS_CONFIG[appDetail.status]?.label || appDetail.status}
                  </span>
                  {appDetail.match_score && (
                    <span className="text-xs text-gray-400">
                      {appDetail.match_score}% match
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/jobs?id=${appDetail.job_id}`}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  View Job
                </Link>
                {appDetail.job_apply_url && (
                  <a
                    href={appDetail.job_apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm flex items-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Company Site
                  </a>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  Applied {new Date(appDetail.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Cover Letter */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-brand-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Cover Letter
                      </h2>
                    </div>
                    <div className="flex items-center gap-1">
                      {appDetail.cover_letter && (
                        <button
                          onClick={() => handleCopy(appDetail.cover_letter.content, "cover_letter")}
                          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
                        >
                          {copiedField === "cover_letter" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-500" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                      )}

                      {/* Regenerate with tone selector */}
                      <div className="relative" ref={toneRef}>
                        <button
                          onClick={() => setShowToneMenu(!showToneMenu)}
                          disabled={regenerateCoverLetter.isPending}
                          className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 transition-colors px-2 py-1 rounded-lg hover:bg-brand-50 disabled:opacity-60"
                        >
                          {regenerateCoverLetter.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          {regenerateCoverLetter.isPending ? "Generating..." : "Regenerate"}
                          {!regenerateCoverLetter.isPending && (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                        {showToneMenu && (
                          <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-10 animate-in fade-in slide-in-from-top-1 duration-150">
                            <p className="px-4 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                              Select Tone
                            </p>
                            {[
                              { value: "professional", label: "Professional", desc: "Formal & polished" },
                              { value: "casual", label: "Casual", desc: "Friendly & conversational" },
                              { value: "enthusiastic", label: "Enthusiastic", desc: "High energy & passionate" },
                            ].map((tone) => (
                              <button
                                key={tone.value}
                                onClick={() => {
                                  regenerateCoverLetter.mutate({
                                    job_id: appDetail.job_id,
                                    tone: tone.value,
                                  });
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                              >
                                <span className="text-sm font-medium text-gray-700">
                                  {tone.label}
                                </span>
                                <span className="block text-[10px] text-gray-400 mt-0.5">
                                  {tone.desc}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {appDetail.cover_letter ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full capitalize">
                          {appDetail.cover_letter.tone} tone
                        </span>
                        <span className="text-xs text-gray-400">
                          v{appDetail.cover_letter.version}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {appDetail.cover_letter.content}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        No cover letter generated yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Cover letter will be generated when AI processes this application
                      </p>
                    </div>
                  )}
                </div>

                {/* Tailored Resume */}
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Tailored Resume
                      </h2>
                    </div>
                    {appDetail.tailored_resume && (
                      <button
                        onClick={() => handleCopy(appDetail.tailored_resume.content, "resume")}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
                      >
                        {copiedField === "resume" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {appDetail.tailored_resume ? (
                    <div className="space-y-3">
                      {appDetail.tailored_resume.modifications && (
                        <div className="bg-purple-50 rounded-xl p-4 mb-3">
                          <p className="text-xs font-semibold text-purple-700 mb-2">
                            AI Modifications
                          </p>
                          <ul className="text-xs text-purple-600 space-y-1">
                            {Object.entries(appDetail.tailored_resume.modifications).map(
                              ([key, value]: [string, any]) => (
                                <li key={key} className="flex items-start gap-1.5">
                                  <span className="text-purple-400 mt-0.5">-</span>
                                  <span>
                                    <strong className="capitalize">{key.replace(/_/g, " ")}:</strong>{" "}
                                    {typeof value === "string" ? value : JSON.stringify(value)}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                      <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {appDetail.tailored_resume.content}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <FileText className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">
                        No tailored resume generated yet
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Your resume will be customized when AI processes this application
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar - Timeline & Actions */}
              <div className="space-y-6">
                {/* Status Update */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Update Status
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {["submitted", "interview", "offer", "accepted", "rejected", "withdrawn"].map(
                      (status) => {
                        const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
                        const isCurrent = appDetail.status === status;
                        return (
                          <button
                            key={status}
                            onClick={() => {
                              if (!isCurrent) {
                                updateStatus.mutate({ id: appDetail.id, status });
                              }
                            }}
                            disabled={isCurrent}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                              isCurrent
                                ? `${config.class} ring-2 ring-offset-1 ring-gray-300`
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            {config.label}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {/* Application Timeline */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">
                    Timeline
                  </h3>
                  <div className="space-y-0">
                    {/* Created event */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-2.5 h-2.5 bg-brand-500 rounded-full mt-1.5" />
                        {(appDetail.status_history?.length > 0 || appDetail.submitted_at) && (
                          <div className="w-px flex-1 bg-gray-200 my-1" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-gray-900">
                          Application Created
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(appDetail.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Status history events */}
                    {appDetail.status_history?.map((entry: any, idx: number) => {
                      const entryStatus = entry.to_status || entry.status || "unknown";
                      const config = STATUS_CONFIG[entryStatus] || STATUS_CONFIG.draft;
                      const isLast =
                        idx === appDetail.status_history.length - 1 && !appDetail.submitted_at;
                      return (
                        <div key={idx} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 ${config.dot} rounded-full mt-1.5`} />
                            {!isLast && <div className="w-px flex-1 bg-gray-200 my-1" />}
                          </div>
                          <div className="pb-4">
                            <p className="text-sm font-medium text-gray-900">
                              Status changed to{" "}
                              <span className="capitalize">{config.label}</span>
                            </p>
                            {entry.note && (
                              <p className="text-xs text-gray-500 mt-0.5">{entry.note}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(entry.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Submitted event */}
                    {appDetail.submitted_at && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full mt-1.5" />
                        </div>
                        <div className="pb-1">
                          <p className="text-sm font-medium text-gray-900">
                            Submitted
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(appDetail.submitted_at).toLocaleString()}
                          </p>
                          {appDetail.submission_method && (
                            <p className="text-xs text-gray-500 mt-0.5 capitalize">
                              via {appDetail.submission_method}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Empty timeline */}
                    {!appDetail.status_history?.length && !appDetail.submitted_at && (
                      <p className="text-xs text-gray-400 mt-2">
                        No status updates yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Notes (editable) */}
                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700">Notes</h3>
                    {editingNotes ? (
                      <button
                        onClick={() =>
                          saveNotes.mutate({
                            id: appDetail.id,
                            notes: notesText,
                          })
                        }
                        disabled={saveNotes.isPending}
                        className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 px-2 py-1 rounded-lg hover:bg-brand-50"
                      >
                        <Save className="w-3 h-3" />
                        {saveNotes.isPending ? "Saving..." : "Save"}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setNotesText(appDetail.notes || "");
                          setEditingNotes(true);
                        }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-100"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                    )}
                  </div>
                  {editingNotes ? (
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      placeholder="Add notes about this application..."
                      rows={4}
                      className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                      autoFocus
                    />
                  ) : appDetail.notes ? (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {appDetail.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">
                      No notes yet — click Edit to add some
                    </p>
                  )}
                </div>

                {/* Meta Info */}
                <div className="card">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Details
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Application ID</span>
                      <span className="text-gray-700 font-mono">{appDetail.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span className="text-gray-700">
                        {new Date(appDetail.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Last Updated</span>
                      <span className="text-gray-700">
                        {new Date(appDetail.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    {appDetail.submission_method && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Method</span>
                        <span className="text-gray-700 capitalize">{appDetail.submission_method}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center py-16">
            <p className="text-gray-400">Application not found</p>
          </div>
        )}
      </div>
    );
  }

  // ── Applications List View ──
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-gray-500 mt-1">Track all your job applications</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
            !statusFilter
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === key
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {config.label}
          </button>
        ))}
      </div>

      {/* Application List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : applications?.length > 0 ? (
        <div className="space-y-3">
          {applications.map((app: any) => {
            const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.draft;
            const isMenuOpen = openMenuId === app.id;
            return (
              <div
                key={app.id}
                className="card cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedAppId(app.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {app.job_title || "Job Application"}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {app.company_name || "Company"}
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`badge ${statusConfig.class}`}>
                          {statusConfig.label}
                        </span>
                        {app.match_score && (
                          <span className="text-xs text-gray-400">
                            {app.match_score}% match
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Click-based status update dropdown */}
                  <div
                    className="relative"
                    ref={isMenuOpen ? menuRef : undefined}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setOpenMenuId(isMenuOpen ? null : app.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        isMenuOpen ? "bg-gray-100" : "hover:bg-gray-100"
                      }`}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1 z-10 animate-in fade-in slide-in-from-top-1 duration-150">
                        {["submitted", "interview", "offer", "rejected", "withdrawn"].map(
                          (status) => (
                            <button
                              key={status}
                              onClick={() =>
                                updateStatus.mutate({ id: app.id, status })
                              }
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 capitalize"
                            >
                              Mark as {STATUS_CONFIG[status]?.label || status}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No applications yet
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            Start applying to jobs to track them here
          </p>
        </div>
      )}
    </div>
  );
}
