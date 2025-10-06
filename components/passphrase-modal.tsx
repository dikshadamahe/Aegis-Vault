"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2 } from "lucide-react";

type PassphraseModalProps = {
  onSubmit: (passphrase: string) => Promise<void> | void;
  onCancel: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
};

export default function PassphraseModal({
  onSubmit,
  onCancel,
  title = "Unlock Vault",
  description = "Enter your master passphrase to continue",
  submitLabel = "Unlock",
}: PassphraseModalProps) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;

    setLoading(true);
    setError("");

    try {
      await onSubmit(value.trim());
      setValue("");
    } catch (err: any) {
      setError(err?.message || "Incorrect passphrase. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.form
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <div className="glass-card-elevated" style={{ padding: "var(--space-4)" }}>
          <div className="flex items-center justify-center mb-4">
            <motion.div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, var(--aegis-accent-primary) 0%, var(--aegis-accent-teal) 100%)",
              }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Lock className="w-6 h-6 text-white" strokeWidth={2.5} />
            </motion.div>
          </div>
          
          <h2 className="text-center text-2xl font-bold mb-2 text-[var(--aegis-text-heading)]">
            {title}
          </h2>
          <p className="text-center text-sm text-[var(--aegis-text-muted)] mb-6">
            {description}
          </p>
          
          <div className="space-y-4">
            <div>
              <input
                type="password"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
                placeholder="Master passphrase"
                className="input-glass w-full"
                autoFocus
                disabled={loading}
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-red-400 mt-2"
                >
                  {error}
                </motion.p>
              )}
            </div>
            
            <div className="flex gap-3">
              <motion.button
                type="button"
                onClick={onCancel}
                className="flex-1 btn-ghost"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                className="flex-1 btn-accent disabled:opacity-50 flex items-center justify-center gap-2"
                disabled={loading || !value.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                    {submitLabel.endsWith("...") ? submitLabel : `${submitLabel}...`}
                  </>
                ) : (
                  submitLabel
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}
