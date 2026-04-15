"use client";

import { useEffect, useMemo, useState } from "react";

interface NewsItem {
  headline: string;
  url: string;
  source: string;
  image?: string;
  datetime?: number;
  summary?: string;
}

export default function NewsTicker() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/news");
        if (!res.ok) {
          throw new Error(`News request failed with status ${res.status}`);
        }

        const data: NewsItem[] = await res.json();
        setNews(data.filter((item) => item.headline && item.url).slice(0, 12));
      } catch (err) {
        setNews([]);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load latest market news",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchNews();
  }, []);

  const tickerItems = useMemo(() => {
    if (news.length === 0) {
      return [];
    }

    return [...news, ...news];
  }, [news]);

  const formatTime = (epoch?: number) => {
    if (!epoch) {
      return "Live";
    }

    return new Date(epoch * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <section className="news-ribbon surface-block p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="pill !px-2.5 !py-1 text-[10px]">News wire</p>
        <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-muted">
          {loading ? "Syncing feed..." : "Updated every 5 minutes"}
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          Error loading news: {error}
        </p>
      ) : null}

      {!error && !loading && news.length === 0 ? (
        <p className="rounded-lg border border-line/70 bg-white/70 px-3 py-2 text-xs text-muted">
          No headlines available right now.
        </p>
      ) : null}

      {!error && tickerItems.length > 0 ? (
        <div className="ticker-viewport" aria-label="Live market news ticker">
          <div className="ticker-track">
            {tickerItems.map((item, index) => (
              <a
                key={`${item.url}-${index}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="ticker-item"
              >
                <span className="ticker-source">{item.source || "Market"}</span>
                <span className="ticker-headline">{item.headline}</span>
                <span className="ticker-time">{formatTime(item.datetime)}</span>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
