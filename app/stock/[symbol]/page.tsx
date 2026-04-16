// app/stock/[symbol]/page.tsx
"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";

import dynamic from "next/dynamic";
const Chart = dynamic(() => import("@/components/Chart"), { ssr: false });
import StockDetails from "@/components/StockDetails";
import AboutCompany from "@/components/AboutCompany";
import Financials from "@/components/Financials";
import type { StockApiResponse } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const text = await res.text();
  const payload = text ? (JSON.parse(text) as StockApiResponse | { error?: string }) : null;
  if (!res.ok) {
    const message = payload && typeof payload === "object" && "error" in payload && payload.error
        ? payload.error : `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  if (!payload || !("quote" in payload) || !("chart" in payload)) {
    throw new Error("Unexpected API response");
  }
  return payload;
};

export default function StockPage() {
  const params = useParams<{ symbol?: string | string[] }>();
  const symbolParam = params.symbol;
  const symbol = Array.isArray(symbolParam) ? symbolParam[0] : symbolParam;

  const { data, error: swrError, isLoading: loading } = useSWR<StockApiResponse>(
    symbol ? `/api/stock?symbol=${encodeURIComponent(symbol)}` : null,
    fetcher
  );

  const error = swrError instanceof Error ? swrError.message : swrError ? String(swrError) : null;

  if (error) {
    return (
      <main className="page-shell">
        <div className="surface-block p-6 text-sm text-muted">
          <p className="mb-3">Error: {error}</p>
          <Link href="/" className="btn-ghost inline-flex px-3 py-2 text-xs">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (loading || !data) {
    return (
      <main className="page-shell">
        <div className="surface-block p-6 text-sm text-muted">
          Loading stock profile...
        </div>
      </main>
    );
  }

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

  const compactFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  });

  return (
    <main className="page-shell">
      <section className="hero-card p-5 sm:p-7 fade-in">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/" className="pill">
              {"<-"} Back
            </Link>
            <h1 className="display-title mt-4 text-4xl sm:text-5xl">
              {data.quote.longName || symbol}
            </h1>
            <p className="mt-1 font-mono text-sm text-muted">{symbol}</p>
          </div>

          <div className="surface-block min-w-55 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
              Last Price
            </p>
            <p className="display-title mt-1 text-3xl text-foreground">
              {data.quote.regularMarketPrice == null
                ? "-"
                : formatter.format(data.quote.regularMarketPrice)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="surface-block p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
              PE Ratio
            </p>
            <p className="mt-1 text-xl font-semibold">
              {data.quote.trailingPE == null
                ? "-"
                : data.quote.trailingPE.toFixed(2)}
            </p>
          </div>
          <div className="surface-block p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
              Market Cap
            </p>
            <p className="mt-1 text-xl font-semibold">
              {data.quote.marketCap == null
                ? "-"
                : compactFormatter.format(data.quote.marketCap)}
            </p>
          </div>
          <div className="surface-block p-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
              Data Source
            </p>
            <p className="mt-1 text-xl font-semibold">Yahoo Finance</p>
          </div>
        </div>
        <AboutCompany
          description={data.summary?.assetProfile?.longBusinessSummary}
        />
      </section>

      <section className="mt-6 fade-in delay-2">
        <Chart chart={data.chart} symbol={symbol ?? ""} />
        <StockDetails quote={data.quote} summary={data.summary} />
        <Financials summary={data.summary} />
      </section>
    </main>
  );
}
