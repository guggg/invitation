import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MusicPulseBar } from "@/components/friends/MusicPulseBar";

describe("MusicPulseBar", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
    HTMLMediaElement.prototype.pause = vi.fn();
  });

  it("shows the compact wedding countdown inside the music strip", () => {
    render(<MusicPulseBar initialNow={new Date("2026-10-02T15:29:30+08:00")} />);

    expect(screen.getByText("距離婚禮還有 01 天 01:00:30")).toBeInTheDocument();
  });

  it("shows a reduced-motion welcome message without typing animation", () => {
    render(<MusicPulseBar initialNow={new Date("2026-10-02T15:29:30+08:00")} />);

    expect(screen.getByText("歡迎你")).toBeInTheDocument();
  });
});
