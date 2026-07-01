import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "주식 매매 리포트",
  description: "수익과 매매 타이밍을 한눈에",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-w-0 overflow-x-hidden antialiased">{children}</body>
    </html>
  );
}
