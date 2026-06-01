"use client";

import { Bus } from "lucide-react";
import { shuttleTrips, type ShuttleTrip } from "@/lib/wedding";
import { downloadShuttleIcs } from "@/lib/calendar";

function IcsBtnFamily({ trip }: { trip: ShuttleTrip }) {
  return (
    <button
      className="family-shuttle-ics-btn"
      aria-label={`加入行事曆：${trip.vehicle} ${trip.departTime} 發車`}
      onClick={() => downloadShuttleIcs(trip)}
    >
      + 加入提醒
    </button>
  );
}

type GroupRowsProps = {
  trips: readonly ShuttleTrip[];
  colorClass: string;
};

function GroupRows({ trips, colorClass }: GroupRowsProps) {
  return (
    <>
      {trips.map((t) => (
        <tr key={t.id} className={colorClass}>
          <td className="family-shuttle-time">{t.departTime}</td>
          <td className="family-shuttle-arrive">{t.arriveTime}</td>
          <td className="family-shuttle-vehicle">{t.vehicle}</td>
          <td className="family-shuttle-note">{t.note}</td>
          <td className="family-shuttle-action">
            <IcsBtnFamily trip={t} />
          </td>
        </tr>
      ))}
    </>
  );
}

export function FamilyShuttleTable() {
  const outbound = shuttleTrips.filter((t) => t.group.startsWith("outbound"));
  const returnTrips = shuttleTrips.filter((t) => t.group.startsWith("return"));

  return (
    <section className="family-section family-shuttle-section">
      <div className="family-section-title">
        <Bus size={26} aria-hidden="true" />
        <h2>接駁車時刻表</h2>
      </div>
      <p className="family-shuttle-pending-notice">
        以下班次為暫定安排，確認後另行通知。
      </p>
      <p className="family-shuttle-info">
        上車點：<strong>新店捷運總站</strong>，請於發車前 10 分鐘抵達。每車 20 人。
      </p>

      {/* Outbound */}
      <h3 className="family-shuttle-group-title family-shuttle-outbound-title">
        ▶ 去程 — 新店捷運總站 → 優聖美地
      </h3>
      <div className="family-shuttle-table-wrap">
        <table className="family-shuttle-table" role="table" aria-label="去程接駁班次">
          <thead>
            <tr>
              <th scope="col">發車</th>
              <th scope="col">預估抵達</th>
              <th scope="col">車輛</th>
              <th scope="col">建議賓客</th>
              <th scope="col">
                <span className="sr-only">加入行事曆</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="family-shuttle-group-header family-shuttle-outbound-header">
              <td colSpan={5}>第一趟</td>
            </tr>
            <GroupRows
              trips={outbound.filter((t) => t.group === "outbound-1")}
              colorClass="family-shuttle-outbound"
            />
            <tr className="family-shuttle-group-header family-shuttle-outbound-header">
              <td colSpan={5}>第二趟</td>
            </tr>
            <GroupRows
              trips={outbound.filter((t) => t.group === "outbound-2")}
              colorClass="family-shuttle-outbound"
            />
          </tbody>
        </table>
      </div>

      {/* Return */}
      <h3 className="family-shuttle-group-title family-shuttle-return-title">
        ◀ 回程 — 優聖美地 → 新店捷運總站
      </h3>
      <div className="family-shuttle-table-wrap">
        <table className="family-shuttle-table" role="table" aria-label="回程接駁班次">
          <thead>
            <tr>
              <th scope="col">發車</th>
              <th scope="col">預估抵達</th>
              <th scope="col">車輛</th>
              <th scope="col">建議賓客</th>
              <th scope="col">
                <span className="sr-only">加入行事曆</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="family-shuttle-group-header family-shuttle-return-header">
              <td colSpan={5}>第一波</td>
            </tr>
            <GroupRows
              trips={returnTrips.filter((t) => t.group === "return-1")}
              colorClass="family-shuttle-return"
            />
            <tr className="family-shuttle-group-header family-shuttle-return-header">
              <td colSpan={5}>第二波</td>
            </tr>
            <GroupRows
              trips={returnTrips.filter((t) => t.group === "return-2")}
              colorClass="family-shuttle-return"
            />
          </tbody>
        </table>
      </div>
    </section>
  );
}
