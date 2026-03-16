"use client";

import { useState } from "react";
import {
  X,
  Sparkles,
  FileText,
  Mail,
  Zap,
  ChevronDown,
  Loader2,
} from "lucide-react";

interface ApplyPreviewModalProps {
  job: {
    id: string;
    title: string;
    company_name: string;
    location?: string;
    match_score?: number;
  };
  onConfirm: (options: { tone: string }) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function ApplyPreviewModal({
  job,
  onConfirm,
  onCancel,
  isLoading,
}: ApplyPreviewModalProps) {
  const [tone, setTone] = useState("professional");
  const [showTones, setShowTones] = useState(false);

  const tones = [
    { value: "professional", label: "Professional", desc: "Formal & polished" },
    { value: "casual", label: "Casual", desc: "Friendly & conversational" },
    { value: "enthusiastic", label: "Enthusiastic", desc: "High energy & passionate" },
  ];

  const selectedTone = tones.find((t) => t.value === tone)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-50 dark:bg-brand-950 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Apply</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </button>
        </div>

        {/* Job Info */}
        <div className="p-5">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-5">
            <h3 className="font-semibold text-gray-900 dark:text-white">{job.title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{job.company_name}</p>
            <div className="flex items-center gap-3 mt-2">
              {job.location && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{job.location}</span>
              )}
              {job.match_score && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {job.match_score}% match
                </span>
              )}
            </div>
          </div>

          {/* What AI will do */}
          <div className="space-y-3 mb-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              AI will prepare
            </p>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-50 dark:bg-brand-950 rounded-lg flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Tailored Cover Letter
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Customized to match job requirements and your experience
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-50 dark:bg-purple-950/50 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Optimized Resume
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your resume tailored with relevant keywords and highlights
                </p>
              </div>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Cover Letter Tone
            </p>
            <div className="relative">
              <button
                onClick={() => setShowTones(!showTones)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-left bg-white dark:bg-gray-800"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {selectedTone.label}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                    {selectedTone.desc}
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${
                    showTones ? "rotate-180" : ""
                  }`}
                />
              </button>
              {showTones && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg py-1 z-10">
                  {tones.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => {
                        setTone(t.value);
                        setShowTones(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        tone === t.value ? "bg-brand-50/50 dark:bg-brand-950/30" : ""
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t.label}
                      </span>
                      <span className="block text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Credit Info */}
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/50 rounded-xl mb-5">
            <Zap className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs text-amber-700 dark:text-amber-300">
              This will use 1 auto-apply credit
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 p-5 border-t border-gray-100 dark:border-gray-800">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm({ tone })}
            disabled={isLoading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Apply Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
