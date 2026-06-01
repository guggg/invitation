"use client";

import { useState } from "react";
import { shuttleTrips } from "@/lib/wedding";

type Identity = "ceremony" | "dinner";

const identities: { id: Identity; label: string; sub: string }[] = [
  { id: "ceremony", label: "我是證婚賓客", sub: "想趕上 16:30 證婚儀式" },
  { id: "dinner", label: "我是晚宴賓客", sub: "只參加 18:00 晚宴" }
];

const groupsByIdentity: Record<Identity, ("outbound-1" | "outbound-2")[]> = {
  ceremony: ["outbound-1"],
  dinner: ["outbound-2"]
};

export function ShuttlePicker() {
  const [selected, setSelected] = useState<Identity | null>(null);

  const outboundTrips =
    selected !== null
      ? shuttleTrips.filter((t) => groupsByIdentity[selected].includes(t.group as "outbound-1" | "outbound-2"))
      : [];

  const returnTrips = shuttleTrips.filter((t) => t.group.startsWith("return"));

  return (
    <div className="shuttle-picker-card">
      <p className="shuttle-picker-heading">我該搭哪班？</p>
      <p className="shuttle-picker-sub">選擇身份，馬上看推薦班次</p>

      <div className="shuttle-picker-btns" role="group" aria-label="選擇身份">
        {identities.map((ident) => (
          <button
            key={ident.id}
            type="button"
            className={`shuttle-picker-btn${selected === ident.id ? " shuttle-picker-btn--active" : ""}`}
            aria-pressed={selected === ident.id}
            onClick={() => setSelected((prev) => (prev === ident.id ? null : ident.id))}
          >
            <span className="shuttle-picker-btn-label">{ident.label}</span>
            <span className="shuttle-picker-btn-sub">{ident.sub}</span>
          </button>
        ))}
      </div>

      <div
        className="shuttle-picker-result"
        aria-live="polite"
        aria-label="推薦班次"
      >
        {selected !== null && outboundTrips.length > 0 && (
          <>
            <p className="shuttle-picker-result-label">▶ 推薦去程班次</p>
            <ul className="shuttle-picker-trips">
              {outboundTrips.map((t) => (
                <li key={t.id} className="shuttle-picker-trip outbound">
                  <span className="shuttle-picker-time">
                    {t.departTime}
                    <span className="shuttle-picker-pending" aria-label="暫定">暫</span>
                  </span>
                  <span className="shuttle-picker-vehicle">{t.vehicle}</span>
                  <span className="shuttle-picker-note">{t.note}</span>
                </li>
              ))}
            </ul>

            <p className="shuttle-picker-result-label shuttle-picker-result-label--return">◀ 回程（所有賓客適用）</p>
            <ul className="shuttle-picker-trips">
              {returnTrips.map((t) => (
                <li key={t.id} className="shuttle-picker-trip return">
                  <span className="shuttle-picker-time">
                    {t.departTime}
                    <span className="shuttle-picker-pending" aria-label="暫定">暫</span>
                  </span>
                  <span className="shuttle-picker-vehicle">{t.vehicle}</span>
                  <span className="shuttle-picker-note">{t.note}</span>
                </li>
              ))}
            </ul>
          </>
        )}

        {selected === null && (
          <p className="shuttle-picker-placeholder">↑ 選一個身份，幫你找最適合的班次</p>
        )}
      </div>
    </div>
  );
}
