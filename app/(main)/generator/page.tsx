"use client";

import { AegisLayout } from "@/components/aegis-layout";
import { motion } from "framer-motion";
import { RefreshCw, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function GeneratorPage() {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [lowercase, setLowercase] = useState(true);
  const [uppercase, setUppercase] = useState(true);
  const [digits, setDigits] = useState(true);
  const [specialCharacters, setSpecialCharacters] = useState(true);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generatePassword = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          length,
          lowercase,
          uppercase,
          digits,
          specialCharacters,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate password");
      const data = await res.json();
      setPassword(data.password);
      setCopied(false);
    } catch (error) {
      toast.error("Failed to generate password");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    toast.success("Password copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AegisLayout>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-[var(--aegis-text-heading)] to-[var(--aegis-accent-blue)] bg-clip-text text-transparent">
          Password Generator
        </h1>
        <p className="text-[var(--aegis-text-muted)] text-lg">
          Generate strong, secure passwords in seconds
        </p>
      </motion.div>

      <div className="max-w-2xl mx-auto">
        {/* Generated Password Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-card-elevated p-8 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1 font-mono text-2xl text-[var(--aegis-text-heading)] break-all">
              {password || "Click generate to create a password"}
            </div>
            {password && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="w-12 h-12 rounded-lg bg-[var(--aegis-accent-teal)] flex items-center justify-center text-[var(--aegis-bg-deep)] hover:shadow-[0_0_20px_rgba(0,191,165,0.4)] transition-all"
              >
                {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card p-8 space-y-6"
        >
          {/* Length Slider */}
          <div>
            <div className="flex justify-between mb-3">
              <label className="text-sm font-medium text-[var(--aegis-text-body)]">
                Length
              </label>
              <span className="text-sm font-mono text-[var(--aegis-accent-teal)]">
                {length}
              </span>
            </div>
            <input
              type="range"
              min="6"
              max="50"
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full h-2 bg-[var(--aegis-bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--aegis-accent-teal)]"
            />
          </div>

          {/* Checkboxes */}
          <div className="space-y-4">
            {[
              { label: "Lowercase (a-z)", value: lowercase, setter: setLowercase },
              { label: "Uppercase (A-Z)", value: uppercase, setter: setUppercase },
              { label: "Digits (0-9)", value: digits, setter: setDigits },
              { label: "Special Characters (!@#$%)", value: specialCharacters, setter: setSpecialCharacters },
            ].map((option) => (
              <label
                key={option.label}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div
                  onClick={() => option.setter(!option.value)}
                  className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    option.value
                      ? "bg-[var(--aegis-accent-teal)] border-[var(--aegis-accent-teal)]"
                      : "border-[var(--aegis-border)] group-hover:border-[var(--aegis-border-hover)]"
                  }`}
                >
                  {option.value && <Check className="w-4 h-4 text-[var(--aegis-bg-deep)]" />}
                </div>
                <span className="text-[var(--aegis-text-body)] group-hover:text-[var(--aegis-text-heading)] transition-colors">
                  {option.label}
                </span>
              </label>
            ))}
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generatePassword}
            disabled={loading}
            className="btn-accent w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Generating..." : "Generate Password"}
          </motion.button>
        </motion.div>
      </div>
    </AegisLayout>
  );
}
