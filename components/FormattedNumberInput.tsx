"use client";

import { useEffect, useState } from "react";
import { fmt } from "@/lib/calc";

export function parseFormattedNumber(s: string): number {
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function FormattedNumberInput({
  value,
  onChange,
  className = "",
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    setText(value ? fmt(value) : "");
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const digits = e.target.value.replace(/[^\d]/g, "");
        const n = digits ? Number(digits) : 0;
        setText(digits ? fmt(n) : "");
        onChange(n);
      }}
    />
  );
}
