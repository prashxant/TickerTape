// app/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import FilterChip from "@/components/FilterChip";
import type { StockListItem } from "@/lib/types";
import MarketStatus from "@/components/MarketStatus";
import NewsTicker from "@/components/NewsTicker";

const FILTERS = [
  { key: "pe", label: "PE <= 20", param: "pe", value: "20" },
  {
    key: "marketCap",
    label: "Market Cap >= 1B",
    param: "marketCap",
    value: "1000000000",
  },
  { key: "roe", label: "ROE >= 15%", param: "roe", value: "15" },
  {
    key: "debtEquity",
    label: "Debt/Equity <= 0.5",
    param: "debtEquity",
    value: "0.5",
  },
  {
    key: "dividendYield",
    label: "Dividend Yield >= 2%",
    param: "dividendYield",
    value: "2",
  },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export default function Home() {
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filterSummary = useMemo(() => {
    if (activeFilters.length === 0) {
      return "Showing all companies. Tap filters to narrow results.";
    }

    return `${activeFilters.length} filter${activeFilters.length > 1 ? "s" : ""} active`;
  }, [activeFilters]);

  useEffect(() => {
    const runFilter = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();

        FILTERS.forEach((filter) => {
          if (activeFilters.includes(filter.key)) {
            params.set(filter.param, filter.value);
          }
        });

        const query = params.toString();
        const endpoint = query ? `/api/screener?${query}` : "/api/screener";

        const res = await fetch(endpoint);
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }

        const data: StockListItem[] = await res.json();
        setStocks(data);
      } catch (err) {
        setStocks([]);
        setError(
          err instanceof Error ? err.message : "Failed to load screener data",
        );
      } finally {
        setLoading(false);
      }
    };

    void runFilter();
  }, [activeFilters]);

  const toggleFilter = (key: FilterKey) => {
    setIsFilterMenuOpen(true);
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  };

  return (
    <main className="page-shell ">
      <section className="hero-card  p-5 sm:p-8 fade-in">
        <div className="flex flex-col gap-5 sm:gap-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="pill">Market cockpit</span>
              <h1 className="display-title text-4xl sm:text-6xl text-foreground">
                Tick Ticker
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-muted">
                Scan market leaders, search instantly, and inspect valuation
                signals in one editorial-grade interface.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm text-muted font-mono">
              <div className="surface-block text-center  py-2">
                <p className="text-[10px] uppercase tracking-[0.18em]">
                  Universe
                </p>
                <p className="mt-1  text-base text-foreground">S&P 500</p>
              </div>
              <div className="surface-block px-3 py-2">
                <MarketStatus />
              </div>
            </div>
          </div>

          <div className="fade-in delay-1">
            <SearchBox />
          </div>

          <div className="relative fade-in delay-2">
            <button
              type="button"
              onClick={() => setIsFilterMenuOpen((prev) => !prev)}
              className="btn-primary px-4 py-2 text-sm"
              aria-expanded={isFilterMenuOpen}
              aria-controls="filters-dropdown"
            >
              Filters
            </button>

            {isFilterMenuOpen ? (
              <div
                id="filters-dropdown"
                className="mt-3 w-full rounded-2xl border border-line bg-white p-4 shadow-sm sm:max-w-3xl"
              >
                <div className="mb-3 flex flex-wrap gap-2">
                  {FILTERS.map((filter) => (
                    <FilterChip
                      key={filter.key}
                      label={filter.label}
                      selected={activeFilters.includes(filter.key)}
                      onClick={() => toggleFilter(filter.key)}
                    />
                  ))}
                </div>

                <p className="text-xs text-muted">
                  {loading ? "Filtering..." : filterSummary}
                </p>
                {error ? (
                  <p className="mt-1 text-xs text-red-700">Error: {error}</p>
                ) : null}

                <div className="mt-3 max-h-80 overflow-y-auto rounded-xl border border-line">
                  {stocks.length === 0 ? (
                    <p className="p-4 text-sm text-muted">
                      No companies match the selected filters.
                    </p>
                  ) : (
                    <ul>
                      {stocks.map((stock) => (
                        <li
                          key={stock.symbol}
                          className="border-b border-line last:border-b-0"
                        >
                          <Link
                            href={`/stock/${stock.symbol}`}
                            className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-[rgba(16,23,40,0.04)]"
                          >
                            <span className="font-mono font-semibold text-foreground">
                              {stock.symbol}
                            </span>
                            <span className="text-muted">
                              {stock.name || "Unknown"}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="fade-in delay-3">
            <NewsTicker />
          </div>
        </div>
      </section>
    </main>
  );
}
