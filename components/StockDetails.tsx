"use client";

import type { StockQuote, StockSummary } from "@/lib/types";

interface StockDetailsProps {
  quote: StockQuote;
  summary?: StockSummary;
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="rounded-xl border border-line bg-slate-900/95 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatCurrency(value: unknown): string {
  const num = asNumber(value);
  return num == null
    ? "-"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(num);
}

function formatRatio(value: unknown): string {
  const num = asNumber(value);
  return num == null ? "-" : num.toFixed(2);
}

function formatPercent(value: unknown): string {
  const num = asNumber(value);
  return num == null ? "-" : `${(num * 100).toFixed(2)}%`;
}

export default function StockDetails({ quote, summary }: StockDetailsProps) {
  const fd = summary?.financialData;
  const stats = summary?.defaultKeyStatistics;
  const profile = summary?.assetProfile;

  return (
    <section className="mt-6 rounded-2xl border border-line bg-slate-800/95 p-4 sm:p-5">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">
        Stock Fundamentals
      </h3>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="P/E Ratio" value={formatRatio(quote.trailingPE)} />

        <Stat
          label="Price to Book"
          value={formatRatio(quote.priceToBook ?? stats?.priceToBook)}
        />

        <Stat label="Profit Margin" value={formatPercent(fd?.profitMargins)} />

        <Stat label="EBITDA" value={formatCurrency(fd?.ebitda)} />

        <Stat label="Revenue Growth" value={formatPercent(fd?.revenueGrowth)} />
        <Stat
          label="Earnings Growth"
          value={formatPercent(fd?.earningsGrowth)}
        />

        <Stat label="Total Revenue" value={formatCurrency(fd?.totalRevenue)} />
        <Stat label="Total Cash" value={formatCurrency(fd?.totalCash)} />
        <Stat label="Total Debt" value={formatCurrency(fd?.totalDebt)} />

        <Stat
          label="Dividend Yield"
          value={formatPercent(quote.dividendYield)}
        />
        <Stat label="Dividend Rate" value={formatRatio(quote.dividendRate)} />

        <Stat
          label="Day High"
          value={formatCurrency(quote.regularMarketDayHigh)}
        />
        <Stat
          label="Day Low"
          value={formatCurrency(quote.regularMarketDayLow)}
        />
        <Stat label="Open" value={formatCurrency(quote.regularMarketOpen)} />
        <Stat label="52W High" value={formatCurrency(quote.fiftyTwoWeekHigh)} />
        <Stat label="52W Low" value={formatCurrency(quote.fiftyTwoWeekLow)} />

        <Stat label="Sector" value={profile?.sector || "-"} />
        <Stat label="Industry" value={profile?.industry || "-"} />
      </div>
    </section>
  );
}
