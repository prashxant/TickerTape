"use client";

import { useMemo, useState } from "react";

interface AboutCompanyProps {
  description?: string;
}

export default function AboutCompany({ description }: AboutCompanyProps) {
  const [expanded, setExpanded] = useState(false);
  const maxChars = 280;

  const normalizedDescription = useMemo(() => {
    const text = description?.trim();
    return text && text.length > 0 ? text : "No description available";
  }, [description]);

  const isTruncatable = normalizedDescription.length > maxChars;
  const visibleText =
    !isTruncatable || expanded
      ? normalizedDescription
      : `${normalizedDescription.slice(0, maxChars).trimEnd()}...`;

  return (
    <section className="mt-8 rounded-xl border border-line bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-lg font-semibold text-foreground">
        About Company
      </h3>
      <p className="text-sm leading-relaxed text-muted">{visibleText}</p>
      {isTruncatable ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-brand hover:opacity-80"
        >
          {expanded ? "Read less" : "Read more"}
        </button>
      ) : null}
    </section>
  );
}
