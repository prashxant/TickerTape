import yahooFinance from "yahoo-finance2";
import { prisma } from "@/lib/prisma";

const yf = new yahooFinance();

type UpdateStocksJobOptions = {
  limit?: number;
  throttleMs?: number;
};

type UpdateStocksJobResult = {
  total: number;
  updated: number;
  failed: string[];
  fatalError?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function updateStocksJob(
  options: UpdateStocksJobOptions = {},
): Promise<UpdateStocksJobResult> {
  const { limit, throttleMs = 0 } = options;

  try {
    const stocks = await prisma.stock.findMany({
      orderBy: { symbol: "asc" },
      ...(typeof limit === "number" && limit > 0 ? { take: limit } : {}),
    });

    let updated = 0;
    const failed: string[] = [];

    for (const stock of stocks) {
      try {
        const data = await yf.quote(stock.symbol);
        const summary = await yf.quoteSummary(stock.symbol, {
          modules: ["financialData"],
        });

        const financialData = summary.financialData;
        const rawRoe = financialData?.returnOnEquity;
        const rawDebtToEquity = financialData?.debtToEquity;
        const rawDividendYield =
          data.dividendYield ?? data.trailingAnnualDividendYield ?? null;

        // Preserve previous DB values when upstream response omits a field.
        await prisma.stock.update({
          where: { symbol: stock.symbol },
          data: {
            price:
              typeof data.regularMarketPrice === "number"
                ? data.regularMarketPrice
                : undefined,
            marketCap:
              typeof data.marketCap === "number" ? data.marketCap : undefined,
            peRatio:
              typeof data.trailingPE === "number" ? data.trailingPE : undefined,
            roe: typeof rawRoe === "number" ? rawRoe * 100 : undefined,
            debtEquity:
              typeof rawDebtToEquity === "number"
                ? rawDebtToEquity / 100
                : undefined,
            dividendYield:
              typeof rawDividendYield === "number"
                ? rawDividendYield * 100
                : undefined,
          },
        });

        updated += 1;
      } catch {
        failed.push(stock.symbol);
      }

      if (throttleMs > 0) {
        await sleep(throttleMs);
      }
    }

    return {
      total: stocks.length,
      updated,
      failed,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown fatal error";
    return {
      total: 0,
      updated: 0,
      failed: [],
      fatalError: message,
    };
  }
}
