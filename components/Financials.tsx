"use client";

import type { StockSummary } from "@/lib/types";

interface FinancialsProps {
  summary?: StockSummary;
}

function format(n?: number | null) {
  if (typeof n !== "number") return "-";
  return Intl.NumberFormat("en-IN", {
    notation: "compact",
  }).format(n);
}

export default function Financials({ summary }: FinancialsProps) {
  const income = summary?.incomeStatementHistory?.incomeStatementHistory?.[0];
  const balance = summary?.balanceSheetHistory?.balanceSheetStatements?.[0];
  const cashflow = summary?.cashflowStatementHistory?.cashflowStatements?.[0];

  return (
    <section className="mt-8 rounded-xl border border-line bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Financials</h3>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div>
          <p className="text-sm text-muted">Revenue</p>
          <p className="font-semibold text-foreground">
            {format(income?.totalRevenue)}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted">Net Income</p>
          <p className="font-semibold text-foreground">
            {format(income?.netIncome)}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted">Total Assets</p>
          <p className="font-semibold text-foreground">
            {format(balance?.totalAssets)}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted">Total Liabilities</p>
          <p className="font-semibold text-foreground">
            {format(balance?.totalLiab)}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted">Operating Cash Flow</p>
          <p className="font-semibold text-foreground">
            {format(cashflow?.totalCashFromOperatingActivities)}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted">Free Cash Flow</p>
          <p className="font-semibold text-foreground">
            {format(cashflow?.freeCashFlow)}
          </p>
        </div>
      </div>
    </section>
  );
}
