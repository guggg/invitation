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
    fireEvent.click(screen.getByLabelText("請問有幾位大人呢？ +"));
    fireEvent.click(screen.getByLabelText("0-4 歲的小寶貝有幾位？ +"));
    fireEvent.click(screen.getByLabelText("4-8 歲的小夥伴有幾位？ +"));
    fireEvent.click(screen.getByLabelText("我們也想替吃素的朋友準備好，有幾位呢？ +"));
    fireEvent.click(screen.getByLabelText("我們也想替吃素的朋友準備好，有幾位呢？ +"));
    fireEvent.click(screen.getByLabelText("需要兒童座椅"));
    fireEvent.click(screen.getByLabelText("兒童座椅數量 +"));
    fireEvent.click(screen.getByRole("button", { name: "確認回覆內容" }));

    expect(screen.getByText("Yuan")).toBeInTheDocument();
    expect(screen.getByText("吃素 2")).toBeInTheDocument();
    expect(screen.getByText("大人 2 / 0-4 歲 1 / 4-8 歲 1")).toBeInTheDocument();
    expect(screen.getByText("參加證婚")).toBeInTheDocument();
    expect(screen.getByText("搭乘接駁車")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "確認送出" }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    const [, request] = fetcher.mock.calls[0];
    const payload = JSON.parse(request.body);

    expect(payload).toMatchObject({
      sourceRoute: "/",
      attendance: "attending",
      name: "Yuan",
      phone: "0912345678",
      vegetarianCount: 2,
      adultCount: 2,
      childCountUnder4: 1,
      childCount4to8: 1,
      needsChildSeat: true,
      childSeatCount: 1,
      attendsCeremony: true,
      needsShuttle: true
    });
  });

  it("allows navigating back to edit previous steps", () => {
    render(<FriendRsvpExperience endpoint="https://example.com/rsvp" />);

    // Step 1: Intent
    fireEvent.click(screen.getByRole("button", { name: "我會到場" }));

    // Step 2: Identity
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0912345678" } });

    // Go back from step 2 to step 1
    fireEvent.click(screen.getByRole("button", { name: "上一頁" }));
    expect(screen.getByRole("button", { name: "我會到場" })).toBeInTheDocument();

    // Go to step 2 again
    fireEvent.click(screen.getByRole("button", { name: "我會到場" }));
    // Value should still be retained
    expect(screen.getByLabelText("名字")).toHaveValue("Yuan");
    expect(screen.getByLabelText("聯絡電話")).toHaveValue("0912345678");

    // Go to step 3: Details
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByText("請問有幾位大人呢？")).toBeInTheDocument();

    // Go back from step 3 to step 2
    fireEvent.click(screen.getByRole("button", { name: "上一頁" }));
    expect(screen.getByLabelText("名字")).toBeInTheDocument();

    // Go to step 3 again
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    // Go to step 4: Card Preview
    fireEvent.click(screen.getByRole("button", { name: "確認回覆內容" }));
    expect(screen.getByText("出席確認")).toBeInTheDocument();

    // Go back from step 4 to step 3
    fireEvent.click(screen.getByRole("button", { name: "上一頁" }));
    expect(screen.getByText("請問有幾位大人呢？")).toBeInTheDocument();
  });

  it("lets declined guests skip meal details and keeps submission disabled without endpoint", () => {
    render(<FriendRsvpExperience endpoint="" />);

    fireEvent.click(screen.getByRole("button", { name: "這次無法參加" }));
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0911111111" } });
    fireEvent.click(screen.getByRole("button", { name: "確認回覆內容" }));

    expect(screen.queryByText("請問有幾位大人呢？")).not.toBeInTheDocument();
    expect(screen.getByText("不克出席")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "出席回覆尚未開放" })).toBeDisabled();
  });

  describe("onBlur field validation", () => {
    function goToIdentity() {
      render(<FriendRsvpExperience endpoint="https://example.com/rsvp" />);
      fireEvent.click(screen.getByRole("button", { name: "我會到場" }));
    }

    it("shows name error and marks input invalid when name field blurs empty", () => {
      goToIdentity();
      const nameInput = screen.getByLabelText("名字");
      fireEvent.blur(nameInput, { target: { value: "" } });

      expect(screen.getByText("請填寫名字")).toBeInTheDocument();
      expect(nameInput).toHaveAttribute("aria-invalid", "true");
      // phone error must not appear
      expect(screen.queryByText(/請填寫聯絡電話/)).not.toBeInTheDocument();
    });

    it("shows phone error when phone blurs with too-short value, no name error", () => {
      goToIdentity();
      fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
      const phoneInput = screen.getByLabelText("聯絡電話");
      fireEvent.blur(phoneInput, { target: { value: "123" } });

      expect(screen.getByText(/請填寫聯絡電話/)).toBeInTheDocument();
      expect(phoneInput).toHaveAttribute("aria-invalid", "true");
      expect(screen.queryByText("請填寫名字")).not.toBeInTheDocument();
    });

    it("rejects phone with 5 digits, accepts phone with 6 digits", () => {
      goToIdentity();
      const phoneInput = screen.getByLabelText("聯絡電話");

      // 5 chars → error
      fireEvent.blur(phoneInput, { target: { value: "12345" } });
      expect(screen.getByText(/請填寫聯絡電話/)).toBeInTheDocument();

      // 6 chars → no error
      fireEvent.blur(phoneInput, { target: { value: "123456" } });
      expect(screen.queryByText(/請填寫聯絡電話/)).not.toBeInTheDocument();
      expect(phoneInput).toHaveAttribute("aria-invalid", "false");
    });

    it("clears name error immediately when a valid value is typed after error (onChange path)", () => {
      goToIdentity();
      const nameInput = screen.getByLabelText("名字");

      // trigger error first
      fireEvent.blur(nameInput, { target: { value: "" } });
      expect(screen.getByText("請填寫名字")).toBeInTheDocument();

      // type a valid value — error should clear via onChange
      fireEvent.change(nameInput, { target: { value: "Y" } });
      expect(screen.queryByText("請填寫名字")).not.toBeInTheDocument();
    });

    it("re-entering identity after triggering errors via back navigation shows no stale errors", () => {
      goToIdentity();

      // trigger both errors by clicking next with empty fields
      fireEvent.click(screen.getByRole("button", { name: "下一步" }));
      expect(screen.getByText("請填寫名字")).toBeInTheDocument();
      expect(screen.getByText(/請填寫聯絡電話/)).toBeInTheDocument();

      // go back to intent
      fireEvent.click(screen.getByRole("button", { name: "上一頁" }));
      // re-enter identity
      fireEvent.click(screen.getByRole("button", { name: "我會到場" }));

      expect(screen.queryByText("請填寫名字")).not.toBeInTheDocument();
      expect(screen.queryByText(/請填寫聯絡電話/)).not.toBeInTheDocument();
    });
  });
});
