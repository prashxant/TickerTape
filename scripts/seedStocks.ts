// scripts/seedStocks.ts
import axios from "axios";
import { prisma } from "../lib/prisma";

async function seed() {
  const res = await axios.get(
    "https://datahub.io/core/s-and-p-500-companies/r/constituents.csv",
  );

  const rows = res.data.split("\n").slice(1);

  for (const row of rows) {
    const [symbol, name, sector] = row.split(",");

    if (!symbol) continue;

    await prisma.stock.upsert({
      where: { symbol },
      update: {},
      create: { symbol, name, sector },
    });

    console.log("Inserted:", symbol);
  }
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
