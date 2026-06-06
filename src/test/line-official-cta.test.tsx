import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LineOfficialCta } from "@/components/LineOfficialCta";

describe("LineOfficialCta", () => {
  it("renders footer copy with always-visible QR code", () => {
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

    // QR code is always visible, no toggle needed
    expect(screen.getByAltText("LINE 官方帳號 QR Code")).toBeInTheDocument();
    expect(screen.getByText("手機掃描加入 LINE 官方帳號")).toBeInTheDocument();
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
