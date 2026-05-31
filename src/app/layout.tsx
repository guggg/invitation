import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "4J & Yuan 婚禮邀請",
  description: "4J 與 Yuan 的電子喜帖",
  openGraph: {
    title: "4J & Yuan 婚禮邀請",
    description: "2026.10.3 | 優聖美地",
    type: "website"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#10131d"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
