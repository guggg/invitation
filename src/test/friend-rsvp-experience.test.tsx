import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FriendRsvpExperience } from "@/components/friends/FriendRsvpExperience";

const defaultProps = {
  lineAddFriendUrl: "https://lin.ee/76OVDl7U",
  lineQrCodeSrc: "/images/line-official-qr.png"
};

describe("FriendRsvpExperience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("walks attending guests through the ritual and posts the same RSVP payload shape", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true })
    });

    render(<FriendRsvpExperience endpoint="https://example.com/rsvp" fetcher={fetcher} {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "我會到場" }));
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0912345678" } });
    fireEvent.click(screen.getByLabelText("女方親友"));
    expect(screen.getByLabelText("聯絡電話")).toHaveValue("0912 345 678");
    fireEvent.click(screen.getByLabelText("需要實體喜帖"));
    fireEvent.change(screen.getByLabelText("喜帖寄送地址"), { target: { value: "台北市信義區 1 號" } });
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    fireEvent.click(screen.getByLabelText("請問有幾位大人呢？ +"));
    fireEvent.click(screen.getByLabelText("0-4 歲的小寶貝有幾位？ +"));
    fireEvent.click(screen.getByLabelText("4-8 歲的小夥伴有幾位？ +"));
    fireEvent.click(screen.getByLabelText("我們也想替吃素的朋友準備好，有幾位呢？ +"));
    fireEvent.click(screen.getByLabelText("我們也想替吃素的朋友準備好，有幾位呢？ +"));
    fireEvent.click(screen.getByLabelText("需要兒童座椅"));
    fireEvent.click(screen.getByLabelText("兒童座椅數量 +"));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    fireEvent.click(screen.getByLabelText("去程要幫你保留幾個接駁座位？ +"));
    fireEvent.click(screen.getByRole("button", { name: "確認回覆內容" }));

    expect(screen.getByText("Yuan")).toBeInTheDocument();
    expect(screen.getByText("女方親友")).toBeInTheDocument();
    expect(screen.getByText("吃素")).toBeInTheDocument();
    expect(screen.getByText("會一起見證")).toBeInTheDocument();
    expect(screen.getByText("搭乘接駁車")).toBeInTheDocument();
    expect(screen.getAllByText("2 位").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "確認送出" }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    expect(screen.getAllByText(/我們收到你的回覆了/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /加入 LINE 官方帳號/i })).toHaveAttribute(
      "href",
      "https://lin.ee/76OVDl7U"
    );
    const [, request] = fetcher.mock.calls[0];
    const payload = JSON.parse(request.body);

    expect(payload).toMatchObject({
      sourceRoute: "/",
      attendance: "attending",
      name: "Yuan",
      phone: "0912345678",
      guestSide: "bride",
      needsPhysicalInvitation: true,
      physicalInvitationAddress: "台北市信義區 1 號",
      vegetarianCount: 2,
      adultCount: 2,
      childCountUnder4: 1,
      childCount4to8: 1,
      needsChildSeat: true,
      childSeatCount: 1,
      attendsCeremony: true,
      transportMode: "shuttle",
      selfTransportMode: "",
      shuttleOutboundCount: 2,
      shuttleReturnCount: 1,
      needsShuttle: true
    });
  }, 10000);

  it("allows navigating back to edit previous steps", () => {
    render(<FriendRsvpExperience endpoint="https://example.com/rsvp" {...defaultProps} />);

    // Step 1: Intent
    fireEvent.click(screen.getByRole("button", { name: "我會到場" }));

    // Step 2: Identity
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0912345678" } });
    fireEvent.click(screen.getByLabelText("男方親友"));

    // Go back from step 2 to step 1
    fireEvent.click(screen.getByRole("button", { name: "上一頁" }));
    expect(screen.getByRole("button", { name: "我會到場" })).toBeInTheDocument();

    // Go to step 2 again
    fireEvent.click(screen.getByRole("button", { name: "我會到場" }));
    // Value should still be retained
    expect(screen.getByLabelText("名字")).toHaveValue("Yuan");
    expect(screen.getByLabelText("聯絡電話")).toHaveValue("0912 345 678");

    // Go to step 3: Details
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByText("請問有幾位大人呢？")).toBeInTheDocument();

    // Go back from step 3 to step 2
    fireEvent.click(screen.getByRole("button", { name: "上一頁" }));
    expect(screen.getByLabelText("名字")).toBeInTheDocument();

    // Go to step 3 again
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    // Go to step 4: Transport
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByText("交通提醒")).toBeInTheDocument();

    // Go to step 5: Card Preview
    fireEvent.click(screen.getByRole("button", { name: "確認回覆內容" }));
    expect(screen.getByText("Ready To Send")).toBeInTheDocument();

    // Go back from step 5 to step 4
    fireEvent.click(screen.getByRole("button", { name: "上一頁" }));
    expect(screen.getByText("交通提醒")).toBeInTheDocument();

    // Go back from step 4 to step 3
    fireEvent.click(screen.getByRole("button", { name: "上一頁" }));
    expect(screen.getByText("請問有幾位大人呢？")).toBeInTheDocument();
  });

  it("caps dependent steppers at available guest counts", () => {
    render(<FriendRsvpExperience endpoint="https://example.com/rsvp" {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "我會到場" }));
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0912345678" } });
    fireEvent.click(screen.getByLabelText("男方親友"));
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));

    const vegetarianPlus = screen.getByLabelText("我們也想替吃素的朋友準備好，有幾位呢？ +");
    const childSeatPlus = () => screen.getByLabelText("兒童座椅數量 +");

    expect(vegetarianPlus).not.toBeDisabled();
    fireEvent.click(vegetarianPlus);
    expect(vegetarianPlus).toBeDisabled();

    fireEvent.click(screen.getByLabelText("0-4 歲的小寶貝有幾位？ +"));
    fireEvent.click(screen.getByLabelText("需要兒童座椅"));
    fireEvent.click(childSeatPlus());
    expect(childSeatPlus()).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    const shuttleOutboundPlus = screen.getByLabelText("去程要幫你保留幾個接駁座位？ +");
    const shuttleReturnPlus = screen.getByLabelText("回程要幫你保留幾個接駁座位？ +");
    fireEvent.click(shuttleOutboundPlus);
    expect(shuttleOutboundPlus).toBeDisabled();
    fireEvent.click(shuttleReturnPlus);
    expect(shuttleReturnPlus).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "上一頁" }));
    fireEvent.click(screen.getByLabelText("0-4 歲的小寶貝有幾位？ -"));

    expect(screen.getByText("兒童座椅數量").parentElement).toHaveTextContent("0");
    expect(screen.getByLabelText("我們也想替吃素的朋友準備好，有幾位呢？ +")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "下一步" }));
    expect(screen.getByLabelText("去程要幫你保留幾個接駁座位？ +")).toBeDisabled();
    expect(screen.getByLabelText("回程要幫你保留幾個接駁座位？ +")).toBeDisabled();
  });

  it("lets declined guests skip meal details and keeps submission disabled without endpoint", () => {
    render(<FriendRsvpExperience endpoint="" {...defaultProps} />);

    fireEvent.click(screen.getByRole("button", { name: "這次無法參加" }));
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("聯絡電話"), { target: { value: "0911111111" } });
    fireEvent.click(screen.getByLabelText("男方親友"));
    fireEvent.click(screen.getByRole("button", { name: "確認回覆內容" }));

    expect(screen.queryByText("請問有幾位大人呢？")).not.toBeInTheDocument();
    expect(screen.getByText("Blessing Saved")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "出席回覆尚未開放" })).toBeDisabled();
  });

  describe("onBlur field validation", () => {
    function goToIdentity() {
      render(<FriendRsvpExperience endpoint="https://example.com/rsvp" {...defaultProps} />);
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

    it("shows phone error when phone blurs with invalid value, no name error", () => {
      goToIdentity();
      fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
      const phoneInput = screen.getByLabelText("聯絡電話");
      fireEvent.blur(phoneInput, { target: { value: "123" } });

      expect(screen.getByText(/請填寫正確手機號碼/)).toBeInTheDocument();
      expect(phoneInput).toHaveAttribute("aria-invalid", "true");
      expect(screen.queryByText("請填寫名字")).not.toBeInTheDocument();
    });

    it("rejects non-mobile format and accepts Taiwan mobile format", () => {
      goToIdentity();
      const phoneInput = screen.getByLabelText("聯絡電話");

      fireEvent.change(phoneInput, { target: { value: "0812345678" } });
      fireEvent.blur(phoneInput, { target: { value: "0812 345 678" } });
      expect(screen.getByText(/請填寫正確手機號碼/)).toBeInTheDocument();

      fireEvent.change(phoneInput, { target: { value: "0912345678" } });
      expect(phoneInput).toHaveValue("0912 345 678");
      fireEvent.blur(phoneInput, { target: { value: "0912 345 678" } });
      expect(screen.queryByText(/請填寫正確手機號碼/)).not.toBeInTheDocument();
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
