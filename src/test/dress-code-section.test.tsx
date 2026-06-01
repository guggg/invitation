import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DressCodeSection } from "@/components/friends/DressCodeSection";
import { wedding } from "@/lib/wedding";

describe("DressCodeSection", () => {
  it("renders the earth-tone palette and practical dress notes", () => {
    render(<DressCodeSection dressCode={wedding.dressCode} sectionIndex={3} />);

    expect(screen.getByRole("heading", { name: "極簡大地" })).toBeInTheDocument();
    expect(screen.getByText("灰米色")).toBeInTheDocument();
    expect(screen.getByText("#B5B0A1")).toBeInTheDocument();
    expect(screen.getByText("燕麥灰")).toBeInTheDocument();
    expect(screen.getByText(/全白裝扮/)).toBeInTheDocument();
    expect(screen.getByText(/平底鞋或粗跟鞋/)).toBeInTheDocument();
  });
});
