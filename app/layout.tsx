import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "M tock",
  description: "수익과 매매 타이밍을 한눈에",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const themeBootScript = `(function(){try{var p=JSON.parse(localStorage.getItem("stock-report-app-preferences")||"{}");document.documentElement.dataset.theme=p.theme==="light"?"light":"dark";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-theme="dark" suppressHydrationWarning>
      <head>
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBootScript}
        </Script>
      </head>
      <body className="min-w-0 overflow-x-hidden antialiased">{children}</body>
    </html>
  );
}
