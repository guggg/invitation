import type { ShuttleTrip } from "./wedding";

/** Format HH:MM on 2026-10-03 Taipei to iCal local-time format YYYYMMDDTHHMMSS */
function toIcalDateTime(timeHHMM: string): string {
  const [hh, mm] = timeHHMM.split(":");
  return `20261003T${hh}${mm}00`;
}

function escapeIcalText(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/**
 * RFC 5545 §3.1 line folding: lines longer than 75 octets must be folded
 * by inserting CRLF + single SPACE before the continuation.
 * We measure bytes (UTF-8) not characters because CJK is 3 bytes each.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let offset = 0;
  let isFirst = true;

  while (offset < bytes.length) {
    // First chunk gets 75 bytes; continuation chunks get 74 (75 minus the leading space byte)
    const chunkBytes = isFirst ? 75 : 74;
    let end = offset + chunkBytes;
    if (end > bytes.length) end = bytes.length;

    // Back up to avoid splitting a multi-byte UTF-8 sequence
    while (end < bytes.length && (bytes[end]! & 0xc0) === 0x80) end--;

    const chunk = new TextDecoder().decode(bytes.slice(offset, end));
    parts.push(isFirst ? chunk : ` ${chunk}`);
    offset = end;
    isFirst = false;
  }

  return parts.join("\r\n");
}

/** Asia/Taipei has no DST — fixed UTC+08:00 forever */
const VTIMEZONE_TAIPEI = [
  "BEGIN:VTIMEZONE",
  "TZID:Asia/Taipei",
  "BEGIN:STANDARD",
  "DTSTART:19700101T000000",
  "TZOFFSETFROM:+0800",
  "TZOFFSETTO:+0800",
  "TZNAME:CST",
  "END:STANDARD",
  "END:VTIMEZONE"
].join("\r\n");

/** Generate RFC 5545 .ics content for a single shuttle trip */
export function buildShuttleIcs(trip: ShuttleTrip): string {
  const uid = `shuttle-${trip.id}-20261003@wedding.4jyuan.com`;
  const dtStamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const dtStart = toIcalDateTime(trip.departTime);
  const dtEnd = toIcalDateTime(trip.arriveTime);

  const direction = trip.group.startsWith("outbound") ? "去程" : "回程";
  const summary = escapeIcalText(`接駁車 ${trip.vehicle} — ${trip.from}→${trip.to}`);
  const location = escapeIcalText(`${trip.from}（上車點）`);

  // Distinguish outbound (per-bus capacity) vs return (whole wave capacity)
  const capacityNote = trip.group.startsWith("outbound")
    ? `每車容納 ${trip.capacity} 人。`
    : `本波共 ${trip.capacity} 人（A·B·C 三台合計）。`;

  const description = escapeIcalText(
    `${direction} · ${trip.vehicle}\n建議賓客：${trip.note}\n請提前 10 分鐘抵達上車點。\n${capacityNote}`
  );

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//4J & Yuan Wedding//Shuttle Schedule//ZH",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    VTIMEZONE_TAIPEI,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=Asia/Taipei:${dtStart}`,
    `DTEND;TZID=Asia/Taipei:${dtEnd}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ];

  // Apply folding to every content line, then join with CRLF and append trailing CRLF
  return lines.flatMap((block) => block.split("\r\n").map(foldLine)).join("\r\n") + "\r\n";
}

/** Trigger a browser download of a .ics file for the given trip.
 *  SSR-safe: must only be called inside an event handler, never during render. */
export function downloadShuttleIcs(trip: ShuttleTrip): void {
  if (typeof document === "undefined") return;
  const icsContent = buildShuttleIcs(trip);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `接駁車-${trip.vehicle.replace(/[·\s]/g, "-")}-${trip.departTime.replace(":", "")}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
