// components/StockTable.tsx
import Link from "next/link";
import type { StockListItem } from "@/lib/types";

interface StockTableProps {
  stocks: StockListItem[];
}

export default function StockTable({ stocks }: StockTableProps) {
  const priceFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

  const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  });

  const compactNumberFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  const percentFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  });

  if (stocks.length === 0) {
    return (
      <div className="rounded-2xl border border-line border-dashed p-6 text-center text-sm text-muted">
        No companies match the selected filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white/80">
      <table className="min-w-full text-left">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
            <th className="px-4 py-3 font-medium">Symbol</th>
            <th className="px-4 py-3 font-medium">Sector</th>
            <th className="px-4 py-3 font-medium">Last</th>
            <th className="px-4 py-3 font-medium">Change %</th>
            <th className="px-4 py-3 font-medium">PE</th>
            <th className="px-4 py-3 font-medium">Market Cap</th>
            <th className="px-4 py-3 font-medium">ROE %</th>
            <th className="px-4 py-3 font-medium">Div Yield %</th>
            <th className="px-4 py-3 font-medium">Volume</th>
          </tr>
        </thead>

        <tbody>
          {stocks.map((s) => (
            <tr
              key={s.symbol}
              className="border-b border-(--line)/70 text-sm transition hover:bg-[rgba(16,23,40,0.04)] last:border-b-0"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/stock/${s.symbol}`}
                  className="font-mono font-medium text-foreground"
                >
                  {s.symbol}
                </Link>
                <p className="mt-1 text-xs text-muted">{s.name || "Unknown"}</p>
              </td>
              <td className="px-4 py-3 text-foreground">{s.sector || "-"}</td>
              <td className="px-4 py-3 text-foreground">
                {s.price == null ? "-" : priceFormatter.format(s.price)}
              </td>
              <td className="px-4 py-3 text-foreground">
                {s.priceChangePercent == null
                  ? "-"
                  : `${percentFormatter.format(s.priceChangePercent)}%`}
              </td>
              <td className="px-4 py-3 text-foreground">
                {s.peRatio == null ? "-" : s.peRatio.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-foreground">
                {s.marketCap == null
                  ? "-"
                  : compactCurrencyFormatter.format(s.marketCap)}
              </td>
              <td className="px-4 py-3 text-foreground">
                {s.roe == null ? "-" : `${percentFormatter.format(s.roe)}%`}
              </td>
              <td className="px-4 py-3 text-foreground">
                {s.dividendYield == null
                  ? "-"
                  : `${percentFormatter.format(s.dividendYield)}%`}
              </td>
              <td className="px-4 py-3 text-foreground">
                {s.volume == null
                  ? "-"
                  : compactNumberFormatter.format(s.volume)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
