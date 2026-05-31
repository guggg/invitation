import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  AsciiPortal,
  getPortalSceneDensity,
  getPortalSceneName,
  getPortalSceneStrength,
  getSpecimenFieldOpacity,
  getSpecimenPortalSceneName,
  renderBalloonSpecimen,
  renderBouquetHybridSpecimen,
  renderBouquetLineworkSpecimen,
  renderBouquetSpecimen,
  renderRingSpecimen,
  renderShoesSpecimen
} from "@/components/friends/AsciiPortal";

function visibleGlyphCount(value: string) {
  return value.replace(/\s/g, "").length;
}

function lineGlyphCounts(value: string) {
  return value.split("\n").map((line) => line.replace(/\s/g, "").length);
}

function visibleBounds(value: string) {
  const lines = value.split("\n");
  let minRow = lines.length;
  let maxRow = -1;
  let minCol = Number.POSITIVE_INFINITY;
  let maxCol = -1;

  lines.forEach((line, row) => {
    Array.from(line).forEach((char, col) => {
      if (/\s/.test(char)) {
        return;
      }
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
    });
  });

  return { minRow, maxRow, minCol, maxCol, width: maxCol - minCol + 1, height: maxRow - minRow + 1 };
}

function glyphRatio(value: string, pattern: RegExp) {
  const glyphs = value.replace(/\s/g, "");
  return (glyphs.match(pattern)?.length ?? 0) / glyphs.length;
}

function internalVoidCount(value: string) {
  const lines = value.split("\n");
  let pockets = 0;

  for (let row = 6; row < 36; row += 1) {
    for (let col = 20; col < 98; col += 1) {
      if ((lines[row]?.[col] ?? " ") !== " ") {
        continue;
      }

      const left = lines[row]?.slice(Math.max(0, col - 5), col).replace(/\s/g, "").length ?? 0;
      const right = lines[row]?.slice(col + 1, col + 6).replace(/\s/g, "").length ?? 0;
      const up = [1, 2, 3, 4].some((offset) => (lines[row - offset]?.[col] ?? " ") !== " ");
      const down = [1, 2, 3, 4].some((offset) => (lines[row + offset]?.[col] ?? " ") !== " ");

      if (left >= 2 && right >= 2 && up && down) {
        pockets += 1;
      }
    }
  }

  return pockets;
}

function separatedClusterRows(value: string) {
  const lines = value.split("\n");

  return lines.slice(12, 44).filter((line) => {
    let clusters = 0;
    let inCluster = false;
    let gap = 0;

    for (const char of line) {
      if (/\s/.test(char)) {
        if (inCluster) {
          gap += 1;
          if (gap >= 4) {
            inCluster = false;
            gap = 0;
          }
        }
        continue;
      }

      if (!inCluster) {
        clusters += 1;
        inCluster = true;
      }
      gap = 0;
    }

    return clusters >= 3;
  }).length;
}

function lowerHalfGlyphCount(value: string) {
  const lines = value.split("\n");
  return lines.slice(Math.floor(lines.length / 2)).join("").replace(/\s/g, "").length;
}

function upperHalfGlyphCount(value: string) {
  const lines = value.split("\n");
  return lines.slice(0, Math.floor(lines.length / 2)).join("").replace(/\s/g, "").length;
}

function maxBoundedWhitespaceRuns(value: string, startRatio: number, endRatio: number, minRunLength: number) {
  const lines = value.split("\n");
  const start = Math.floor(lines.length * startRatio);
  const end = Math.ceil(lines.length * endRatio);
  let maxRuns = 0;

  for (const line of lines.slice(start, end)) {
    let runs = 0;
    let runLength = 0;
    let hasLeftGlyph = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index] ?? " ";
      if (/\s/.test(char)) {
        if (hasLeftGlyph) {
          runLength += 1;
        }
        continue;
      }

      if (runLength >= minRunLength) {
        runs += 1;
      }
      hasLeftGlyph = true;
      runLength = 0;
    }
    maxRuns = Math.max(maxRuns, runs);
  }

  return maxRuns;
}

