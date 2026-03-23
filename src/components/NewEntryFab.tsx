"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks";
import { createEntry } from "@/lib/hooks";
import { useState } from "react";

export default function NewEntryFab() {
  const router = useRouter();
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!user || creating) return;
    setCreating(true);
    try {
      const id = await createEntry(user.uid);
      router.push(`/editor?id=${id}`);
    } catch (err) {
      console.error("Failed to create entry:", err);
      setCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreate}
      disabled={creating}
      className="fixed bottom-6 right-6 w-14 h-14 bg-neutral-900 text-white rounded-full shadow-lg hover:bg-neutral-800 active:scale-95 transition-all flex items-center justify-center text-2xl font-light disabled:opacity-50 z-50"
      aria-label="New entry"
    >
      {creating ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        "+"
      )}
    </button>
  );
}
