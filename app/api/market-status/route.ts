export async function GET() {
  const res = await fetch(
    `https://finnhub.io/api/v1/stock/market-status?exchange=US&token=${process.env.FINNHUB_API_KEY}`,
  );

  const data = await res.json();

  return Response.json(data);
}
