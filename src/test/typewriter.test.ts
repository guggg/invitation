import { describe, expect, it } from "vitest";
import { createTypewriterPlan, weddingWelcomeMessages } from "@/lib/typewriter";

describe("createTypewriterPlan", () => {
  it("types a message with variable delays", () => {
    const plan = createTypewriterPlan("歡迎你", {
      random: () => 0.5,
      typoRate: 0
    });

    expect(plan.map((step) => step.text)).toEqual(["歡", "歡迎", "歡迎你"]);
    expect(plan.every((step) => step.delayMs >= 40 && step.delayMs <= 220)).toBe(true);
  });

  it("can type a wrong character, delete it, then continue the intended message", () => {
    const values = [0.1, 0.2, 0.2, 0.2, 0.2, 0.2];
    const plan = createTypewriterPlan("歡迎你", {
      random: () => values.shift() ?? 0.2,
      typoRate: 1,
      typoGlyphs: ["啊"]
    });

    expect(plan.map((step) => step.text)).toEqual(["啊", "", "歡", "歡迎", "歡迎你"]);
  });

  it("keeps the wedding welcome message pool human and varied", () => {
    expect(weddingWelcomeMessages).toContain("歡迎你");
    expect(weddingWelcomeMessages).toContain("我很期待你來");
    expect(weddingWelcomeMessages).toContain("一起來跟我們玩");
    expect(new Set(weddingWelcomeMessages).size).toBeGreaterThanOrEqual(6);
  });
});
