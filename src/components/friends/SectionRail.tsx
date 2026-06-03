"use client";

import { useEffect, useState } from "react";
import { friendSections } from "@/components/friends/friendSections";

export function SectionRail() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isGalleryVisible, setIsGalleryVisible] = useState(false);
  const activeSection = friendSections[activeIndex];

  useEffect(() => {
    let ticking = false;

    const updateGalleryVisibility = () => {
      const gallery = document.getElementById("gallery");
      if (!gallery) {
        setIsGalleryVisible(false);
        ticking = false;
        return;
      }

      const rect = gallery.getBoundingClientRect();
      const viewportMarker = window.innerHeight * 0.5;
      setIsGalleryVisible(rect.top <= viewportMarker && rect.bottom >= viewportMarker);
      ticking = false;
    };

    const requestUpdate = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateGalleryVisibility);
        ticking = true;
      }
    };

    const onSectionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ index?: number }>).detail;
      if (typeof detail?.index === "number") {
        setActiveIndex(detail.index);
      }
      requestUpdate();
    };

    window.addEventListener("friend-section-change", onSectionChange);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    updateGalleryVisibility();

    return () => {
      window.removeEventListener("friend-section-change", onSectionChange);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return (
    <aside
      className={`section-rail ${activeSection?.id === "gallery" || isGalleryVisible ? "is-gallery-hidden" : ""}`}
      aria-label="頁面段落"
    >
      {friendSections.map((section, index) => (
        <a className={index === activeIndex ? "active" : ""} href={`#${section.id}`} key={section.id}>
          <span>{index + 1}</span>
          <strong>{section.label}</strong>
        </a>
      ))}
    </aside>
  );
}
