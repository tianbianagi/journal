"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

interface ComparisonViewProps {
  refined: string;
  feedback?: string;
  suggestedTitle?: string;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
}

export default function ComparisonView({
  refined,
  feedback,
  suggestedTitle,
  onAccept,
  onReject,
  onDismiss,
}: ComparisonViewProps) {
  const [mounted, setMounted] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const handleRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dragYRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!handleRef.current?.contains(e.target as Node)) return;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragYRef.current > 100) {
      onDismiss();
    }
    dragYRef.current = 0;
    setDragY(0);
  };

  // Attach touchmove as non-passive so preventDefault works on iOS
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const delta = Math.max(0, e.touches[0].clientY - touchStartY.current);
      dragYRef.current = delta;
      setDragY(delta);
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [mounted]);

  const handleCopy = async (html: string, section: string) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    await navigator.clipboard.writeText(tmp.textContent || "");
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const modal = (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget && window.innerWidth >= 640) onDismiss(); }}>
      <div
        ref={modalRef}
        className="bg-white w-full max-w-5xl max-h-[90vh] rounded-t-2xl sm:rounded-2xl overflow-hidden flex flex-col"
        style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined, transition: isDragging.current ? "none" : "transform 0.2s ease-out" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div ref={handleRef} className="sm:hidden flex justify-center pt-2 pb-3 cursor-grab">
          <div className="w-10 h-1 rounded-full bg-neutral-300" />
        </div>
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

        <div className="flex-1 overflow-auto">
          <div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-emerald-500 uppercase tracking-wider">
                  Refined
                </span>
                <button
                  onClick={() => handleCopy(refined, "refined")}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-emerald-500 hover:text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
                >
                  {copiedSection === "refined" ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div
                className="prose prose-neutral prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: refined }}
              />
            </div>
          </div>
          {feedback && (
            <div className="p-4 border-t border-neutral-100 bg-violet-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-violet-500 uppercase tracking-wider">
                  Therapist Feedback
                </span>
                <button
                  onClick={() => handleCopy(feedback!, "feedback")}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-violet-500 hover:text-violet-700 hover:bg-violet-100 rounded transition-colors"
                >
                  {copiedSection === "feedback" ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div
                className="prose prose-neutral prose-sm max-w-none text-neutral-700"
                dangerouslySetInnerHTML={{ __html: feedback }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
