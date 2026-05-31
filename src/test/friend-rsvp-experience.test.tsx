import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FriendRsvpExperience } from "@/components/friends/FriendRsvpExperience";

describe("FriendRsvpExperience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("walks attending guests through the ritual and posts the same RSVP payload shape", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });

    render(<FriendRsvpExperience endpoint="https://example.com/rsvp" fetcher={fetcher} />);

    fireEvent.click(screen.getByRole("button", { name: "我會到場" }));
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0912345678" } });
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    fireEvent.click(screen.getByLabelText("葷食份數 +"));
    fireEvent.click(screen.getByLabelText("素食份數 +"));
    fireEvent.click(screen.getByLabelText("大人人數 +"));
    fireEvent.click(screen.getByLabelText("小孩人數 +"));
    fireEvent.click(screen.getByLabelText("需要兒童座椅"));
    fireEvent.click(screen.getByLabelText("兒童座椅數量 +"));
    fireEvent.click(screen.getByRole("button", { name: "確認回覆內容" }));

    expect(screen.getByText("Yuan")).toBeInTheDocument();
    expect(screen.getByText("葷食 2 / 素食 1")).toBeInTheDocument();
    expect(screen.getByText("大人 2 / 小孩 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "確認送出" }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    const [, request] = fetcher.mock.calls[0];
    const payload = JSON.parse(request.body);

    expect(payload).toMatchObject({
      sourceRoute: "/",
      attendance: "attending",
      name: "Yuan",
      phone: "0912345678",
      meatCount: 2,
      vegetarianCount: 1,
      adultCount: 2,
      childCount: 1,
      needsChildSeat: true,
      childSeatCount: 1
    });
  });

  it("lets declined guests skip meal details and keeps submission disabled without endpoint", () => {
    render(<FriendRsvpExperience endpoint="" />);

    fireEvent.click(screen.getByRole("button", { name: "這次無法參加" }));
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0911111111" } });
    fireEvent.click(screen.getByRole("button", { name: "確認回覆內容" }));

    expect(screen.queryByText("葷食份數")).not.toBeInTheDocument();
    expect(screen.getByText("不克出席")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "出席回覆尚未開放" })).toBeDisabled();
  });
});
