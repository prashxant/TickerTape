"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { StockListItem } from "@/lib/types";
import StockTable from "@/components/StockTable";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
    return res.json();
  });

const DEFAULT_SECTOR_OPTIONS = [
  "Technology",
  "Financial Services",
  "Banking",
  "Healthcare",
  "Energy",
  "Consumer Goods",
  "Industrials",
];

type SortBy =
  | "marketCap"
  | "price"
  | "change"
  | "pe"
  | "dividendYield"
  | "volume"
  | "symbol";

type SortDir = "asc" | "desc";

interface ScreenerFilters {
  sectors: string[];
  priceMin: string;
  priceMax: string;
  changeMin: string;
  changeMax: string;
  peMin: string;
  peMax: string;
  marketCapMin: string;
  marketCapMax: string;
  priceToBookMin: string;
  priceToBookMax: string;
  roeMin: string;
  roeMax: string;
  roaMin: string;
  roaMax: string;
  profitMarginMin: string;
  profitMarginMax: string;
  revenueGrowthMin: string;
  revenueGrowthMax: string;
  earningsGrowthMin: string;
  earningsGrowthMax: string;
  dividendYieldMin: string;
  dividendYieldMax: string;
  dividendPayer: "all" | "true" | "false";
  averageVolumeMin: string;
  averageVolumeMax: string;
  volumeMin: string;
  volumeMax: string;
}

const EMPTY_FILTERS: ScreenerFilters = {
  sectors: [],
  priceMin: "",
  priceMax: "",
  changeMin: "",
  changeMax: "",
  peMin: "",
  peMax: "",
  marketCapMin: "",
  marketCapMax: "",
  priceToBookMin: "",
  priceToBookMax: "",
  roeMin: "",
  roeMax: "",
  roaMin: "",
  roaMax: "",
  profitMarginMin: "",
  profitMarginMax: "",
  revenueGrowthMin: "",
  revenueGrowthMax: "",
  earningsGrowthMin: "",
  earningsGrowthMax: "",
  dividendYieldMin: "",
  dividendYieldMax: "",
  dividendPayer: "all",
  averageVolumeMin: "",
  averageVolumeMax: "",
  volumeMin: "",
  volumeMax: "",
};

interface ScreenerResponse {
  data: StockListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  availableSectors: string[];
}

function buildFilterChips(filters: ScreenerFilters) {
  const chips: Array<{ key: string; label: string }> = [];

  filters.sectors.forEach((sector) => {
    chips.push({ key: `sector:${sector}`, label: `Sector: ${sector}` });
  });

  const ranges: Array<{ key: keyof ScreenerFilters; label: string }> = [
    { key: "priceMin", label: "Price >=" },
    { key: "priceMax", label: "Price <=" },
    { key: "changeMin", label: "Change % >=" },
    { key: "changeMax", label: "Change % <=" },
    { key: "peMin", label: "PE >=" },
    { key: "peMax", label: "PE <=" },
    { key: "marketCapMin", label: "Market Cap >=" },
    { key: "marketCapMax", label: "Market Cap <=" },
    { key: "priceToBookMin", label: "P/B >=" },
    { key: "priceToBookMax", label: "P/B <=" },
    { key: "roeMin", label: "ROE % >=" },
    { key: "roeMax", label: "ROE % <=" },
    { key: "roaMin", label: "ROA % >=" },
    { key: "roaMax", label: "ROA % <=" },
    { key: "profitMarginMin", label: "Profit Margin % >=" },
    { key: "profitMarginMax", label: "Profit Margin % <=" },
    { key: "revenueGrowthMin", label: "Revenue Growth % >=" },
    { key: "revenueGrowthMax", label: "Revenue Growth % <=" },
    { key: "earningsGrowthMin", label: "Earnings Growth % >=" },
    { key: "earningsGrowthMax", label: "Earnings Growth % <=" },
    { key: "dividendYieldMin", label: "Dividend Yield % >=" },
    { key: "dividendYieldMax", label: "Dividend Yield % <=" },
    { key: "averageVolumeMin", label: "Avg Volume >=" },
    { key: "averageVolumeMax", label: "Avg Volume <=" },
    { key: "volumeMin", label: "Volume >=" },
    { key: "volumeMax", label: "Volume <=" },
  ];

  ranges.forEach((range) => {
    const value = filters[range.key];
    if (typeof value === "string" && value.trim()) {
      chips.push({
        key: range.key,
        label: `${range.label} ${value}`,
      });
    }
  });

  if (filters.dividendPayer === "true") {
    chips.push({ key: "dividendPayer", label: "Dividend paying only" });
  }
  if (filters.dividendPayer === "false") {
    chips.push({ key: "dividendPayer", label: "Non-dividend only" });
  }

  return chips;
}

