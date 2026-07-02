import { BRAND_ASSETS, BRAND_HEADER, BRAND_NAME, type BrandAssetKey } from "@/lib/brandGuide";

type BrandLogoProps = {
  variant?: BrandAssetKey;
  className?: string;
  heightPx?: number;
};

/** 가이드 SVG lockup — 헤더·UI 표준 BI */
export function BrandLogo({ variant = "primary", className = "", heightPx }: BrandLogoProps) {
  const asset = BRAND_ASSETS[variant];
  const height =
    heightPx ?? (variant === "primary" ? BRAND_HEADER.mRem * 16 : asset.height);

  return (
    <img
      src={asset.path}
      alt={BRAND_NAME}
      width={asset.width}
      height={asset.height}
      className={`block shrink-0 select-none ${className}`.trim()}
      style={{ height: `${height}px`, width: "auto" }}
      draggable={false}
    />
  );
}
