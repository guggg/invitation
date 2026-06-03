"use client";

import { useSyncExternalStore } from "react";
import { shuttleTrips, type ShuttleTrip } from "@/lib/wedding";
import { downloadShuttleIcs } from "@/lib/calendar";

const REDUCE_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

type LedRowProps = {
  trip: ShuttleTrip;
  direction: "outbound" | "return";
};

function LedRow({ trip, direction }: LedRowProps) {
  const dirLabel = direction === "outbound" ? "去程" : "回程";
  const roundLabel =
    trip.group === "outbound-1"
      ? "第一趟"
      : trip.group === "outbound-2"
        ? "第二趟"
        : trip.group === "return-1"
          ? "第一波"
          : "第二波";

  return (
    <div className={`led-row ${direction}`}>
      <span className="led-t" aria-label={`發車（暫定）${trip.departTime}`}>
        {trip.departTime}
      </span>
      <span className="led-r">
        <span className="led-r-main">
          {trip.vehicle} — {roundLabel}
        </span>
        <span className="led-r-sub">{trip.note}</span>
      </span>
      <span className="led-veh" aria-label={`預估抵達 ${trip.arriveTime}`}>
        抵 {trip.arriveTime}
      </span>
      {/* Visual-only pending badge; direction + pending info carried by CalBtn aria-label */}
      <span className="led-badge led-badge--pending" aria-hidden="true">
        暫定
      </span>
      <button
        className="led-cal-icon-btn"
        aria-label={`加入行事曆：${dirLabel} ${trip.vehicle} ${trip.departTime} 發車（暫定）`}
        onClick={() => downloadShuttleIcs(trip)}
      >
        +
      </button>
    </div>
  );
}

export function ShuttleBoard() {
  const reduceMotion = useSyncExternalStore(
    subscribeReduceMotion,
    getReduceMotionSnapshot,
    getServerReduceMotionSnapshot
  );

  const outbound1 = shuttleTrips.filter((t) => t.group === "outbound-1");
  const outbound2 = shuttleTrips.filter((t) => t.group === "outbound-2");
  const return1 = shuttleTrips.filter((t) => t.group === "return-1");
  const return2 = shuttleTrips.filter((t) => t.group === "return-2");

  const marqueeText =
    "※ 以下班次為暫定預告，確認後另行通知　·　請於發車前 10 分鐘抵達上車點　·　每車可容納 20 人（回程每波 60 人）　·　新店捷運總站上下車　·　";

  return (
    <div className="led-board" role="region" aria-label="接駁車時刻表（班次暫定）">
      <div className="led-inner">
        {/* Header */}
        <div className="led-head">
          <span className="led-title">SHUTTLE · 接駁班次</span>
          <span className="led-clock led-clock--pending">
            <span
              className={`led-dot led-dot--amber${reduceMotion ? " led-dot--static" : ""}`}
              aria-hidden="true"
            />
            PENDING
          </span>
        </div>

        {/* Outbound — Round 1 */}
        <div className="led-group outbound" aria-label="去程第一趟">
          ▶ OUTBOUND 去程第一趟 — 新店捷運總站 → 優聖美地
        </div>
        {outbound1.map((t) => (
          <LedRow key={t.id} trip={t} direction="outbound" />
        ))}

        {/* Outbound — Round 2 */}
        <div className="led-group outbound led-group--mt" aria-label="去程第二趟">
          ▶ OUTBOUND 去程第二趟 — 新店捷運總站 → 優聖美地
        </div>
        {outbound2.map((t) => (
          <LedRow key={t.id} trip={t} direction="outbound" />
        ))}

        {/* Return — Wave 1 */}
        <div className="led-group return led-group--mt" aria-label="回程第一波">
          ◀ RETURN 回程第一波 — 優聖美地 → 新店捷運總站
        </div>
        {return1.map((t) => (
          <LedRow key={t.id} trip={t} direction="return" />
        ))}

        {/* Return — Wave 2 */}
        <div className="led-group return" aria-label="回程第二波">
          ◀ RETURN 回程第二波 — 優聖美地 → 新店捷運總站
        </div>
        {return2.map((t) => (
          <LedRow key={t.id} trip={t} direction="return" />
        ))}

        {/* Marquee */}
        <div className="led-marquee" aria-hidden="true">
          <span className={reduceMotion ? "led-marquee-text--static" : "led-marquee-text"}>
            {marqueeText}
          </span>
        </div>
      </div>
    </div>
  );
}

function subscribeReduceMotion(onStoreChange: () => void) {
  const mq = window.matchMedia(REDUCE_MOTION_QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReduceMotionSnapshot() {
  return window.matchMedia(REDUCE_MOTION_QUERY).matches;
}

function getServerReduceMotionSnapshot() {
  return false;
}
