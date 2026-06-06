"use client";

import { useEffect, useState } from "react";
import { friendSections } from "@/components/friends/friendSections";

export function SectionRail() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lockedIndex, setLockedIndex] = useState<number | null>(null);
  const [forcedHidden, setForcedHidden] = useState(false);
  const [galleryInView, setGalleryInView] = useState(false);
  const visibleIndex = lockedIndex ?? activeIndex;
  const isHidden = forcedHidden || galleryInView || activeIndex === 5 || visibleIndex === 5;

  useEffect(() => {
    const updateGalleryInView = () => {
      const gallery = document.getElementById("gallery");
      if (!gallery) {
        setGalleryInView(false);
        return;
      }

      const rect = gallery.getBoundingClientRect();
      setGalleryInView(rect.top < window.innerHeight && rect.bottom > 0);
    };

    const onSectionChange = (event: Event) => {
      const detail = (event as CustomEvent<{ index?: number }>).detail;
      if (typeof detail?.index === "number") {
        setActiveIndex(detail.index);
      }
      updateGalleryInView();
    };

    const onRailLockChange = (event: Event) => {
      const detail = (event as CustomEvent<{ index?: number | null }>).detail;
      if (typeof detail?.index === "number") {
        setLockedIndex(detail.index);
        return;
      }
      setLockedIndex(null);
    };

    const onRailVisibilityChange = (event: Event) => {
      const detail = (event as CustomEvent<{ hidden?: boolean }>).detail;
      setForcedHidden(Boolean(detail?.hidden));
    };

    const onViewportChange = () => updateGalleryInView();

    window.addEventListener("friend-section-change", onSectionChange);
    window.addEventListener("friend-section-lock", onRailLockChange);
    window.addEventListener("friend-section-rail-visibility", onRailVisibilityChange);
    window.addEventListener("scroll", onViewportChange, { passive: true });
    window.addEventListener("resize", onViewportChange);
    updateGalleryInView();

    return () => {
      window.removeEventListener("friend-section-change", onSectionChange);
      window.removeEventListener("friend-section-lock", onRailLockChange);
      window.removeEventListener("friend-section-rail-visibility", onRailVisibilityChange);
      window.removeEventListener("scroll", onViewportChange);
      window.removeEventListener("resize", onViewportChange);
    };
  }, []);

  return (
    <aside
      className={`section-rail ${isHidden ? "is-gallery-hidden" : ""}`}
      aria-label="頁面段落"
    >
      {friendSections.map((section, index) => (
        <a className={index === visibleIndex ? "active" : ""} href={`#${section.id}`} key={section.id}>
          <span>{index + 1}</span>
          <strong>{section.label}</strong>
        </a>
      ))}
    </aside>
  );
}
