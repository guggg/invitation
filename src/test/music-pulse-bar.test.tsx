import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MusicPulseBar } from "@/components/friends/MusicPulseBar";
import {
  PORTAL_AUDIO_CUE_PHASE,
  PORTAL_INTRO_ENTER_EVENT,
  PORTAL_PHASE_CHANGE_EVENT
} from "@/lib/portal-events";

describe("MusicPulseBar", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
    delete document.body.dataset.portalPhase;
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
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

  it("arms muted playback on the intro click without showing the playing state", async () => {
    render(<MusicPulseBar initialNow={new Date("2026-10-02T15:29:30+08:00")} />);

    window.dispatchEvent(new CustomEvent(PORTAL_INTRO_ENTER_EVENT));

    await waitFor(() => {
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByRole("button", { name: "播放背景音樂" })).toHaveAttribute("aria-pressed", "false");
  });

  it("starts music when the intro reaches the one-second cue", async () => {
    render(<MusicPulseBar initialNow={new Date("2026-10-02T15:29:30+08:00")} />);

    window.dispatchEvent(
      new CustomEvent(PORTAL_PHASE_CHANGE_EVENT, { detail: { phase: PORTAL_AUDIO_CUE_PHASE } })
    );

    await waitFor(() => {
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    });
  });

  it("does not restart playback when done arrives after the one-second cue", async () => {
    render(<MusicPulseBar initialNow={new Date("2026-10-02T15:29:30+08:00")} />);

    window.dispatchEvent(
      new CustomEvent(PORTAL_PHASE_CHANGE_EVENT, { detail: { phase: PORTAL_AUDIO_CUE_PHASE } })
    );
    await waitFor(() => {
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    });

    window.dispatchEvent(new CustomEvent(PORTAL_PHASE_CHANGE_EVENT, { detail: { phase: "done" } }));
    await waitFor(() => {
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    });
  });
});
