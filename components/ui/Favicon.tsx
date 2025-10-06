import { Globe } from "lucide-react";

interface FaviconProps {
  domain: string | null | undefined;
  size?: number;
  className?: string;
}

export function Favicon({ domain, size = 64, className = "" }: FaviconProps) {
  // If no domain provided, show default Globe icon
  if (!domain || domain.trim() === "") {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-white/5 ${className}`}
        style={{ width: size / 2, height: size / 2 }}
      >
        <Globe className="w-4 h-4 text-white/40" />
      </div>
    );
  }

  // Construct Google Favicon service URL
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    domain
  )}&sz=${size}`;

  return (
    <img
      src={faviconUrl}
      alt={`${domain} favicon`}
      className={`rounded-lg bg-white/5 ${className}`}
      style={{ width: size / 2, height: size / 2 }}
      onError={(e) => {
        // Fallback to Globe icon if image fails to load
        const target = e.target as HTMLImageElement;
        target.style.display = "none";
        if (target.nextElementSibling) {
          (target.nextElementSibling as HTMLElement).style.display = "flex";
        }
      }}
    />
  );
}

// Helper function to extract domain from URL
export function extractDomain(url: string | null | undefined): string | null {
  if (!url || url.trim() === "") {
    return null;
  }

  try {
    // Add protocol if missing
    const urlWithProtocol = url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;

    const urlObject = new URL(urlWithProtocol);
    return urlObject.hostname;
  } catch (error) {
    // If URL parsing fails, try to extract domain manually
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/i);
    return match ? match[1] : null;
  }
}
