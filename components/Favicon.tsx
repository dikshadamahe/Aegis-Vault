"use client";

import { Globe } from "lucide-react";
import { useState } from "react";

type Props = {
  domain?: string | null;
  className?: string;
};

export default function Favicon({ domain, className = "w-5 h-5" }: Props) {
  const [error, setError] = useState(false);
  if (!domain || error) return <Globe className={className} />;
  const src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  return (
    <img
      src={src}
      alt={`${domain} favicon`}
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}
