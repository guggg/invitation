import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoUploadExperience } from "@/components/PhotoUploadExperience";

beforeEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();

  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, value))
  });
});

function imageFile(name = "guest.jpg", type = "image/jpeg") {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe("PhotoUploadExperience", () => {
  it("renders the friend secret archive variant and uploads a consented photo", async () => {
    vi.stubEnv("NEXT_PUBLIC_PHOTO_UPLOAD_TOKEN", "photo-token");
    const fetcher = vi.fn(
      async () =>
        ({
          ok: true,
          json: async () => ({ ok: true, fileName: "Yuan_0912345678.jpg" })
        }) as Response
    );

    render(<PhotoUploadExperience endpoint="https://example.com/photo" fetcher={fetcher as typeof fetch} sourceRoute="/" variant="friend" />);

    expect(screen.getByText("秘密收藏室")).toBeInTheDocument();
    expect(screen.getByText("不一定要有人臉，也可以是寵物、物件、手寫符號、icon，或任何能代表你的畫面。")).toBeInTheDocument();
    expect(screen.getByText("如果收到的照片數量超過實際需要，我們會依照整體製作需求挑選，可能不會使用到每一張照片。")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "Yuan" } });
    fireEvent.change(screen.getByLabelText("手機號碼"), { target: { value: "0912345678" } });
    fireEvent.change(screen.getByLabelText("選擇一張照片"), { target: { files: [imageFile()] } });
    fireEvent.click(screen.getByLabelText(/我同意提供這張照片/));
    fireEvent.click(screen.getByRole("button", { name: "封存這張照片" }));

    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    const calls = fetcher.mock.calls as unknown as [string, RequestInit][];
    const request = calls[0][1];
    const payload = JSON.parse(String(request.body));

    expect(payload).toMatchObject({
      token: "photo-token",
      sourceRoute: "/",
      name: "Yuan",
      phone: "0912345678",
      consent: true,
      fileName: "guest.jpg",
      mimeType: "image/jpeg"
    });
    expect(screen.getByText("照片已封存，我們收到這張代表你的密件了。")).toBeInTheDocument();
    expect(localStorage.setItem).toHaveBeenCalled();
  });

  it("keeps the family variant simpler and blocks submission without consent", async () => {
    const fetcher = vi.fn();

    render(
      <PhotoUploadExperience
        endpoint="https://example.com/photo"
        fetcher={fetcher as typeof fetch}
        sourceRoute="/family"
        variant="family"
      />
    );

    expect(screen.getByRole("heading", { name: "照片上傳" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("名字"), { target: { value: "王小明" } });
    fireEvent.change(screen.getByLabelText("手機號碼"), { target: { value: "0912345678" } });
    fireEvent.change(screen.getByLabelText("選擇一張照片"), { target: { files: [imageFile()] } });
    fireEvent.click(screen.getByRole("button", { name: "送出照片" }));

    expect(await screen.findByText("請先確認照片使用同意。")).toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects non-image files before submitting", async () => {
    const fetcher = vi.fn();

    render(<PhotoUploadExperience endpoint="https://example.com/photo" fetcher={fetcher as typeof fetch} sourceRoute="/" variant="friend" />);

    fireEvent.change(screen.getByLabelText("選擇一張照片"), {
      target: { files: [new File(["x"], "note.txt", { type: "text/plain" })] }
    });

    expect(screen.getByText("目前只接受照片檔案。")).toBeInTheDocument();
    expect(fetcher).not.toHaveBeenCalled();
  });
});
