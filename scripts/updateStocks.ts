import { prisma } from "../lib/prisma";
import { updateStocksJob } from "../lib/updateStocks";

updateStocksJob({ throttleMs: 800 })
  .then((result) => {
    console.log(
      `Update completed. Updated ${result.updated}/${result.total}. Failed: ${result.failed.length}`,
    );
    if (result.failed.length > 0) {
      console.log("Failed symbols:", result.failed.join(", "));
    }
  })
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Update failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
