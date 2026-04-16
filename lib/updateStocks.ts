import YahooFinance from "yahoo-finance2";
import { prisma } from "@/lib/prisma";

const yf = new YahooFinance();

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

function getNumericField(source: unknown, key: string): number | null {
  if (!source || typeof source !== "object") {
    return null;
  }

  const value = (source as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

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
        const yfSymbol = stock.symbol.replace(/\./g, "-");
        const data = await yf.quote(yfSymbol);
        const summary = await yf.quoteSummary(yfSymbol, {
          modules: ["financialData", "defaultKeyStatistics", "assetProfile"],
        });

        const financialData = summary.financialData;
        const keyStats = summary.defaultKeyStatistics;
        const assetProfile = summary.assetProfile;
        const rawRoe = financialData?.returnOnEquity;
        const rawRoa = financialData?.returnOnAssets;
        const rawProfitMargin = financialData?.profitMargins;
        const rawRevenueGrowth = financialData?.revenueGrowth;
        const rawEarningsGrowth = financialData?.earningsGrowth;
        const rawDebtToEquity = financialData?.debtToEquity;
        const rawDividendYield =
          data.dividendYield ?? data.trailingAnnualDividendYield ?? null;
        const rawPriceChangePercent = getNumericField(
          data,
          "regularMarketChangePercent",
        );
        const rawVolume =
          getNumericField(data, "regularMarketVolume") ??
          getNumericField(data, "volume");
        const rawAverageVolume =
          getNumericField(data, "averageDailyVolume3Month") ??
          getNumericField(data, "averageDailyVolume10Day") ??
          getNumericField(data, "averageVolume");
        const rawPriceToBook =
          (typeof data.priceToBook === "number" ? data.priceToBook : null) ??
          (typeof keyStats?.priceToBook === "number"
            ? keyStats.priceToBook
            : null);

        // Preserve previous DB values when upstream response omits a field.
        await prisma.stock.update({
          where: { symbol: stock.symbol },
          data: {
            sector:
              typeof assetProfile?.sector === "string"
                ? assetProfile.sector
                : undefined,
            industry:
              typeof assetProfile?.industry === "string"
                ? assetProfile.industry
                : undefined,
            price:
              typeof data.regularMarketPrice === "number"
                ? data.regularMarketPrice
                : undefined,
            priceChangePercent:
              typeof rawPriceChangePercent === "number"
                ? rawPriceChangePercent
                : undefined,
            marketCap:
              typeof data.marketCap === "number" ? data.marketCap : undefined,
            peRatio:
              typeof data.trailingPE === "number" ? data.trailingPE : undefined,
            priceToBook:
              typeof rawPriceToBook === "number" ? rawPriceToBook : undefined,
            roe: typeof rawRoe === "number" ? rawRoe * 100 : undefined,
            roa: typeof rawRoa === "number" ? rawRoa * 100 : undefined,
            profitMargin:
              typeof rawProfitMargin === "number"
                ? rawProfitMargin * 100
                : undefined,
            revenueGrowth:
              typeof rawRevenueGrowth === "number"
                ? rawRevenueGrowth * 100
                : undefined,
            earningsGrowth:
              typeof rawEarningsGrowth === "number"
                ? rawEarningsGrowth * 100
                : undefined,
            debtEquity:
              typeof rawDebtToEquity === "number"
                ? rawDebtToEquity / 100
                : undefined,
            dividendYield:
              typeof rawDividendYield === "number"
                ? rawDividendYield * 100
                : undefined,
            volume: typeof rawVolume === "number" ? rawVolume : undefined,
            averageVolume:
              typeof rawAverageVolume === "number"
                ? rawAverageVolume
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
