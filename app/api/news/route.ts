interface FinnhubNewsItem {
  headline?: string;
  url?: string;
  source?: string;
  image?: string;
  datetime?: number;
  summary?: string;
}

export async function GET() {
  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${process.env.FINNHUB_API_KEY}`,
      { next: { revalidate: 300 } }, // cache for 5 min
    );

    const data: unknown = await res.json();
    const items = Array.isArray(data) ? (data as FinnhubNewsItem[]) : [];

    // Normalize response
    const news = items.map((item) => ({
      headline: item.headline,
      url: item.url,
      source: item.source,
      image: item.image,
      datetime: item.datetime,
      summary: item.summary,
    }));

    return Response.json(news);
  } catch (error) {
    console.error("News API error:", error);
    return Response.json([], { status: 500 });
  }
}
