"use client";

import { useEntries } from "@/lib/hooks";
import EntryCard from "@/components/EntryCard";
import NewEntryFab from "@/components/NewEntryFab";

export default function FeedPage() {
  const { entries, loading } = useEntries();

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-neutral-100 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <img src="/icon.svg" alt="Journal" className="h-8 w-8" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-800 rounded-full animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 text-neutral-400">
            <p className="text-lg mb-1">No entries yet</p>
            <p className="text-sm">Tap + to start writing</p>
          </div>
        ) : (
          <div>
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </main>

      <NewEntryFab />
    </div>
  );
}
