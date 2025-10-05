"use client";

import { Archive } from "lucide-react";
import { useState } from "react";

type WebsiteLogoProps = {
  url?: string;
  websiteName: string;
  className?: string;
};

/**
 * Automatically fetches and displays website favicon/logo
 * Falls back to Archive icon if URL is not provided or logo fails to load
 */
export function WebsiteLogo({ url, websiteName, className = "w-5 h-5" }: WebsiteLogoProps) {
  const [logoError, setLogoError] = useState(false);

  // Extract domain from URL
  const getDomain = (urlString?: string): string | null => {
    if (!urlString) return null;
    try {
      const url = new URL(urlString.startsWith("http") ? urlString : `https://${urlString}`);
      return url.hostname.replace("www.", "");
    } catch {
      return null;
    }
  };

  const domain = getDomain(url);
  
  // Use Google's favicon service for automatic logo fetching
  const logoUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : null;

  // If no URL or logo failed to load, show default Archive icon
  if (!logoUrl || logoError) {
    return <Archive className={className} />;
  }

  return (
    <img
      src={logoUrl}
      alt={`${websiteName} logo`}
      className={className}
      onError={() => setLogoError(true)}
      loading="lazy"
    />
  );
}
