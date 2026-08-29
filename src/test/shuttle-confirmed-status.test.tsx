import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FamilyShuttleTable } from "@/components/FamilyShuttleTable";
import { ShuttleBoard } from "@/components/friends/ShuttleBoard";
import { ShuttlePicker } from "@/components/friends/ShuttlePicker";

describe("confirmed shuttle schedule", () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    });
  });

  it("shows the board as on time without tentative status copy", () => {
    const { container } = render(<ShuttleBoard />);

    expect(screen.getByLabelText("班次狀態：準時，ON TIME")).toHaveTextContent("ON TIME");
    expect(container.innerHTML).not.toContain("暫");
    expect(container).not.toHaveTextContent("PENDING");
    expect(container.querySelector(".led-dot--green")).toBeInTheDocument();
    expect(container.querySelector(".led-dot--amber")).not.toBeInTheDocument();
  });

  it("does not show tentative badges in picker or family table", () => {
    const picker = render(<ShuttlePicker />);
    fireEvent.click(screen.getByRole("button", { name: /我是晚宴賓客/ }));
    expect(picker.container.innerHTML).not.toContain("暫");
    picker.unmount();

    const family = render(<FamilyShuttleTable />);
    expect(family.container.innerHTML).not.toContain("暫");
  });
});
