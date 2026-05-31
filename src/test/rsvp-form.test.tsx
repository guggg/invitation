import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RsvpForm } from "@/components/RsvpForm";

describe("RsvpForm", () => {
  it("disables submission when the Apps Script endpoint is missing", () => {
    render(<RsvpForm endpoint="" sourceRoute="/family" variant="classic" />);

    expect(screen.getByRole("button", { name: "出席回覆尚未開放" })).toBeDisabled();
  });

  it("hides meal and guest fields when the guest declines", () => {
    render(<RsvpForm endpoint="https://example.com" sourceRoute="/" variant="experimental" />);

    expect(screen.getByLabelText("葷食份數")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("不克出席"));

    expect(screen.queryByLabelText("葷食份數")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("大人人數")).not.toBeInTheDocument();
  });
});
