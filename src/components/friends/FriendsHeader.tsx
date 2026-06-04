"use client";

import Link from "next/link";
import { ProgressiveBlur } from "@/components/ui/skiper-ui/skiper41";

export function FriendsHeader() {
  return (
    <>
      <div className="friends-progressive-blur" aria-hidden="true">
        <ProgressiveBlur backgroundColor="#f7f6f2" blurAmount="4px" />
      </div>
      <header className="friends-v2-header">
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
