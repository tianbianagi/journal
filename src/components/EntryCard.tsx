"use client";

import { Entry } from "@/types";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { deleteEntry } from "@/lib/hooks";

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
  const [offsetX, setOffsetX] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimeout = useRef<ReturnType<typeof setTimeout>>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const DELETE_THRESHOLD = 80;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const dx = e.touches[0].clientX - touchStartX.current;
      const dy = e.touches[0].clientY - touchStartY.current;
      // If vertical movement is dominant, don't hijack scroll
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dx) < 10) {
        isDragging.current = false;
        return;
      }
      if (dx < 0) {
        e.preventDefault();
        const base = revealed ? -DELETE_THRESHOLD : 0;
        setOffsetX(Math.max(-DELETE_THRESHOLD * 2, Math.min(0, base + dx)));
      }
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [revealed]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    if (offsetX < -DELETE_THRESHOLD) {
      setOffsetX(-DELETE_THRESHOLD);
      setRevealed(true);
    } else {
      setOffsetX(0);
      setRevealed(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteEntry(entry.id);
  };

  const handleDesktopDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      confirmTimeout.current = setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    if (confirmTimeout.current) clearTimeout(confirmTimeout.current);
    setDeleting(true);
    deleteEntry(entry.id);
  };

  const handleCardClick = () => {
    if (revealed) {
      setOffsetX(0);
      setRevealed(false);
    }
  };

  return (
    <div className="relative overflow-hidden border-b border-neutral-100 group/entry">
      {/* Delete button behind */}
      <div className="absolute inset-y-0 right-0 flex items-center">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="h-full w-20 bg-red-500 text-white flex items-center justify-center text-sm font-medium"
        >
          {deleting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Delete"
          )}
        </button>
      </div>

      {/* Swipeable card */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleCardClick}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging.current ? "none" : "transform 0.2s ease-out",
        }}
        className="relative bg-white"
      >
        <Link href={revealed ? "#" : `/editor?id=${entry.id}`} onClick={revealed ? (e) => e.preventDefault() : undefined}>
          <article className="p-4 hover:bg-neutral-50 transition-colors cursor-pointer pr-12 sm:pr-4 group/card">
            <h3 className="font-medium text-base mb-1 truncate">
              {entry.title || "Untitled"}
            </h3>
            <p className="text-sm text-neutral-500 line-clamp-2 mb-2">{preview}</p>
            <time className="text-xs text-neutral-400">
              {formatDate(entry.createdAt as { seconds: number } | null)}
            </time>
          </article>
        </Link>
        <button
          onClick={handleDesktopDelete}
          disabled={deleting}
          className={`hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors ${
            confirmDelete
              ? "bg-red-500 text-white"
              : "text-neutral-300 opacity-0 group-hover/entry:opacity-100 hover:text-red-500 hover:bg-red-50"
          }`}
          title={confirmDelete ? "Tap again to confirm" : "Delete entry"}
        >
          {deleting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
