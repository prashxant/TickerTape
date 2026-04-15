// scripts/updateStocks.ts
import yahooFinance from "yahoo-finance2";
import { prisma } from "../lib/prisma";

const yf = new yahooFinance();

async function updateStocks() {
  const stocks = await prisma.stock.findMany();

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

      await prisma.stock.update({
        where: { symbol: stock.symbol },
        data: {
          price: data.regularMarketPrice ?? null,
          marketCap: data.marketCap ?? null,
          peRatio: data.trailingPE ?? null,
          roe: typeof rawRoe === "number" ? rawRoe * 100 : null,
          debtEquity:
            typeof rawDebtToEquity === "number" ? rawDebtToEquity / 100 : null,
          dividendYield:
            typeof rawDividendYield === "number"
              ? rawDividendYield * 100
              : null,
        },
      });

      console.log("Updated:", stock.symbol);

      await new Promise((r) => setTimeout(r, 800));
    } catch {
      console.log("Error:", stock.symbol);
    }
  }
}

updateStocks()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Update failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
