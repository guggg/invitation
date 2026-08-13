import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");
const friendsExperience = readFileSync("src/components/FriendsExperience.tsx", "utf8");
const photoUploadExperience = readFileSync("src/components/PhotoUploadExperience.tsx", "utf8");

function lastRulesBetween(start: string, end: string) {
  const startIndex = css.lastIndexOf(start);
  return css.slice(startIndex, css.indexOf(end, startIndex));
}

describe("closed photo upload layout", () => {
  it("keeps the friend archive side by side until the phone breakpoint", () => {
    expect(css).toMatch(
      /\.photo-upload-closed-friend\s*\{[^}]*grid-template-columns:\s*minmax\(0, 0\.88fr\) minmax\(0, 1fr\)/s
    );

    const tabletRules = lastRulesBetween("@media (max-width: 900px)", "@media (max-width: 640px)");
    expect(tabletRules).not.toMatch(/\.photo-upload-friend\s*\{[^}]*grid-template-columns:\s*1fr/s);

    const phoneRules = lastRulesBetween("@media (max-width: 640px)", "@media (prefers-reduced-motion: reduce)");
    expect(phoneRules).toMatch(/\.photo-upload-friend\s*\{[^}]*grid-template-columns:\s*1fr/s);
  });

  it("keeps the archive introduction above one non-interactive closed panel", () => {
    const closedSection = friendsExperience.slice(
      friendsExperience.indexOf('id="secret-archive"'),
      friendsExperience.indexOf('id="shuttle"')
    );

    expect(closedSection).toContain('className="photo-upload-closed-panel"');
    expect(closedSection).toContain("<h3>秘密收藏室</h3>");
    expect(closedSection).toContain("交給我們一張代表你的照片");
    expect(closedSection).toContain("秘密收藏已截止");
    expect(closedSection).toContain("讓我們一起在婚禮當天揭曉");
    expect(closedSection).not.toMatch(/<(?:form|input|button)\b/);
    expect(closedSection).not.toContain("photo-upload-closed-identity");
    expect(closedSection).not.toContain("名字");
    expect(closedSection).not.toContain("手機號碼");
    expect(closedSection).not.toContain("photo-upload-closed-dropzone");
    expect(closedSection).not.toContain("photo-upload-consent");
    expect(closedSection).not.toContain("photo-upload-submit");
  });

  it("reuses every original envelope element without adding a sealed band", () => {
    const coreClasses = [
      "photo-archive-envelope",
      "photo-archive-flap",
      "photo-archive-letter",
      "photo-archive-script",
      "photo-archive-stamp",
      "photo-archive-postmark",
      "photo-archive-wax",
      "photo-archive-thread thread-one",
      "photo-archive-thread thread-two"
    ];

    for (const className of coreClasses) {
      expect(photoUploadExperience).toContain(`className="${className}"`);
      expect(friendsExperience).toContain(`className="${className}"`);
    }

    expect(friendsExperience).not.toContain("photo-archive-sealed-band");
    expect(css).not.toContain(".photo-archive-sealed-band");
  });
});
