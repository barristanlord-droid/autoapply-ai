"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/store";
import { usersAPI, resumeAPI } from "@/lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  CreditCard,
  Bell,
  Shield,
  MapPin,
  Briefcase,
  DollarSign,
  FileText,
  Upload,
  Star,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  const [activeSection, setActiveSection] = useState("profile");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [currentLocation, setCurrentLocation] = useState("");
  const [openToRemote, setOpenToRemote] = useState(true);
  const [desiredJobTitles, setDesiredJobTitles] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [visaSponsorship, setVisaSponsorship] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Resume upload state
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Sync form when user/profile data loads
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
    }
    if (profile) {
      setHeadline(profile.headline || "");
      setSummary(profile.summary || "");
      setCurrentLocation(profile.current_location || "");
      setOpenToRemote(profile.open_to_remote ?? true);
      setDesiredJobTitles(profile.desired_job_titles?.join(", ") || "");
      setSalaryMin(profile.desired_salary_min?.toString() || "");
      setSalaryMax(profile.desired_salary_max?.toString() || "");
      setVisaSponsorship(profile.requires_visa_sponsorship ?? false);
    }
  }, [user, profile]);

  // Fetch resumes
  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumeAPI.list().then((r) => r.data),
    enabled: activeSection === "resume",
  });

  // Upload resume mutation
  const uploadResume = useMutation({
    mutationFn: (file: File) => resumeAPI.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume uploaded! AI is parsing it now.");
      setUploading(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Failed to upload resume");
      setUploading(false);
    },
  });

  // Set primary resume mutation
  const setPrimary = useMutation({
    mutationFn: (id: string) => resumeAPI.setPrimary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Primary resume updated");
    },
    onError: () => {
      toast.error("Failed to set primary resume");
    },
  });

  const handleFileUpload = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOCX file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10MB");
      return;
    }
    setUploading(true);
    uploadResume.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Update user basic info
      if (fullName !== user?.full_name) {
        const { data } = await usersAPI.updateMe({ full_name: fullName });
        setUser(data);
      }

      // Update profile / career preferences
      await usersAPI.updateProfile({
        headline: headline || null,
        summary: summary || null,
        current_location: currentLocation || null,
        open_to_remote: openToRemote,
        desired_job_titles: desiredJobTitles
          ? desiredJobTitles.split(",").map((s: string) => s.trim()).filter(Boolean)
          : null,
        desired_salary_min: salaryMin ? parseInt(salaryMin) : null,
        desired_salary_max: salaryMax ? parseInt(salaryMax) : null,
        requires_visa_sponsorship: visaSponsorship,
      });

      // Refresh store with latest data
      await fetchMe();
      toast.success("Settings saved!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      await usersAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: "profile", label: "Profile", icon: User },
    { id: "resume", label: "Resumes", icon: FileText },
    { id: "career", label: "Career Prefs", icon: Briefcase },
    { id: "subscription", label: "Subscription", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? "bg-brand-50 dark:bg-brand-900/30 text-brand-700"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <section.icon className="w-5 h-5" />
              {section.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === "profile" && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Profile Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    className="input-field"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    className="input-field"
                    value={user?.email || ""}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Headline
                  </label>
                  <input
                    className="input-field"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Summary
                  </label>
                  <textarea
                    className="input-field min-h-[100px]"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Tell employers about yourself..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  className="btn-primary text-sm"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {/* Change Password */}
              <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="input-field"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  className="btn-secondary text-sm"
                  onClick={handleChangePassword}
                  disabled={saving || !currentPassword || !newPassword}
                >
                  Update Password
                </button>
              </div>
            </div>
          )}

          {/* ── Resume Management ── */}
          {activeSection === "resume" && (
            <div className="space-y-6">
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Resume Management
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                  Upload and manage your resumes. Your primary resume is used for AI-powered applications.
                </p>

                {/* Upload Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                    dragOver
                      ? "border-brand-400 bg-brand-50/50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {uploading ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
                      <p className="text-sm text-gray-600">Uploading and parsing...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Drag and drop your resume here
                      </p>
                      <p className="text-xs text-gray-400 mb-3">PDF or DOCX, up to 10MB</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="btn-secondary text-sm"
                      >
                        Browse Files
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                          e.target.value = "";
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Resume List */}
              <div className="card">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  Your Resumes
                </h3>

                {resumesLoading ? (
                  <div className="text-center py-8 text-gray-400">Loading resumes...</div>
                ) : resumes?.length > 0 ? (
                  <div className="space-y-3">
                    {resumes.map((resume: any) => (
                      <div
                        key={resume.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                          resume.is_primary
                            ? "border-brand-200 bg-brand-50/30"
                            : "border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              resume.is_primary
                                ? "bg-brand-100"
                                : "bg-gray-100"
                            }`}
                          >
                            <FileText
                              className={`w-5 h-5 ${
                                resume.is_primary ? "text-brand-600" : "text-gray-400"
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900">
                                {resume.label || resume.filename}
                              </p>
                              {resume.is_primary && (
                                <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-[10px] font-semibold rounded-full">
                                  PRIMARY
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-xs text-gray-400">
                                {resume.file_type?.toUpperCase() || "PDF"}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(resume.created_at).toLocaleDateString()}
                              </span>
                              {resume.is_parsed && (
                                <span className="flex items-center gap-1 text-xs text-green-600">
                                  <Check className="w-3 h-3" />
                                  Parsed
                                </span>
                              )}
                              {!resume.is_parsed && (
                                <span className="flex items-center gap-1 text-xs text-amber-600">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Processing
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!resume.is_primary && (
                            <button
                              onClick={() => setPrimary.mutate(resume.id)}
                              disabled={setPrimary.isPending}
                              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-brand-600"
                              title="Set as primary"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          {resume.is_primary && (
                            <div className="p-2 text-brand-600" title="Primary resume">
                              <Star className="w-4 h-4 fill-current" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm text-gray-400 mb-1">No resumes uploaded yet</p>
                    <p className="text-xs text-gray-400">
                      Upload your resume to enable AI-powered applications
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "career" && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Career Preferences</h2>
              <p className="text-sm text-gray-500">These preferences help us match you with the right jobs.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Current Location
                  </label>
                  <input
                    className="input-field"
                    value={currentLocation}
                    onChange={(e) => setCurrentLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOpenToRemote(!openToRemote)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      openToRemote ? "bg-brand-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        openToRemote ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">Open to remote work</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Briefcase className="w-4 h-4 inline mr-1" />
                    Desired Job Titles
                  </label>
                  <input
                    className="input-field"
                    value={desiredJobTitles}
                    onChange={(e) => setDesiredJobTitles(e.target.value)}
                    placeholder="e.g. Software Engineer, Full Stack Developer"
                  />
                  <p className="text-xs text-gray-400 mt-1">Separate multiple titles with commas</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Min Salary
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      placeholder="80000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Salary
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      placeholder="150000"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setVisaSponsorship(!visaSponsorship)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      visaSponsorship ? "bg-brand-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        visaSponsorship ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-700">Requires visa sponsorship</span>
                </div>
              </div>

              {/* Skills display */}
              {profile?.skills && profile.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s: any) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-brand-50 text-brand-700 text-xs font-medium rounded-full"
                      >
                        {s.skill?.name || "Unknown"}
                        {s.proficiency && (
                          <span className="text-brand-400 text-[10px]">({s.proficiency})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience display */}
              {profile?.work_experiences && profile.work_experiences.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Work Experience</h3>
                  <div className="space-y-3">
                    {profile.work_experiences.map((exp: any) => (
                      <div key={exp.id} className="p-3 bg-gray-50 rounded-xl">
                        <p className="font-medium text-sm text-gray-900">{exp.title}</p>
                        <p className="text-xs text-gray-600">{exp.company} {exp.location ? `· ${exp.location}` : ""}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {exp.start_date} — {exp.is_current ? "Present" : exp.end_date || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                className="btn-primary text-sm"
                onClick={handleSaveProfile}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          )}

          {activeSection === "subscription" && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">
                      {user?.tier || "Free"} Plan
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      5 auto-applies, 20 AI generations per month
                    </p>
                  </div>
                  <button className="btn-primary text-sm">Upgrade</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === "notifications" && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <div className="space-y-4">
                {[
                  { label: "New job matches", desc: "Get notified when new matching jobs are found" },
                  { label: "Application updates", desc: "Status changes on your applications" },
                  { label: "Interview reminders", desc: "Reminders for upcoming interviews" },
                  { label: "Weekly digest", desc: "Weekly summary of your job search activity" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    <button className="relative w-12 h-6 rounded-full bg-brand-600 transition-colors">
                      <div className="absolute top-0.5 right-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === "privacy" && (
            <div className="card space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Privacy & Data</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm font-medium text-gray-900">Download Your Data</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Export all your data including profile, applications, and AI-generated content
                  </p>
                  <button className="btn-secondary text-xs mt-3 !py-2 !px-4">
                    Request Export
                  </button>
                </div>
                <div className="p-4 bg-red-50 rounded-xl">
                  <p className="text-sm font-medium text-red-900">Delete Account</p>
                  <p className="text-xs text-red-600 mt-1">
                    Permanently delete your account and all associated data
                  </p>
                  <button className="text-xs mt-3 py-2 px-4 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
