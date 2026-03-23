"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

interface ComparisonViewProps {
  original: string;
  refined: string;
  suggestedTitle?: string;
  onAccept: () => void;
  onReject: () => void;
}

export default function ComparisonView({
  original,
  refined,
  suggestedTitle,
  onAccept,
  onReject,
}: ComparisonViewProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const modal = (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h2 className="font-semibold text-sm">AI Refinement</h2>
          <div className="flex gap-2">
            <button
              onClick={onReject}
              className="px-4 py-1.5 text-sm rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={onAccept}
              className="px-4 py-1.5 text-sm rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
            >
              Accept
            </button>
          </div>
        </div>

        {suggestedTitle && (
          <div className="px-4 py-3 border-b border-neutral-100 bg-neutral-50">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Suggested Title</span>
            <p className="text-sm font-semibold mt-1">{suggestedTitle}</p>
          </div>
        )}

        <div className="flex-1 overflow-auto grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100">
          <div className="p-4">
            <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-2 block">
              Original
            </span>
            <div
              className="prose prose-neutral prose-sm max-w-none text-neutral-600"
              dangerouslySetInnerHTML={{ __html: original }}
            />
          </div>
          <div className="p-4">
            <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider mb-2 block">
              Refined
            </span>
            <div
              className="prose prose-neutral prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: refined }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
