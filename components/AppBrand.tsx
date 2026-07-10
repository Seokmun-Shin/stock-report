import { BrandLogo } from "@/components/BrandLogo";

/** M tock — Primary SVG lockup (헤더 BI) */
export function AppBrand() {
  return <AppBrandV10 />;
}

/** Primary Lockup · Standard */
export function AppBrandV10() {
  return (
    <span className="inline-flex shrink-0 items-center" title="M tock" aria-label="M tock">
      <BrandLogo variant="primary" className="ui-brand-logo" />
    </span>
  );
}

/** Secondary Lockup · Ink Box */
export function AppBrandV10Box() {
  return (
    <span className="inline-flex shrink-0 items-center" title="M tock" aria-label="M tock">
      <BrandLogo variant="inkBox" />
    </span>
  );
}