function maxRunWidth(value: string, startRatio: number, endRatio: number) {
  const lines = value.split("\n");
  const start = Math.floor(lines.length * startRatio);
  const end = Math.ceil(lines.length * endRatio);
  let maxWidth = 0;

  for (const line of lines.slice(start, end)) {
    let width = 0;
    for (const char of line) {
      if (/\s/.test(char)) {
        maxWidth = Math.max(maxWidth, width);
        width = 0;
        continue;
      }
      width += 1;
    }
    maxWidth = Math.max(maxWidth, width);
  }

  return maxWidth;
}

describe("AsciiPortal transition", () => {
  it("uses one ascii field instead of separate object overlays", () => {
    render(<AsciiPortal />);

    fireEvent.click(screen.getByRole("button", { name: "請點擊" }));

    expect(document.querySelector(".ascii-field")).not.toBeNull();
    expect(document.querySelector(".ascii-object")).toBeNull();
    expect(document.querySelector(".ascii-object-scrim")).toBeNull();
    expect(document.querySelector(".ascii-wordmark")).toBeNull();
  });

  it("keeps legacy generated-field wedding object scenes disabled", () => {
    expect(getPortalSceneName(0.2)).toBeNull();
    expect(getPortalSceneName(0.34)).toBeNull();
    expect(getPortalSceneName(0.48)).toBeNull();
    expect(getPortalSceneName(0.62)).toBeNull();
    expect(getPortalSceneName(0.77)).toBeNull();
    expect(getPortalSceneName(0.9)).toBe("title");
  });

  it("does not render old object masks in the generated field while specimens are active", () => {
    expect(getPortalSceneDensity(-0.5, 0.08, 0.2, 1)).toBe(0);
    expect(getPortalSceneDensity(-0.42, 0.34, 0.34, 1)).toBe(0);
    expect(getPortalSceneDensity(-0.48, -0.34, 0.48, 1)).toBe(0);
    expect(getPortalSceneDensity(-0.38, -0.2, 0.62, 1)).toBe(0);
    expect(getPortalSceneDensity(0, 0.7, 0.77, 1)).toBe(0);
  });

  it("keeps object scenes quiet outside their window", () => {
    expect(getPortalSceneStrength(0.08, "rings")).toBe(0);
    expect(getPortalSceneStrength(0.2, "rings")).toBe(0);
    expect(getPortalSceneStrength(0.34, "rings")).toBe(0);
  });

  it("keeps only the final generated-field title scene after specimen objects", () => {
    expect(getPortalSceneName(0.28)).toBeNull();
    expect(getPortalSceneName(0.42)).toBeNull();
    expect(getPortalSceneName(0.56)).toBeNull();
    expect(getPortalSceneName(0.72)).toBeNull();
    expect(getPortalSceneName(0.86)).toBeNull();
    expect(getPortalSceneName(0.9)).toBe("title");
  });

  it("steps through high-density ascii specimens before the title reveal", () => {
    expect(getSpecimenPortalSceneName(0.16)).toBe("rings");
    expect(getSpecimenPortalSceneName(0.34)).toBe("shoes");
    expect(getSpecimenPortalSceneName(0.5)).toBe("balloons");
    expect(getSpecimenPortalSceneName(0.66)).toBe("bouquet");
    expect(getSpecimenPortalSceneName(0.82)).toBeNull();
  });

  it("nearly mutes the generated field while a specimen is active", () => {
    expect(getSpecimenFieldOpacity(0.16)).toBeLessThanOrEqual(0.1);
    expect(getSpecimenFieldOpacity(0.34)).toBeLessThanOrEqual(0.1);
    expect(getSpecimenFieldOpacity(0.5)).toBeLessThanOrEqual(0.1);
    expect(getSpecimenFieldOpacity(0.66)).toBeLessThanOrEqual(0.1);
    expect(getSpecimenFieldOpacity(0.82)).toBe(1);
  });

  it("renders wedding rings as a large hollow ascii specimen with light texture", () => {
    const specimen = renderRingSpecimen(0.2, 1, { x: 0.5, y: 0.5 });
    const bounds = visibleBounds(specimen);

    expect(visibleGlyphCount(specimen)).toBeGreaterThan(1000);
    expect(bounds.width).toBeGreaterThan(95);
    expect(bounds.height).toBeGreaterThan(42);
    expect(glyphRatio(specimen, /[.:|/\\()]/g)).toBeGreaterThan(0.3);
    expect(glyphRatio(specimen, /[01689]/g)).toBeLessThan(0.38);
    expect(internalVoidCount(specimen)).toBeGreaterThan(24);
  });

  it("renders a single main engagement ring instead of two side-by-side rings", () => {
    const specimen = renderRingSpecimen(0.2, 1, { x: 0.5, y: 0.5 });

    expect(maxBoundedWhitespaceRuns(specimen, 0.42, 0.68, 16)).toBeLessThanOrEqual(1);
    expect(maxRunWidth(specimen, 0.18, 0.36)).toBeGreaterThan(18);
  });

  it("renders wedding shoes as a wide asymmetrical ascii specimen", () => {
    const specimen = renderShoesSpecimen(0.34, 1, { x: 0.5, y: 0.5 });
    const bounds = visibleBounds(specimen);

    expect(visibleGlyphCount(specimen)).toBeGreaterThan(1250);
    expect(bounds.width / bounds.height).toBeGreaterThan(1.5);
    expect(glyphRatio(specimen, /[.:|/\\()]/g)).toBeGreaterThan(0.34);
    expect(glyphRatio(specimen, /[01689]/g)).toBeLessThan(0.42);
    expect(lowerHalfGlyphCount(specimen)).toBeGreaterThan(upperHalfGlyphCount(specimen) * 0.8);
  });

  it("prioritizes shoe soles and openings over triangular peaks", () => {
    const specimen = renderShoesSpecimen(0.34, 1, { x: 0.5, y: 0.5 });

    expect(maxRunWidth(specimen, 0.57, 0.74)).toBeGreaterThan(30);
    expect(maxRunWidth(specimen, 0.22, 0.42)).toBeLessThan(maxRunWidth(specimen, 0.57, 0.74));
    expect(maxBoundedWhitespaceRuns(specimen, 0.3, 0.56, 10)).toBeGreaterThanOrEqual(2);
  });

  it("renders balloons as separated round ascii forms with trailing strings", () => {
    const specimen = renderBalloonSpecimen(0.5, 1, { x: 0.5, y: 0.5 });
    const bounds = visibleBounds(specimen);

    expect(visibleGlyphCount(specimen)).toBeGreaterThan(1500);
    expect(bounds.height / bounds.width).toBeGreaterThan(0.62);
    expect(separatedClusterRows(specimen)).toBeGreaterThanOrEqual(8);
    expect(glyphRatio(specimen, /[.:|/\\()]/g)).toBeGreaterThan(0.38);
    expect(lowerHalfGlyphCount(specimen)).toBeGreaterThan(320);
  });

  it("reveals the bouquet through a scan instead of showing the full specimen immediately", () => {
    const early = renderBouquetSpecimen(0.11, 1, { x: 0.5, y: 0.5 });
    const formed = renderBouquetSpecimen(0.2, 1, { x: 0.5, y: 0.5 });

    expect(visibleGlyphCount(formed)).toBeGreaterThan(visibleGlyphCount(early) * 1.8);
  });

  it("keeps the bouquet alive with time-based glyph breathing", () => {
    const firstFrame = renderBouquetSpecimen(0.2, 1, { x: 0.5, y: 0.5 });
    const laterFrame = renderBouquetSpecimen(0.2, 1.8, { x: 0.5, y: 0.5 });

    expect(laterFrame).not.toBe(firstFrame);
  });

  it("responds to pointer movement inside the bouquet grid", () => {
    const centered = renderBouquetSpecimen(0.2, 1, { x: 0.5, y: 0.5 });
    const pulled = renderBouquetSpecimen(0.2, 1, { x: 0.78, y: 0.36 });

    expect(pulled).not.toBe(centered);
  });

  it("preserves the previous bouquet linework renderer as a fallback", () => {
    const linework = renderBouquetLineworkSpecimen(0.22, 1, { x: 0.5, y: 0.5 });

    expect(visibleGlyphCount(linework)).toBeGreaterThan(1400);
    expect(glyphRatio(linework, /[.:|/\\()]/g)).toBeGreaterThan(0.5);
    expect(separatedClusterRows(linework)).toBeGreaterThanOrEqual(8);
  });

  it("uses a restrained density layer without merging the bouquet into one blob", () => {
    const linework = renderBouquetLineworkSpecimen(0.22, 1, { x: 0.5, y: 0.5 });
    const hybrid = renderBouquetHybridSpecimen(0.22, 1, { x: 0.5, y: 0.5 });
    const lineworkCount = visibleGlyphCount(linework);
    const hybridCount = visibleGlyphCount(hybrid);

    expect(renderBouquetSpecimen(0.22, 1, { x: 0.5, y: 0.5 })).toBe(hybrid);
    expect(hybridCount).toBeGreaterThan(lineworkCount * 1.05);
    expect(hybridCount).toBeLessThan(lineworkCount * 1.25);
    expect(glyphRatio(hybrid, /[.:]/g)).toBeGreaterThan(glyphRatio(linework, /[.:]/g));
    expect(glyphRatio(hybrid, /[01689]/g)).toBeLessThan(0.1);
    expect(internalVoidCount(hybrid)).toBeGreaterThan(16);
    expect(separatedClusterRows(hybrid)).toBeGreaterThanOrEqual(8);
  });

  it("renders a taller organic floral specimen instead of a flat flower basket", () => {
    const specimen = renderBouquetSpecimen(0.22, 1, { x: 0.5, y: 0.5 });
    const bounds = visibleBounds(specimen);
    const counts = lineGlyphCounts(specimen);
    const topThirdGlyphs = counts.slice(0, Math.floor(counts.length / 3)).reduce((sum, count) => sum + count, 0);
    const lowerThirdMax = Math.max(...counts.slice(Math.floor(counts.length * 0.66)));

    expect(bounds.height / bounds.width).toBeGreaterThan(0.72);
    expect(topThirdGlyphs).toBeGreaterThan(420);
    expect(lowerThirdMax).toBeLessThan(32);
  });

  it("avoids a long straight baseline below the bouquet", () => {
    const specimen = renderBouquetSpecimen(0.22, 1, { x: 0.5, y: 0.5 });
    const counts = lineGlyphCounts(specimen);

    expect(Math.max(...counts.slice(Math.floor(counts.length * 0.72)))).toBeLessThan(32);
  });

  it("uses fine ascii grain instead of heavy digit blocks", () => {
    const specimen = renderBouquetSpecimen(0.22, 1, { x: 0.5, y: 0.5 });

    expect(glyphRatio(specimen, /[.,:;il|/\\()]/g)).toBeGreaterThan(0.46);
    expect(glyphRatio(specimen, /[08@#]/g)).toBeLessThan(0.46);
  });

  it("keeps terminal digit grain as accents instead of the main texture", () => {
    const specimen = renderBouquetSpecimen(0.22, 1, { x: 0.5, y: 0.5 });

    expect(glyphRatio(specimen, /[01689]/g)).toBeGreaterThan(0.01);
    expect(glyphRatio(specimen, /[01689]/g)).toBeLessThan(0.08);
  });

  it("uses narrow shadow glyphs for most bouquet detail", () => {
    const specimen = renderBouquetSpecimen(0.22, 1, { x: 0.5, y: 0.5 });

    expect(glyphRatio(specimen, /[.:]/g)).toBeGreaterThan(0.12);
    expect(glyphRatio(specimen, /[.:|/\\()]/g)).toBeGreaterThan(0.5);
    expect(glyphRatio(specimen, /[01689]/g)).toBeLessThan(0.24);
  });

  it("does not let diagonal slashes dominate the flower heads", () => {
    const specimen = renderBouquetSpecimen(0.22, 1, { x: 0.5, y: 0.5 });

    expect(glyphRatio(specimen, /[/\\]/g)).toBeLessThan(0.42);
    expect(glyphRatio(specimen, /[().:]/g)).toBeGreaterThan(0.34);
  });

  it("keeps rose-like internal voids inside the flower mass", () => {
    const specimen = renderBouquetSpecimen(0.22, 1, { x: 0.5, y: 0.5 });

    expect(internalVoidCount(specimen)).toBeGreaterThan(18);
  });

  it("renders the bouquet on a high-resolution text grid", () => {
    const specimen = renderBouquetSpecimen(0.22, 1, { x: 0.5, y: 0.5 });
    const lines = specimen.split("\n");

    expect(lines.length).toBeGreaterThanOrEqual(72);
    expect(Math.max(...lines.map((line) => line.length))).toBeGreaterThanOrEqual(124);
  });

  it("separates the flower heads instead of rendering one dense blob", () => {
    const specimen = renderBouquetSpecimen(0.22, 1, { x: 0.5, y: 0.5 });

    expect(separatedClusterRows(specimen)).toBeGreaterThanOrEqual(8);
  });
});
