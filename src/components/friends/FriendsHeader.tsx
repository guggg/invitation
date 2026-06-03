"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function FriendsHeader() {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateHeader = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      const shouldHide = currentScrollY > 120 && delta > 5;
      const shouldShow = delta < -5 || currentScrollY < 80;

      if (shouldHide) {
        setIsHidden(true);
      } else if (shouldShow) {
        setIsHidden(false);
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`friends-v2-header ${isHidden ? "is-hidden" : ""}`}>
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
  );
}