function NumericInput({
  label,
  value,
  onChange,
  placeholder,
  step = "any",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  step?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        step={step}
        placeholder={placeholder}
        className="rounded-xl border border-line bg-white/80 px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
      />
    </label>
  );
}

export default function FilterPage() {
  const router = useRouter();
  const [draftFilters, setDraftFilters] =
    useState<ScreenerFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<ScreenerFilters>(EMPTY_FILTERS);
  const [sortBy, setSortBy] = useState<SortBy>("marketCap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);

  const activeChips = useMemo(
    () => buildFilterChips(appliedFilters),
    [appliedFilters],
  );

  const filterSummary =
    activeChips.length === 0
      ? "Showing all companies. Add filters and click Apply Filters."
      : `${activeChips.length} active filter${activeChips.length > 1 ? "s" : ""}`;

  const endpoint = useMemo(() => {
    const params = new URLSearchParams();
    if (appliedFilters.sectors.length > 0) {
      params.set("sectors", appliedFilters.sectors.join(","));
    }
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (key === "sectors" || key === "dividendPayer") return;
      if (typeof value === "string" && value.trim() !== "") {
        params.set(key, value.trim());
      }
    });
    if (appliedFilters.dividendPayer !== "all") {
      params.set("dividendPayer", appliedFilters.dividendPayer);
    }
    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", String(page));
    params.set("limit", String(limit));
    return `/api/screener?${params.toString()}`;
  }, [appliedFilters, sortBy, sortDir, page, limit]);

  const { data, error: swrError, isLoading: loading } = useSWR<ScreenerResponse>(
    endpoint,
    fetcher,
    { keepPreviousData: true }
  );

  const stocks = data?.data || [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 1;
  const availableSectors = data?.availableSectors || [];
  const error = swrError instanceof Error ? swrError.message : swrError ? String(swrError) : null;

  const displaySectors =
    availableSectors.length > 0 ? availableSectors : DEFAULT_SECTOR_OPTIONS;

  const updateDraft = <K extends keyof ScreenerFilters>(
    key: K,
    value: ScreenerFilters[K],
  ) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSector = (sector: string) => {
    const next = draftFilters.sectors.includes(sector)
      ? draftFilters.sectors.filter((item) => item !== sector)
      : [...draftFilters.sectors, sector];

    updateDraft("sectors", next);
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setPage(1);
  };

  const resetFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setPage(1);
  };

  const removeFilterChip = (chipKey: string) => {
    if (chipKey.startsWith("sector:")) {
      const sector = chipKey.replace("sector:", "");
      setDraftFilters((prev) => ({
        ...prev,
        sectors: prev.sectors.filter((item) => item !== sector),
      }));
      setAppliedFilters((prev) => ({
        ...prev,
        sectors: prev.sectors.filter((item) => item !== sector),
      }));
      setPage(1);
      return;
    }

    if (chipKey === "dividendPayer") {
      setDraftFilters((prev) => ({ ...prev, dividendPayer: "all" }));
      setAppliedFilters((prev) => ({ ...prev, dividendPayer: "all" }));
      setPage(1);
      return;
    }

    setDraftFilters((prev) => ({
      ...prev,
      [chipKey]: "",
    }));
    setAppliedFilters((prev) => ({
      ...prev,
      [chipKey]: "",
    }));
    setPage(1);
  };

  const goToPreviousPage = () => setPage((prev) => Math.max(1, prev - 1));
  const goToNextPage = () => setPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <main className="page-shell ">
      <section className="hero-card  p-5 sm:p-8 fade-in">
        <div className="flex flex-col gap-5 sm:gap-8">
          <div className="flex items-center justify-between">
            <h1 className="display-title text-3xl font-medium text-foreground">
              Stock Screener
            </h1>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="btn-ghost px-4 py-2 text-sm relative z-10 cursor-pointer"
            >
              &larr; Back Home
            </button>
          </div>

          <div className="fade-in delay-2 rounded-2xl border border-line bg-white/85 p-4 sm:p-5">
            <div className="mb-4 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">
                  Sector / Category
                </p>
                <div className="grid max-h-42 grid-cols-1 gap-1 overflow-y-auto rounded-xl border border-line bg-white/70 p-3 sm:grid-cols-2">
                  {displaySectors.map((sector) => (
                    <label
                      key={sector}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={draftFilters.sectors.includes(sector)}
                        onChange={() => toggleSector(sector)}
                        className="h-4 w-4 accent-[color:var(--accent)]"
                      />
                      <span>{sector}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] uppercase tracking-[0.14em] text-muted">
                  Dividend Preference
                </p>
                <select
                  value={draftFilters.dividendPayer}
                  onChange={(event) =>
                    updateDraft(
                      "dividendPayer",
                      event.target.value as ScreenerFilters["dividendPayer"],
                    )
                  }
                  className="w-full rounded-xl border border-line bg-white/80 px-3 py-2 text-sm outline-none ring-accent focus:ring-2"
                >
                  <option value="all">All stocks</option>
                  <option value="true">Dividend paying only</option>
                  <option value="false">Non-dividend only</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="space-y-2 rounded-xl border border-line bg-white/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  Price Filters
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <NumericInput
                    label="Price Min"
                    value={draftFilters.priceMin}
                    onChange={(value) => updateDraft("priceMin", value)}
                    placeholder="0"
                  />
                  <NumericInput
                    label="Price Max"
                    value={draftFilters.priceMax}
                    onChange={(value) => updateDraft("priceMax", value)}
                    placeholder="1000"
                  />
                  <NumericInput
                    label="Change % Min"
                    value={draftFilters.changeMin}
                    onChange={(value) => updateDraft("changeMin", value)}
                    placeholder="-5"
                  />
                  <NumericInput
                    label="Change % Max"
                    value={draftFilters.changeMax}
                    onChange={(value) => updateDraft("changeMax", value)}
                    placeholder="5"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-line bg-white/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  Valuation Filters
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <NumericInput
                    label="PE Min"
                    value={draftFilters.peMin}
                    onChange={(value) => updateDraft("peMin", value)}
                    placeholder="0"
                  />
                  <NumericInput
                    label="PE Max"
                    value={draftFilters.peMax}
                    onChange={(value) => updateDraft("peMax", value)}
                    placeholder="25"
                  />
                  <NumericInput
                    label="MCap Min"
                    value={draftFilters.marketCapMin}
                    onChange={(value) => updateDraft("marketCapMin", value)}
                    placeholder="1000000000"
                  />
                  <NumericInput
                    label="MCap Max"
                    value={draftFilters.marketCapMax}
                    onChange={(value) => updateDraft("marketCapMax", value)}
                    placeholder="500000000000"
                  />
                  <NumericInput
                    label="P/B Min"
                    value={draftFilters.priceToBookMin}
                    onChange={(value) => updateDraft("priceToBookMin", value)}
                    placeholder="0"
                  />
                  <NumericInput
                    label="P/B Max"
                    value={draftFilters.priceToBookMax}
                    onChange={(value) => updateDraft("priceToBookMax", value)}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-line bg-white/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  Profitability Filters
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <NumericInput
                    label="ROE % Min"
                    value={draftFilters.roeMin}
                    onChange={(value) => updateDraft("roeMin", value)}
                    placeholder="10"
                  />
                  <NumericInput
                    label="ROE % Max"
                    value={draftFilters.roeMax}
                    onChange={(value) => updateDraft("roeMax", value)}
                    placeholder="40"
                  />
                  <NumericInput
                    label="ROA % Min"
                    value={draftFilters.roaMin}
                    onChange={(value) => updateDraft("roaMin", value)}
                    placeholder="5"
                  />
                  <NumericInput
                    label="ROA % Max"
                    value={draftFilters.roaMax}
                    onChange={(value) => updateDraft("roaMax", value)}
                    placeholder="30"
                  />
                  <NumericInput
                    label="Margin % Min"
                    value={draftFilters.profitMarginMin}
                    onChange={(value) => updateDraft("profitMarginMin", value)}
                    placeholder="5"
                  />
                  <NumericInput
                    label="Margin % Max"
                    value={draftFilters.profitMarginMax}
                    onChange={(value) => updateDraft("profitMarginMax", value)}
                    placeholder="60"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-line bg-white/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  Growth Filters
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <NumericInput
                    label="Revenue % Min"
                    value={draftFilters.revenueGrowthMin}
                    onChange={(value) => updateDraft("revenueGrowthMin", value)}
                    placeholder="0"
                  />
                  <NumericInput
                    label="Revenue % Max"
                    value={draftFilters.revenueGrowthMax}
                    onChange={(value) => updateDraft("revenueGrowthMax", value)}
                    placeholder="100"
                  />
                  <NumericInput
                    label="Earnings % Min"
                    value={draftFilters.earningsGrowthMin}
                    onChange={(value) =>
                      updateDraft("earningsGrowthMin", value)
                    }
                    placeholder="0"
                  />
                  <NumericInput
                    label="Earnings % Max"
                    value={draftFilters.earningsGrowthMax}
                    onChange={(value) =>
                      updateDraft("earningsGrowthMax", value)
                    }
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-line bg-white/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  Dividend Filters
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <NumericInput
                    label="Yield % Min"
                    value={draftFilters.dividendYieldMin}
                    onChange={(value) => updateDraft("dividendYieldMin", value)}
                    placeholder="0"
                  />
                  <NumericInput
                    label="Yield % Max"
                    value={draftFilters.dividendYieldMax}
                    onChange={(value) => updateDraft("dividendYieldMax", value)}
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-line bg-white/70 p-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  Volume & Liquidity
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <NumericInput
                    label="Avg Volume Min"
                    value={draftFilters.averageVolumeMin}
                    onChange={(value) => updateDraft("averageVolumeMin", value)}
                    placeholder="1000000"
                  />
                  <NumericInput
                    label="Avg Volume Max"
                    value={draftFilters.averageVolumeMax}
                    onChange={(value) => updateDraft("averageVolumeMax", value)}
                    placeholder="50000000"
                  />
                  <NumericInput
                    label="Volume Min"
                    value={draftFilters.volumeMin}
                    onChange={(value) => updateDraft("volumeMin", value)}
                    placeholder="500000"
                  />
                  <NumericInput
                    label="Volume Max"
                    value={draftFilters.volumeMax}
                    onChange={(value) => updateDraft("volumeMax", value)}
                    placeholder="100000000"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={applyFilters}
                className="btn-primary px-4 py-2 text-sm"
                disabled={loading}
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="btn-ghost px-4 py-2 text-sm"
                disabled={loading}
              >
                Reset Filters
              </button>

              <p className="text-xs text-muted">{filterSummary}</p>
            </div>

            {activeChips.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => removeFilterChip(chip.key)}
                    className="pill"
                    title="Remove filter"
                  >
                    {chip.label} x
                  </button>
                ))}
              </div>
            ) : null}

            {error ? (
              <p className="mt-3 text-sm text-red-700">Error: {error}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-line bg-white/85 p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {loading
                  ? "Loading screener results..."
                  : `${total.toLocaleString()} matching stocks`}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs uppercase tracking-[0.12em] text-muted">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value as SortBy);
                    setPage(1);
                  }}
                  className="rounded-lg border border-line bg-white px-2 py-1 text-sm"
                >
                  <option value="marketCap">Market Cap</option>
                  <option value="price">Price</option>
                  <option value="change">Change %</option>
                  <option value="pe">PE Ratio</option>
                  <option value="dividendYield">Dividend Yield</option>
                  <option value="volume">Volume</option>
                  <option value="symbol">Symbol</option>
                </select>

                <select
                  value={sortDir}
                  onChange={(event) => {
                    setSortDir(event.target.value as SortDir);
                    setPage(1);
                  }}
                  className="rounded-lg border border-line bg-white px-2 py-1 text-sm"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>

                <select
                  value={limit}
                  onChange={(event) => {
                    setLimit(Number(event.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-line bg-white px-2 py-1 text-sm"
                >
                  <option value={15}>15 / page</option>
                  <option value={30}>30 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-line border-dashed p-6 text-sm text-muted">
                Fetching filtered companies...
              </div>
            ) : (
              <StockTable stocks={stocks} />
            )}

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-muted">
                Page {page} of {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={page <= 1 || loading}
                  className="btn-ghost px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={goToNextPage}
                  disabled={page >= totalPages || loading}
                  className="btn-ghost px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
