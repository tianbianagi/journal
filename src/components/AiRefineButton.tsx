"use client";

import { useState, useRef } from "react";
import { auth } from "@/lib/firebase";
import ComparisonView from "./ComparisonView";

interface AiRefineButtonProps {
  content: string;
  onAccept: (refined: string, title: string) => void;
}

export default function AiRefineButton({ content, onAccept }: AiRefineButtonProps) {
  const [loading, setLoading] = useState(false);
  const [refined, setRefined] = useState<string | null>(null);
  const [suggestedTitle, setSuggestedTitle] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<{ content: string; refined: string; title: string; feedback: string } | null>(null);

  const handleRefine = async () => {
    if (!content.trim() || loading) return;

    if (cacheRef.current && cacheRef.current.content === content) {
      setRefined(cacheRef.current.refined);
      setSuggestedTitle(cacheRef.current.title);
      setFeedback(cacheRef.current.feedback);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await auth().currentUser?.getIdToken();
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Refinement failed (${res.status})`);
      setRefined(data.refined);
      setSuggestedTitle(data.title || "");
      setFeedback(data.feedback || "");
      cacheRef.current = { content, refined: data.refined, title: data.title || "", feedback: data.feedback || "" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to refine. Try again.";
      setError(msg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (refined) {
      onAccept(refined, suggestedTitle);
      setRefined(null);
      setSuggestedTitle("");
      setFeedback("");
    }
  };

  const handleReject = () => {
    setRefined(null);
    setSuggestedTitle("");
    setFeedback("");
    cacheRef.current = null;
  };

  const handleDismiss = () => {
    setRefined(null);
  };

  return (
    <>
      <button
        onClick={handleRefine}
        disabled={loading || !content.trim()}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        title="Refine with AI"
      >
        {loading ? (
          <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
        )}
        <span>{loading ? "Refining..." : "Refine"}</span>
      </button>

      {error && <span className="text-xs text-red-500 ml-2">{error}</span>}

      {refined && (
        <ComparisonView
          refined={refined}
          feedback={feedback}
          suggestedTitle={suggestedTitle}
          onAccept={handleAccept}
          onReject={handleReject}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
