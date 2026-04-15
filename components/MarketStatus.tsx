"use client";

import { useEffect, useState } from "react";

export default function MarketStatus() {
  const [isOpen, setIsOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/market-status");
        const data = await res.json();

        setIsOpen(data.isOpen);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  return (
    <div className="px-3 py-2 pt-3 flex items-center gap-2 rounded-lg">
      {/* Indicator dot */}
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          isOpen ? "bg-green-500" : "bg-red-500"
        }`}
      />

      {/* Text */}
      <p className="text-sm font-medium">
        {loading
          ? "Checking market status..."
          : isOpen
            ? "US Markets Open"
            : "US Markets Closed"}
      </p>
    </div>
  );
}
