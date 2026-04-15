"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useState } from "react";
import type { StockApiResponse, StockChartData } from "@/lib/types";

interface ChartProps {
  chart: StockChartData;
  symbol: string;
}

export default function Chart({ chart, symbol }: ChartProps) {
  const [data, setData] = useState<StockChartData>(chart);
  const [activeRange, setActiveRange] = useState("1mo");
  const [loading, setLoading] = useState(false);

  // 🔄 Change timeframe
  const changeRange = async (range: string) => {
    setActiveRange(range);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/stock?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`,
      );

      if (!res.ok) throw new Error("Failed to fetch");

      const newData: StockApiResponse = await res.json();
      setData(newData.chart);
    } catch (err) {
      console.error("Chart fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Format X-axis based on range
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);

    if (activeRange === "1d") {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    if (activeRange === "5d") {
      return date.toLocaleDateString([], {
        weekday: "short",
      });
    }

    if (activeRange === "1mo") {
      return date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
      });
    }

    if (activeRange === "1y") {
      return date.toLocaleDateString([], {
        month: "short",
        year: "2-digit",
      });
    }

    return date.toLocaleDateString();
  };

  // 📊 Transform data
  const chartData = (data.timestamp ?? [])
    .map((t, i) => ({
      time: formatTime(t),
      price: data.indicators?.quote?.[0]?.close?.[i] ?? null,
    }))
    .filter(
      (point): point is { time: string; price: number } => point.price !== null,
    );

  // 📈 Dynamic Y-axis range
  const prices = chartData.map((d) => d.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  const formatPrice = (
    value: number | string | readonly (string | number)[] | undefined,
  ) => {
    if (Array.isArray(value)) {
      const first = value[0];
      return formatPrice(first);
    }

    if (typeof value === "number") {
      return `$${value.toFixed(2)}`;
    }

    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? `$${parsed.toFixed(2)}` : value;
    }

    return "N/A";
  };

  return (
    <div className="surface-block p-4 sm:p-5 rounded-xl shadow">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-semibold">Price Trend</h3>

        <div className="flex flex-wrap gap-2">
          {["1d", "5d", "1mo", "1y"].map((r) => (
            <button
              key={r}
              onClick={() => changeRange(r)}
              className={
                activeRange === r
                  ? "bg-blue-600 text-white px-3 py-1.5 text-xs rounded-md"
                  : "bg-gray-100 text-gray-700 px-3 py-1.5 text-xs rounded-md"
              }
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <p className="mb-2 text-sm text-gray-500">Refreshing chart...</p>
      )}

      {/* Empty state */}
      {chartData.length === 0 ? (
        <p className="text-sm text-gray-500">No chart data available.</p>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ left: 4, right: 14, top: 10, bottom: 4 }}
            >
              {/* X Axis */}
              <XAxis
                dataKey="time"
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />

              {/* Y Axis (dynamic zoom) */}
              <YAxis
                domain={[minPrice * 0.995, maxPrice * 1.005]}
                tick={{ fontSize: 11 }}
                tickFormatter={(value: number) => `$${value.toFixed(0)}`}
                tickCount={5}
              />

              {/* Tooltip */}
              <Tooltip
                formatter={(value) => [formatPrice(value), "Price"]}
                contentStyle={{
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.1)",
                  background: "white",
                }}
              />

              {/* Line */}
              <Line
                type="monotone"
                dataKey="price"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
