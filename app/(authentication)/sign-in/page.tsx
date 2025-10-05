"use client";

import { motion } from "framer-motion";
import { Shield, ArrowRight } from "lucide-react";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

export default function SignInPage() {
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        emailOrUsername,
        password,
      });

      if (result?.error) {
        toast.error("Authentication failed", {
          description: result.error,
        });
      } else {
        toast.success("Welcome back!");
        router.push("/vault");
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

      {/* Sign In Card */}
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

        <h1 className="text-3xl font-bold text-center mb-2">Welcome Back</h1>
        <p className="text-center text-[var(--aegis-text-muted)] mb-8">
          Sign in to access your Aegis Vault
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--aegis-text-body)]">
              Email or Username
            </label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="john@example.com"
              className="input-glass"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-[var(--aegis-text-body)]">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-glass"
              required
              disabled={loading}
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="btn-accent w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--aegis-text-muted)]">
          Don't have an account?{" "}
          <Link
            href="/sign-up"
            className="text-[var(--aegis-accent-teal)] hover:underline font-medium"
          >
            Create one
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
