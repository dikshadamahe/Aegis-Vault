"use client";

import { motion } from "framer-motion";
import { Shield, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Registration failed", {
          description: data.error || "Please try again",
        });
      } else {
        toast.success("Account created successfully!", {
          description: "Redirecting to sign in...",
        });
        setTimeout(() => router.push("/sign-in"), 1500);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--aegis-accent-teal)] to-[var(--aegis-accent-blue)] opacity-10 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-[var(--aegis-accent-blue)] to-[var(--aegis-accent-teal)] opacity-10 blur-3xl"
        />
      </div>

      {/* Sign Up Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass-card-elevated p-10 w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--aegis-accent-teal)] to-[var(--aegis-accent-blue)] flex items-center justify-center shadow-[0_0_30px_rgba(0,191,165,0.4)]">
            <Shield className="w-10 h-10 text-[var(--aegis-bg-deep)]" strokeWidth={2.5} />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2 text-white">Create Account</h1>
        <p className="text-center text-[var(--aegis-text-muted)] mb-8">
          Start securing your passwords today
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              className="input-glass"
              required
              minLength={5}
              maxLength={30}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="input-glass"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-glass pr-12"
                required
                minLength={8}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-[var(--aegis-text-muted)] hover:text-[var(--aegis-accent-teal)] transition-colors disabled:opacity-60"
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-[var(--aegis-text-muted)] mt-2">
              At least 8 characters
            </p>
          </div>

          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => setAcceptTerms(!acceptTerms)}
              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                acceptTerms
                  ? "bg-[var(--aegis-accent-teal)] border-[var(--aegis-accent-teal)]"
                  : "border-[var(--aegis-border)]"
              }`}
            >
              {acceptTerms && <CheckCircle2 className="w-4 h-4 text-[var(--aegis-bg-deep)]" />}
            </button>
            <label className="text-sm text-[var(--aegis-text-muted)]">
              I accept the{" "}
              <Link href="/terms" className="text-[var(--aegis-accent-teal)] hover:underline">
                terms and conditions
              </Link>
            </label>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-accent w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create Account"}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--aegis-text-muted)]">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-[var(--aegis-accent-teal)] hover:underline font-medium"
          >
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
