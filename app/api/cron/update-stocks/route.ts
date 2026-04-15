import { NextResponse } from "next/server";
import { updateStocksJob } from "@/lib/updateStocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const authorization = request.headers.get("authorization");
  return authorization === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const limitParam = searchParams.get("limit");
  const parsedLimit = limitParam ? Number(limitParam) : undefined;
  const limit =
    typeof parsedLimit === "number" &&
    Number.isFinite(parsedLimit) &&
    parsedLimit > 0
      ? Math.floor(parsedLimit)
      : undefined;

  const result = await updateStocksJob({ limit });

  if (result.fatalError) {
    console.error("Cron stock update failed:", result.fatalError);
    return NextResponse.json(
      {
        ok: false,
        message:
          "Update job handled a fatal error safely. Existing data was preserved.",
        ...result,
      },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true, ...result });
}
