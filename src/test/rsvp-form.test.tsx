import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RsvpForm } from "@/components/RsvpForm";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("RsvpForm", () => {
  it("disables submission when the Apps Script endpoint is missing", () => {
    render(<RsvpForm endpoint="" sourceRoute="/family" variant="classic" />);

    expect(screen.getByRole("button", { name: "出席回覆尚未開放" })).toBeDisabled();
  });

  it("hides dietary and guest fields when the guest declines", () => {
    render(<RsvpForm endpoint="https://example.com" sourceRoute="/" variant="experimental" />);

    expect(screen.getByLabelText("吃素份數")).toBeInTheDocument();
    expect(screen.getByLabelText("參加證婚")).toBeInTheDocument();
    expect(screen.getByLabelText("搭乘接駁車（推薦搭乘）")).toBeChecked();

    fireEvent.click(screen.getByLabelText("不克出席"));

    expect(screen.queryByLabelText("吃素份數")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("大人人數")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("參加證婚")).not.toBeInTheDocument();
  });

  it("submits vinegar, ceremony, and shuttle choices in the payload", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    render(<RsvpForm endpoint="https://example.com" sourceRoute="/" variant="experimental" />);

    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0912345678" } });
    fireEvent.change(screen.getByLabelText("0-4 歲人數"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("吃素份數"), { target: { value: "2" } });
    fireEvent.click(screen.getByLabelText("參加證婚"));
    fireEvent.click(screen.getByRole("button", { name: "送出回覆" }));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    const [, request] = fetchSpy.mock.calls[0];
    const payload = JSON.parse(request.body);

    expect(payload).toMatchObject({
      attendance: "attending",
      name: "Yuan",
      phone: "0912345678",
      vegetarianCount: 2,
      childCountUnder4: 1,
      childCount4to8: 0,
      attendsCeremony: false,
      needsShuttle: true
    });
  });
});
