import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "주식 매매 리포트",
  description: "수익과 매매 타이밍을 한눈에",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
