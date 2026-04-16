// app/page.tsx
"use client";
import SearchBox from "@/components/SearchBox";
import MarketStatus from "@/components/MarketStatus";
import NewsTicker from "@/components/NewsTicker";
import Link from "next/link";

export default function Home() {
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

          <div className="fade-in delay-2 flex justify-start mt-4">
            <Link 
              href="/filter" 
              className="btn-primary w-full sm:w-auto px-8 py-4 text-base font-semibold inline-block text-center shadow-lg transition-transform hover:scale-105"
            >
              Filter Stocks
            </Link>
          </div>

          <div className="fade-in delay-3">
            <NewsTicker />
          </div>
        </div>
      </section>
    </main>
  );
}
