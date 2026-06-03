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
    expect(screen.getByRole("radio", { name: /強烈推薦：搭乘接駁車/ })).toBeChecked();

    fireEvent.click(screen.getByLabelText("不克出席"));

    expect(screen.queryByLabelText("吃素份數")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("大人人數")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("參加證婚")).not.toBeInTheDocument();
  });

  it("formats phone input and submits shuttle transport choices in the payload", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchSpy);

    render(<RsvpForm endpoint="https://example.com" sourceRoute="/" variant="experimental" />);

    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0912345678" } });
    expect(screen.getByLabelText("聯絡電話")).toHaveValue("0912 345 678");
    fireEvent.click(screen.getByRole("button", { name: "0-4 歲人數 +" }));
    fireEvent.click(screen.getByRole("button", { name: "吃素份數 +" }));
    fireEvent.click(screen.getByRole("button", { name: "吃素份數 +" }));
    fireEvent.click(screen.getByRole("button", { name: "去程搭乘人數 +" }));
    fireEvent.click(screen.getByRole("button", { name: "去程搭乘人數 +" }));
    fireEvent.click(screen.getByRole("button", { name: "回程搭乘人數 +" }));
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
      transportMode: "shuttle",
      selfTransportMode: "",
      shuttleOutboundCount: 2,
      shuttleReturnCount: 1,
      needsShuttle: true
    });
  });

  it("caps classic RSVP steppers by guest counts", () => {
    render(<RsvpForm endpoint="https://example.com" sourceRoute="/family" variant="classic" />);

    const vegetarianPlus = screen.getByRole("button", { name: "吃素份數 +" });
    const shuttleOutboundPlus = screen.getByRole("button", { name: "去程搭乘人數 +" });
    const shuttleReturnPlus = screen.getByRole("button", { name: "回程搭乘人數 +" });

    fireEvent.click(vegetarianPlus);
    expect(vegetarianPlus).toBeDisabled();

    fireEvent.click(shuttleOutboundPlus);
    expect(shuttleOutboundPlus).toBeDisabled();
    fireEvent.click(shuttleReturnPlus);
    expect(shuttleReturnPlus).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "0-4 歲人數 +" }));
    fireEvent.click(screen.getByLabelText("需要兒童座椅"));
    const childSeatPlus = screen.getByRole("button", { name: "兒童座椅數量 +" });
    fireEvent.click(childSeatPlus);
    expect(childSeatPlus).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "0-4 歲人數 -" }));

    expect(screen.getByLabelText("兒童座椅數量")).toHaveTextContent("0");
    expect(vegetarianPlus).toBeDisabled();
    expect(shuttleOutboundPlus).toBeDisabled();
    expect(shuttleReturnPlus).toBeDisabled();
  });

  it("asks self-arranged guests to choose drive or taxi", async () => {
    render(<RsvpForm endpoint="https://example.com" sourceRoute="/" variant="classic" />);

    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0912345678" } });
    fireEvent.click(screen.getByRole("radio", { name: /自行前往/ }));
    fireEvent.click(screen.getByRole("button", { name: "送出回覆" }));

    await waitFor(() => expect(screen.getByText("請選擇自行前往方式")).toBeInTheDocument());
  });

  it("shows validation error for invalid phone format", async () => {
    render(<RsvpForm endpoint="https://example.com" sourceRoute="/" variant="classic" />);

    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0812345678" } });
    fireEvent.click(screen.getByRole("button", { name: "送出回覆" }));

    await waitFor(() => expect(screen.getByText("請填寫正確手機號碼")).toBeInTheDocument());
  });
});
