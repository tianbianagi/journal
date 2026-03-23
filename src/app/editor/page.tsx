"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEntry, deleteEntry } from "@/lib/hooks";
import Editor, { EditorHandle } from "@/components/Editor";
import AiRefineButton from "@/components/AiRefineButton";
import { useRef, useCallback, useEffect, useState, Suspense } from "react";

function EditorContent() {
  const params = useSearchParams();
  const id = params.get("id");
  const router = useRouter();
  const { entry, loading, save } = useEntry(id || "");
  const [title, setTitle] = useState("");
  const [currentContent, setCurrentContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saving" | "saved" | "unsaved">("saved");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const pendingRef = useRef<{ title?: string; content?: string; plainText?: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const editorRef = useRef<EditorHandle>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!id) router.replace("/");
  }, [id, router]);

  useEffect(() => {
    if (entry && !initialized.current) {
      setTitle(entry.title);
      setCurrentContent(entry.content);
      initialized.current = true;
    }
  }, [entry]);

  const flush = useCallback(async () => {
    if (pendingRef.current) {
      // Don't save if both title and content are empty
      const pendingTitle = pendingRef.current.title ?? title;
      const pendingPlain = pendingRef.current.plainText ?? currentContent.replace(/<[^>]*>/g, "").trim();
      if (!pendingTitle.trim() && !pendingPlain.trim()) {
        return;
      }
      const data = { ...pendingRef.current };
      pendingRef.current = null;
      setSaveStatus("saving");
      await save(data);
      setSaveStatus("saved");
    }
  }, [save, title, currentContent]);

  useEffect(() => {
    timerRef.current = setInterval(flush, 10000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      flush();
    };
  }, [flush]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    pendingRef.current = { ...pendingRef.current, title: val };
    setSaveStatus("unsaved");
  };

  const handleEditorUpdate = (html: string, text: string) => {
    setCurrentContent(html);
    pendingRef.current = { ...pendingRef.current, content: html, plainText: text };
    setSaveStatus("unsaved");
  };

  const handleAiAccept = (refined: string, suggestedTitle: string) => {
    setCurrentContent(refined);
    pendingRef.current = { ...pendingRef.current, content: refined };
    if (suggestedTitle) {
      setTitle(suggestedTitle);
      pendingRef.current = { ...pendingRef.current, title: suggestedTitle };
    }
    setSaveStatus("unsaved");
    editorRef.current?.setContent(refined);
  };

  const handleDelete = async () => {
    if (id) await deleteEntry(id);
    router.replace("/");
  };

  const isEntryEmpty = () => {
    const plainText = currentContent.replace(/<[^>]*>/g, "").trim();
    return !title.trim() && !plainText;
  };

  const handleBack = async () => {
    if (isEntryEmpty()) {
      pendingRef.current = null;
      if (id) await deleteEntry(id);
    } else {
      await flush();
    }
    router.push("/");
  };

  if (!id || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen flex items-center justify-center text-neutral-400">
        Entry not found
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-neutral-100 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs mr-1">
              {saveStatus === "saving" ? (
                <span className="flex items-center gap-1 text-neutral-400">
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving
                </span>
              ) : saveStatus === "saved" ? (
                <span className="flex items-center gap-1 text-neutral-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  Unsaved
                </span>
              )}
            </span>
            <AiRefineButton content={currentContent} onAccept={handleAiAccept} />
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors rounded-lg"
              title="Delete entry"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Title"
          className="w-full text-2xl font-semibold mb-4 focus:outline-none placeholder:text-neutral-300 bg-transparent"
        />
        <Editor ref={editorRef} content={entry.content} onUpdate={handleEditorUpdate} />
      </main>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete entry?</h3>
            <p className="text-sm text-neutral-500 mb-6">
              This action cannot be undone. This entry will be permanently deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EditorPage() {
  return (
    <Suspense>
      <EditorContent />
    </Suspense>
  );
}
