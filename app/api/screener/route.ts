import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

const SORT_FIELD_MAP: Record<string, Prisma.StockOrderByWithRelationInput> = {
  symbol: { symbol: "asc" },
  name: { name: "asc" },
  sector: { sector: "asc" },
  price: { price: "desc" },
  change: { priceChangePercent: "desc" },
  marketCap: { marketCap: "desc" },
  pe: { peRatio: "asc" },
  dividendYield: { dividendYield: "desc" },
  volume: { volume: "desc" },
};

function parseNumber(value: string | null): number | undefined {
  if (value == null || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parsePositiveInteger(
  value: string | null,
  fallback: number,
  max?: number,
): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  if (typeof max === "number" && parsed > max) {
    return max;
  }

  return parsed;
}

function buildRangeFilter(
  min?: number,
  max?: number,
): Prisma.FloatNullableFilter | undefined {
  if (typeof min !== "number" && typeof max !== "number") {
    return undefined;
  }

  const range: Prisma.FloatNullableFilter = {};

  if (typeof min === "number") {
    range.gte = min;
  }
  if (typeof max === "number") {
    range.lte = max;
  }

  return range;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const sectorsFromList = searchParams
    .getAll("sectors")
    .flatMap((item) => item.split(","));
  const sectors = sectorsFromList
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const page = parsePositiveInteger(searchParams.get("page"), DEFAULT_PAGE);
  const limit = parsePositiveInteger(
    searchParams.get("limit"),
    DEFAULT_LIMIT,
    MAX_LIMIT,
  );

  const priceMin = parseNumber(searchParams.get("priceMin"));
  const priceMax = parseNumber(searchParams.get("priceMax"));
  const changeMin = parseNumber(searchParams.get("changeMin"));
  const changeMax = parseNumber(searchParams.get("changeMax"));
  const peMin = parseNumber(searchParams.get("peMin"));
  const peMax = parseNumber(searchParams.get("peMax"));
  const marketCapMin = parseNumber(searchParams.get("marketCapMin"));
  const marketCapMax = parseNumber(searchParams.get("marketCapMax"));
  const priceToBookMin = parseNumber(searchParams.get("priceToBookMin"));
  const priceToBookMax = parseNumber(searchParams.get("priceToBookMax"));
  const roeMin = parseNumber(searchParams.get("roeMin"));
  const roeMax = parseNumber(searchParams.get("roeMax"));
  const roaMin = parseNumber(searchParams.get("roaMin"));
  const roaMax = parseNumber(searchParams.get("roaMax"));
  const profitMarginMin = parseNumber(searchParams.get("profitMarginMin"));
  const profitMarginMax = parseNumber(searchParams.get("profitMarginMax"));
  const revenueGrowthMin = parseNumber(searchParams.get("revenueGrowthMin"));
  const revenueGrowthMax = parseNumber(searchParams.get("revenueGrowthMax"));
  const earningsGrowthMin = parseNumber(searchParams.get("earningsGrowthMin"));
  const earningsGrowthMax = parseNumber(searchParams.get("earningsGrowthMax"));
  const dividendYieldMin = parseNumber(searchParams.get("dividendYieldMin"));
  const dividendYieldMax = parseNumber(searchParams.get("dividendYieldMax"));
  const averageVolumeMin = parseNumber(searchParams.get("averageVolumeMin"));
  const averageVolumeMax = parseNumber(searchParams.get("averageVolumeMax"));
  const volumeMin = parseNumber(searchParams.get("volumeMin"));
  const volumeMax = parseNumber(searchParams.get("volumeMax"));

  const dividendPayer = searchParams.get("dividendPayer");
  const sortBy = searchParams.get("sortBy") ?? "marketCap";
  const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  const where: Prisma.StockWhereInput = {};

  if (sectors.length > 0) {
    where.sector = { in: sectors };
  }

  const priceFilter = buildRangeFilter(priceMin, priceMax);
  const changeFilter = buildRangeFilter(changeMin, changeMax);
  const peFilter = buildRangeFilter(peMin, peMax);
  const marketCapFilter = buildRangeFilter(marketCapMin, marketCapMax);
  const priceToBookFilter = buildRangeFilter(priceToBookMin, priceToBookMax);
  const roeFilter = buildRangeFilter(roeMin, roeMax);
  const roaFilter = buildRangeFilter(roaMin, roaMax);
  const profitMarginFilter = buildRangeFilter(profitMarginMin, profitMarginMax);
  const revenueGrowthFilter = buildRangeFilter(
    revenueGrowthMin,
    revenueGrowthMax,
  );
  const earningsGrowthFilter = buildRangeFilter(
    earningsGrowthMin,
    earningsGrowthMax,
  );
  const dividendYieldFilter = buildRangeFilter(
    dividendYieldMin,
    dividendYieldMax,
  );
  const averageVolumeFilter = buildRangeFilter(
    averageVolumeMin,
    averageVolumeMax,
  );
  const volumeFilter = buildRangeFilter(volumeMin, volumeMax);

  if (priceFilter) where.price = priceFilter;
  if (changeFilter) where.priceChangePercent = changeFilter;
  if (peFilter) where.peRatio = peFilter;
  if (marketCapFilter) where.marketCap = marketCapFilter;
  if (priceToBookFilter) where.priceToBook = priceToBookFilter;
  if (roeFilter) where.roe = roeFilter;
  if (roaFilter) where.roa = roaFilter;
  if (profitMarginFilter) where.profitMargin = profitMarginFilter;
  if (revenueGrowthFilter) where.revenueGrowth = revenueGrowthFilter;
  if (earningsGrowthFilter) where.earningsGrowth = earningsGrowthFilter;
  if (dividendYieldFilter) where.dividendYield = dividendYieldFilter;
  if (averageVolumeFilter) where.averageVolume = averageVolumeFilter;
  if (volumeFilter) where.volume = volumeFilter;

  if (dividendPayer === "true") {
    const currentDividendFilter =
      where.dividendYield && typeof where.dividendYield === "object"
        ? (where.dividendYield as Prisma.FloatNullableFilter)
        : undefined;

    where.dividendYield = {
      ...(currentDividendFilter ?? {}),
      gt: 0,
    };
  } else if (dividendPayer === "false") {
    where.OR = [{ dividendYield: null }, { dividendYield: { lte: 0 } }];
  }

  const sortClause = SORT_FIELD_MAP[sortBy] ?? SORT_FIELD_MAP.marketCap;
  const [sortField] = Object.keys(sortClause);
  const orderBy: Prisma.StockOrderByWithRelationInput = {
    [sortField]: sortDir,
  };

  const [total, stocks, sectorRows] = await prisma.$transaction([
    prisma.stock.count({ where }),
    prisma.stock.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        symbol: true,
        name: true,
        sector: true,
        industry: true,
        price: true,
        priceChangePercent: true,
        marketCap: true,
        peRatio: true,
        priceToBook: true,
        roe: true,
        roa: true,
        profitMargin: true,
        revenueGrowth: true,
        earningsGrowth: true,
        debtEquity: true,
        dividendYield: true,
        volume: true,
        averageVolume: true,
      },
    }),
    prisma.stock.findMany({
      where: { sector: { not: null } },
      select: { sector: true },
      distinct: ["sector"],
      orderBy: { sector: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return Response.json({
    data: stocks,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
    sorting: {
      sortBy,
      sortDir,
    },
    availableSectors: sectorRows
      .map((item) => item.sector)
      .filter((value): value is string => typeof value === "string"),
  });
}
