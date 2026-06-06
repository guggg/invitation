import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LineOfficialCta } from "@/components/LineOfficialCta";

describe("LineOfficialCta", () => {
  it("renders footer copy and toggles the QR code panel", () => {
    render(
      <LineOfficialCta
        variant="footer"
        lineAddFriendUrl="https://lin.ee/76OVDl7U"
        qrCodeSrc="/2dbarcodes_BW/M_gainfriends_2dbarcodes_BW.png"
      />
    );

    expect(screen.getByText("把婚禮提醒收進 LINE")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /加入 LINE 官方帳號/i })).toHaveAttribute(
      "href",
      "https://lin.ee/76OVDl7U"
    );

    const toggle = screen.getByRole("button", { name: /掃描 QR Code/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: /收起 QR Code/i })).toHaveAttribute(
      "aria-expanded",
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: /收起 QR Code/i }));
    expect(screen.getByRole("button", { name: /掃描 QR Code/i })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
  });

  it("safely disables the primary action when the LINE URL is invalid", () => {
    render(
      <LineOfficialCta
        variant="rsvp-success"
        lineAddFriendUrl="TODO"
        qrCodeSrc="/2dbarcodes_BW/M_gainfriends_2dbarcodes_BW.png"
      />
    );

    expect(screen.queryByRole("link", { name: /加入 LINE 官方帳號/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /加入 LINE 官方帳號/i })).toBeDisabled();
  });
});
