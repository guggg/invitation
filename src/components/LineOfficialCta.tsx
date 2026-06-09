"use client";

import Image from "next/image";
import { MessageCircleMore } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "clsx";

export type LineOfficialCtaProps = {
  variant: "rsvp-success" | "footer";
  lineAddFriendUrl: string;
  qrCodeSrc: string;
  defaultExpanded?: boolean;
};

const COPY = {
  "rsvp-success": {
    eyebrow: "回覆已收到",
    title: "我們收到你的回覆了",
    body: [
      "最後一步，可以加入 LINE 官方帳號。",
      "婚禮前的接駁車確認、地點提醒與當天小更新，",
      "我們會整理在這裡。",
      "",
      "那天只要安心出門就好。"
    ],
    microcopy: "手機掃描加入 LINE 官方帳號"
  },
  footer: {
    eyebrow: "婚禮提醒 · LINE",
    title: "把婚禮提醒收進 LINE",
    body: [
      "接駁車、地點與當天小更新，",
      "我們會在婚禮前整理好給你。",
      "",
      "那天不用慌張找資料，",
      "照著提醒出門就好。"
    ],
    microcopy: "手機掃描加入 LINE 官方帳號"
  }
} as const;

function isSafeLineUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function LineOfficialCta({
  variant,
  lineAddFriendUrl,
  qrCodeSrc
}: LineOfficialCtaProps) {
  const [qrFailed, setQrFailed] = useState(false);
  const [inView, setInView] = useState(false);
  const cardRef = useRef<HTMLElement>(null);
  const content = COPY[variant];
  const lineHref = useMemo(
    () => (isSafeLineUrl(lineAddFriendUrl) ? lineAddFriendUrl : ""),
    [lineAddFriendUrl]
  );

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={cardRef}
      className={clsx("line-note-card", `is-${variant}`, inView && "is-in-view")}
      aria-label="LINE 官方帳號加入提醒"
    >
      <div className="line-note-card-qr-always" data-stagger="1">
        {qrFailed || !qrCodeSrc ? (
          <div className="line-note-card-qr-fallback">QR Code 圖片尚未設定</div>
        ) : (
          <Image
            src={qrCodeSrc}
            alt="LINE 官方帳號 QR Code"
            width={176}
            height={176}
            sizes="(max-width: 768px) 160px, 176px"
            onError={() => setQrFailed(true)}
          />
        )}
        <small>{content.microcopy}</small>
      </div>

      <div className="line-note-card-copy">
        <p className="line-note-card-eyebrow" data-stagger="2">{content.eyebrow}</p>
        <h3 data-stagger="3">{content.title}</h3>
        <div className="line-note-card-body" data-stagger="4">
          {content.body.map((line, index) =>
            line ? <span key={`${variant}-${index}`}>{line}</span> : <br key={`${variant}-${index}`} />
          )}
        </div>
        <div className="line-note-card-actions" data-stagger="5">
          {lineHref ? (
            <a
              className="line-note-card-primary"
              href={lineHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircleMore size={16} aria-hidden="true" />
              加入 LINE 官方帳號
            </a>
          ) : (
            <button className="line-note-card-primary is-disabled" type="button" disabled aria-disabled="true">
              <MessageCircleMore size={16} aria-hidden="true" />
              加入 LINE 官方帳號
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
