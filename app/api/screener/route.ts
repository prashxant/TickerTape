import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const pe = searchParams.get("pe");
  const marketCap = searchParams.get("marketCap");
  const roe = searchParams.get("roe");
  const debtEquity = searchParams.get("debtEquity");
  const dividendYield = searchParams.get("dividendYield");

  const stocks = await prisma.stock.findMany({
    where: {
      peRatio: pe ? { lte: Number(pe) } : undefined,
      marketCap: marketCap ? { gte: Number(marketCap) } : undefined,
      roe: roe ? { gte: Number(roe) } : undefined,
      debtEquity: debtEquity ? { lte: Number(debtEquity) } : undefined,
      dividendYield: dividendYield ? { gte: Number(dividendYield) } : undefined,
    },
  });

  return Response.json(stocks);
}
