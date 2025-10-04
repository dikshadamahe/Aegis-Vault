"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { EyeIcon, EyeOffIcon, Shield } from "lucide-react";

type Props = {
  open: boolean;
  reason?: string;
  onSubmit: (passphrase: string) => void;
  onCancel: () => void;
};

export default function PassphraseModal({ open, onSubmit, onCancel, reason }: Props) {
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!open) setPass("");
  }, [open]);

  const strength = useMemo(() => scorePassphrase(pass), [pass]);

  return (
    <Dialog open={open} onOpenChange={(v) => (!v ? onCancel() : null)}>
      <DialogContent className="backdrop-blur-2xl bg-white/5 border border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Unlock Vault
          </DialogTitle>
          <DialogDescription>
            {reason || "Enter your passphrase to continue."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="passphrase">Passphrase</Label>
            <div className="flex items-center gap-2">
              <Input
                id="passphrase"
                type={show ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Your passphrase"
                autoFocus
              />
              <Button type="button" variant="outline" size="icon" onClick={() => setShow((s) => !s)}>
                {show ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-300">Strength</span>
              <span className="text-zinc-400">{labelForScore(strength)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-700 overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${(strength + 1) * 20}%`, backgroundColor: colorForScore(strength) }} />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            <Button type="button" onClick={() => onSubmit(pass)} disabled={!pass}>Confirm</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function scorePassphrase(p: string): number {
  let score = 0;
  if (p.length >= 8) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[a-z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  return Math.min(4, score - 1); // -1 so empty -> -1, short -> 0..4
}

function labelForScore(s: number) {
  return ["Very Weak", "Weak", "Fair", "Good", "Strong"][Math.max(0, s)] || "Very Weak";
}

function colorForScore(s: number) {
  return ["#ef4444", "#f59e0b", "#eab308", "#84cc16", "#22c55e"][Math.max(0, s)] || "#ef4444";
}
