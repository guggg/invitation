import { describe, expect, it } from "vitest";
import { photos } from "@/lib/photos";
import { wedding } from "@/lib/wedding";

describe("wedding content", () => {
  it("keeps the user-provided wedding facts centralized", () => {
    expect(wedding.couple).toBe("4J & Yuan");
    expect(wedding.coupleChinese).toBe("士杰與慧媛");
    expect(wedding.dateDisplay).toBe("2026.10.3");
    expect(wedding.venue.name).toBe("優聖美地");
    expect(wedding.venue.mapsUrl).toBe("https://maps.app.goo.gl/kh9wq747YUEJQPMP8");
    expect(wedding.dressCode.title).toBe("極簡大地");
    expect(wedding.dressCode.palette.map((color) => color.hex)).toEqual([
      "#B5B0A1",
      "#E3D3C4",
      "#D8CFC4",
      "#A59C94",
      "#CFCAC2"
    ]);
    expect(wedding.schedule.map((item) => item.time)).toEqual(["16:30", "18:00", "20:30"]);
    expect(wedding.schedule.map((item) => item.title)).toEqual(["證婚", "晚宴入席", "圓滿結束"]);
  });

  it("uses stable public photo paths without spaces", () => {
    expect(photos.length).toBeGreaterThanOrEqual(12);
    expect(photos.some((photo) => photo.role === "hero")).toBe(true);
    expect(photos.some((photo) => photo.role === "family")).toBe(true);

    for (const photo of photos) {
      expect(photo.src).toMatch(/^\/photos\/[a-z0-9-]+\.jpg$/);
      expect(photo.src.includes(" ")).toBe(false);
    }
  });
});
