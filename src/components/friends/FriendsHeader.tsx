"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ProgressiveBlur } from "@/components/ui/skiper-ui/skiper41";

export function FriendsHeader() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

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
        } else if (delta < -THRESHOLD) {
          setHidden(false);
        }

        lastScrollY.current = currentY;
        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className={`friends-progressive-blur ${hidden ? "is-hidden" : ""}`} aria-hidden="true">
        <ProgressiveBlur backgroundColor="#f7f6f2" blurAmount="4px" />
      </div>
      <header className={`friends-v2-header ${hidden ? "is-hidden" : ""}`}>
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
