"use client";

import { Entry } from "@/types";
import Link from "next/link";

function formatDate(timestamp: { seconds: number } | null): string {
  if (!timestamp) return "";
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EntryCard({ entry }: { entry: Entry }) {
  const preview = entry.plainText?.slice(0, 120) || "Empty entry";

  return (
    <Link href={`/editor?id=${entry.id}`}>
      <article className="p-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer">
        <h3 className="font-medium text-base mb-1 truncate">
          {entry.title || "Untitled"}
        </h3>
        <p className="text-sm text-neutral-500 line-clamp-2 mb-2">{preview}</p>
        <time className="text-xs text-neutral-400">
          {formatDate(entry.createdAt as { seconds: number } | null)}
        </time>
      </article>
    </Link>
  );
}
