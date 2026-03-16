"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { resumeAPI } from "@/lib/api";
import toast from "react-hot-toast";

type Step = "upload" | "parsing" | "preferences" | "complete";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("upload");
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [preferences, setPreferences] = useState({
    desired_job_titles: [""],
    preferred_locations: [""],
    open_to_remote: true,
    job_type_preferences: ["full-time"],
    requires_visa_sponsorship: false,
  });
  const router = useRouter();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setUploading(true);
    try {
      const { data } = await resumeAPI.upload(file);
      toast.success("Resume uploaded! AI is parsing it...");
      setStep("parsing");

      // Poll for parsing completion
      const pollInterval = setInterval(async () => {
        try {
          const { data: parsed } = await resumeAPI.getParsed(data.id);
          if (parsed.parsed_data) {
            clearInterval(pollInterval);
            setParsedData(parsed.parsed_data);
            setStep("preferences");
            toast.success("Resume parsed successfully!");
          }
        } catch {
          // Still parsing, continue polling
        }
      }, 2000);

      // Timeout after 60s
      setTimeout(() => {
        clearInterval(pollInterval);
        if (step === "parsing") {
          setStep("preferences");
          toast("Parsing is taking longer than expected. You can set preferences now.");
        }
      }, 60000);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [step]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const handleComplete = () => {
    toast.success("You're all set! Let's find your dream job.");
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {["upload", "parsing", "preferences", "complete"].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                ["upload", "parsing", "preferences", "complete"].indexOf(step) >= i
                  ? "bg-brand-600"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            />
          ))}
        </div>

        {/* Step: Upload */}
        {step === "upload" && (
          <div className="card text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload your resume</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Our AI will extract your skills, experience, and strengths automatically.
            </p>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-colors ${
                isDragActive
                  ? "border-brand-500 bg-brand-50 dark:bg-brand-950"
                  : "border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-5xl mb-4">{"\u{1F4C4}"}</div>
              {uploading ? (
                <p className="text-brand-600 dark:text-brand-400 font-medium">Uploading...</p>
              ) : isDragActive ? (
                <p className="text-brand-600 dark:text-brand-400 font-medium">Drop it here!</p>
              ) : (
                <>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Drag & drop your resume here
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    PDF or DOCX, max 10MB
                  </p>
                </>
              )}
            </div>

            <button
              onClick={() => setStep("preferences")}
              className="text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mt-6"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* Step: Parsing */}
        {step === "parsing" && (
          <div className="card text-center">
            <div className="animate-pulse">
              <div className="text-5xl mb-4">{"\u{1F9E0}"}</div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">AI is reading your resume</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Extracting skills, experience, education...
              </p>
              <div className="mt-8 flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 bg-brand-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step: Preferences */}
        {step === "preferences" && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              What are you looking for?
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
              Help us find the best matches for you.
            </p>

            {parsedData && (
              <div className="bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-6">
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  We found: {parsedData.skills?.length || 0} skills,{" "}
                  {parsedData.work_experience?.length || 0} work experiences
                </p>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Desired Job Titles
                </label>
                <input
                  className="input-field"
                  placeholder="e.g., Software Engineer, Product Manager"
                  value={preferences.desired_job_titles[0]}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      desired_job_titles: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Separate multiple titles with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preferred Locations
                </label>
                <input
                  className="input-field"
                  placeholder="e.g., San Francisco, New York, London"
                  value={preferences.preferred_locations[0]}
                  onChange={(e) =>
                    setPreferences({
                      ...preferences,
                      preferred_locations: e.target.value.split(",").map((s) => s.trim()),
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Open to Remote</label>
                <button
                  onClick={() =>
                    setPreferences({ ...preferences, open_to_remote: !preferences.open_to_remote })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.open_to_remote ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      preferences.open_to_remote ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Need Visa Sponsorship</label>
                <button
                  onClick={() =>
                    setPreferences({
                      ...preferences,
                      requires_visa_sponsorship: !preferences.requires_visa_sponsorship,
                    })
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    preferences.requires_visa_sponsorship ? "bg-brand-600" : "bg-gray-200 dark:bg-gray-700"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      preferences.requires_visa_sponsorship ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Job Type</label>
                <div className="flex flex-wrap gap-2">
                  {["full-time", "part-time", "contract", "internship"].map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        const current = preferences.job_type_preferences;
                        const updated = current.includes(type)
                          ? current.filter((t) => t !== type)
                          : [...current, type];
                        setPreferences({ ...preferences, job_type_preferences: updated });
                      }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        preferences.job_type_preferences.includes(type)
                          ? "bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-700"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-transparent"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleComplete} className="btn-primary w-full mt-8">
              Find My Jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
