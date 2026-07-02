import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "M tock Brand Guidelines",
  robots: "noindex",
};

const FONT_URL =
  "https://fonts.googleapis.com/css2?" +
  "family=Plus+Jakarta+Sans:wght@400;500;600;700&" +
  "family=DM+Sans:opsz,wght@9..40,400;500;600;700&" +
  "family=Inter+Tight:wght@400;500;600;700&" +
  "family=Space+Grotesk:wght@400;500;600;700&" +
  "family=Outfit:wght@400;500;600;700&" +
  "family=Manrope:wght@400;500;600;700&" +
  "family=Syne:wght@400;500;600;700&" +
  "family=Sora:wght@400;500;600&" +
  "family=Lexend:wght@400;500;600&" +
  "family=Figtree:wght@400;500;600;700&" +
  "family=Instrument+Sans:wght@400;500;600&" +
  "family=Archivo:wght@400;500;600;700&" +
  "family=Rubik:wght@400;500;600&" +
  "family=Work+Sans:wght@400;500;600&" +
  "family=IBM+Plex+Sans:wght@400;500;600&" +
  "family=JetBrains+Mono:wght@400;500;600&" +
  "family=Be+Vietnam+Pro:wght@400;500;600&" +
  "display=swap";

export default function BrandPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONT_URL} />
      {children}
    </>
  );
}
