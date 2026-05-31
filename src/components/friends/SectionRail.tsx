"use client";

import { useEffect, useState } from "react";
import { friendSections } from "@/components/friends/friendSections";

export function SectionRail() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const onSectionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ index?: number }>).detail;
      if (typeof detail?.index === "number") {
        setActiveIndex(detail.index);
      }
    };

    window.addEventListener("friend-section-change", onSectionChange);
    return () => window.removeEventListener("friend-section-change", onSectionChange);
  }, []);

  return (
    <aside className="section-rail" aria-label="頁面段落">
      {friendSections.map((section, index) => (
        <a className={index === activeIndex ? "active" : ""} href={`#${section.id}`} key={section.id}>
          <span>{index + 1}</span>
          <strong>{section.label}</strong>
        </a>
      ))}
    </aside>
  );
}
