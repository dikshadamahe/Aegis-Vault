import { Globe } from "lucide-react";

interface FaviconProps {
  domain: string | null | undefined;
  size?: number;
  className?: string;
}

export function Favicon({ domain, size = 64, className = "" }: FaviconProps) {
  const hostname = extractDomain(domain);
  const dimension = size / 2;

  if (!hostname) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-white/5 ${className}`}
        style={{ width: dimension, height: dimension }}
      >
        <Globe className="w-4 h-4 text-white/40" />
      </div>
    );
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=${size}`;

  return (
    <div
      className={`relative rounded-lg bg-white/5 overflow-hidden ${className}`}
      style={{ width: dimension, height: dimension }}
    >
      <img
        src={faviconUrl}
        alt={`${hostname} favicon`}
        className="absolute inset-0 h-full w-full object-cover"
        onError={(event) => handleImageError(event.currentTarget)}
        loading="lazy"
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity" data-fallback>
        <Globe className="w-4 h-4 text-white/40" />
      </div>
    </div>
  );
}

export function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const hasScheme = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed);
    const { hostname } = new URL(hasScheme ? trimmed : `https://${trimmed}`);
    return hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function handleImageError(img: HTMLImageElement) {
  img.style.display = "none";
  const fallback = img.parentElement?.querySelector<HTMLElement>("[data-fallback]");
  if (fallback) {
    fallback.style.opacity = "1";
  }
}
