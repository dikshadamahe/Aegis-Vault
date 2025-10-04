"use client";

import { useCopyToClipboard } from "@uidotdev/usehooks";
import { Check, Copy } from "lucide-react";
import { Button } from "./ui/button";
import React, { useCallback, useEffect } from "react";
import { toast } from "sonner";

interface CopyToClipboardProps {
  className?: string;
  text?: string;
}

const CopyToClipboard = ({ className, text }: CopyToClipboardProps) => {
  const [copiedText, copyToClipboard] = useCopyToClipboard();
  const hasCopiedText = Boolean(copiedText);

  const handleCopyClicked = useCallback(() => {
    try {
      copyToClipboard(text as string);
      toast.success("Copied");
      // Auto-clear clipboard and local state after ~15s
      const timeoutMs = 15000; // 10-20s; choose 15s
      setTimeout(async () => {
        try {
          // overwrite clipboard with empty string (best-effort)
          await navigator.clipboard.writeText("");
          copyToClipboard("");
          toast.info("Clipboard cleared");
        } catch {}
      }, timeoutMs);
    } catch (error) {
      toast.error("Failed to copy");
    }
  }, [copyToClipboard, text]);

  return (
    <Button
      data-testid="copy-button"
      variant="outline"
      size="icon"
      onClick={handleCopyClicked}
      aria-label={hasCopiedText ? "Copied" : "Copy"}
      disabled={!text}
    >
      {hasCopiedText ? (
        <Check className="h-5 w-5" />
      ) : (
        <Copy className="h-5 w-5" />
      )}
    </Button>
  );
};

export default CopyToClipboard;
