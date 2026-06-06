"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProgressiveBlur } from "@/components/ui/skiper-ui/skiper41";

export function FriendsHeader() {
  const [hidden, setHidden] = useState(false);
  const [hoverVisible, setHoverVisible] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const THRESHOLD = 8;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const delta = currentY - lastScrollY.current;

        if (delta > THRESHOLD && currentY > 80) {
          setHidden(true);
          setHoverVisible(false);
        } else if (delta < -THRESHOLD) {
          setHidden(false);
          setHoverVisible(false);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleTriggerEnter = useCallback(() => {
    const isDesktop = window.matchMedia("(pointer: fine)").matches;
    if (hidden && isDesktop) {
      setHoverVisible(true);
    }
  }, [hidden]);

  const handleHeaderLeave = useCallback(() => {
    if (hoverVisible) {
      setHoverVisible(false);
    }
  }, [hoverVisible]);

  const isShown = !hidden || hoverVisible;

  return (
    <>
      <div
        className="friends-header-hover-zone"
        aria-hidden="true"
        onMouseEnter={handleTriggerEnter}
      />
      <div className={`friends-progressive-blur ${isShown ? "" : "is-hidden"}`} aria-hidden="true">
        <ProgressiveBlur backgroundColor="#f7f6f2" blurAmount="4px" />
      </div>
      <header
        ref={headerRef}
        className={`friends-v2-header ${isShown ? "" : "is-hidden"}`}
        onMouseLeave={handleHeaderLeave}
      >
        <a className="friends-v2-brand" href="#opening" aria-label="Yuan and 4J wedding opening">
          4J&Yuan
        </a>
        <nav aria-label="朋友版導覽">
          <a href="#schedule">時間</a>
          <a href="#dress-code">穿著</a>
          <a href="#venue">地點</a>
          <a href="#gallery">照片</a>
          <a href="#rsvp">回覆</a>
          <Link href="/family">長輩版</Link>
        </nav>
      </header>
    </>
  );
}
