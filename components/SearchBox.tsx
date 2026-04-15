// components/SearchBox.tsx
"use client";
import { useState } from "react";
import Link from "next/link";
import type { SearchResultItem } from "@/lib/types";

export default function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (value: string) => {
    setQuery(value);

    if (!value) return setResults([]);

    setLoading(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const data: SearchResultItem[] = await res.json();
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="surface-block p-3 sm:p-4">
      <label className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-muted font-mono">
        Search by symbol or company
      </label>
      <input
        placeholder="Search stocks..."
        value={query}
        className="w-full rounded-xl border border-line bg-white/90 px-3 py-2.5 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-[rgba(190,116,64,0.24)]"
        onChange={(e) => search(e.target.value)}
      />

      {query && (
        <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-line bg-white/80">
          {loading && (
            <p className="px-3 py-2 text-sm text-muted">Searching...</p>
          )}

          {!loading && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted">No matches found.</p>
          )}

          {!loading &&
            results.map((s) => (
              <Link
                key={s.symbol}
                href={`/stock/${s.symbol}`}
                className="flex items-center justify-between border-b border-line px-3 py-2 text-sm last:border-b-0 hover:bg-[rgba(16,23,40,0.04)]"
              >
                <span className="font-mono text-foreground">{s.symbol}</span>
                <span className="truncate pl-3 text-muted">
                  {s.name || "Unknown"}
                </span>
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}
