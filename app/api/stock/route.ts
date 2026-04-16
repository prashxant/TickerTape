// app/api/stock/route.ts
import YahooFinance from "yahoo-finance2";

const yf = new YahooFinance();
const ALLOWED_RANGES = new Set(["1d", "5d", "1mo", "1y"]);

function getPeriod1(range: string): Date {
  const now = Date.now();

  switch (range) {
    case "1d":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "5d":
      return new Date(now - 5 * 24 * 60 * 60 * 1000);
    case "1y":
      return new Date(now - 365 * 24 * 60 * 60 * 1000);
    case "1mo":
    default:
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawSymbol = searchParams.get("symbol")?.trim().toUpperCase();
    const rawRange = searchParams.get("range") || "1mo";
    const range = ALLOWED_RANGES.has(rawRange) ? rawRange : "1mo";

    if (!rawSymbol) {
      return Response.json(
        { error: "symbol query param is required" },
        { status: 400 },
      );
    }

    const symbol = rawSymbol.replace(/\./g, "-");
    const period1 = getPeriod1(range);
    const quotePromise = yf.quote(symbol);
    const chartPromise = yf.chart(symbol, {
      period1,
      interval: range === "1d" ? "5m" : "1d",
      return: "object",
    });
    const summaryPromise = yf
      .quoteSummary(symbol, {
        modules: [
          "assetProfile",
          "financialData",
          "incomeStatementHistory",
          "balanceSheetHistory",
          "cashflowStatementHistory",
        ],
      })
      .catch(() => undefined);

    const [quote, chart, summary] = await Promise.all([
      quotePromise,
      chartPromise,
      summaryPromise,
    ]);

    return Response.json({ quote, chart, summary });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch stock data";
    return Response.json({ error: message }, { status: 500 });
  }
}
