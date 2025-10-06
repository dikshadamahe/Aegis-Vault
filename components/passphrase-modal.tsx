"use client";

import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Eye, EyeOff } from "lucide-react";

type PassphraseModalProps = {
	open: boolean;
	reason?: string;
	onSubmit: (passphrase: string) => Promise<void> | void;
	onCancel: () => void;
};

export default function PassphraseModal({ open, reason, onSubmit, onCancel }: PassphraseModalProps) {
	const [value, setValue] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showPassphrase, setShowPassphrase] = useState(false);

	useEffect(() => {
		if (!open) {
			setValue("");
			setError(null);
			setIsSubmitting(false);
		}
	}, [open]);

	const handleSubmit = async (event: FormEvent) => {
		event.preventDefault();
		if (!value.trim() || isSubmitting) return;

		setIsSubmitting(true);
		setError(null);

		try {
			await onSubmit(value.trim());
			setValue("");
		} catch (err: any) {
			const message = typeof err?.message === "string" && err.message ? err.message : "Failed to accept passphrase";
			setError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.2 }}
					className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-lg p-4"
					onClick={() => {
						if (!isSubmitting) onCancel();
					}}
				>
					<motion.form
						initial={{ scale: 0.95, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.95, opacity: 0 }}
						transition={{ duration: 0.25 }}
						onSubmit={handleSubmit}
						onClick={(event) => event.stopPropagation()}
						className="glass-card-elevated w-full max-w-md"
						style={{ padding: "var(--space-4)" }}
					>
						<div className="flex flex-col items-center gap-4 text-center">
							<span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--aegis-accent-primary)]/20">
								<Lock className="h-6 w-6 text-[var(--aegis-accent-primary)]" strokeWidth={2.25} />
							</span>
							<div>
								<h2 className="text-2xl font-semibold text-[var(--aegis-text-heading)]">Enter Passphrase</h2>
								<p className="mt-1 text-sm text-[var(--aegis-text-muted)]">
									{reason ?? "Provide your encryption passphrase to continue."}
								</p>
							</div>
						</div>

						<div className="mt-6 space-y-3">
							<div className="relative">
								<input
									type={showPassphrase ? "text" : "password"}
									className="input-glass w-full pr-12"
									placeholder="Passphrase"
									value={value}
									onChange={(event) => {
										setValue(event.target.value);
										setError(null);
									}}
									autoFocus
									disabled={isSubmitting}
								/>
								<button
									type="button"
									onClick={() => setShowPassphrase((prev) => !prev)}
									className="absolute inset-y-0 right-3 flex items-center text-[var(--aegis-text-muted)] hover:text-[var(--aegis-accent-teal)] transition-colors disabled:opacity-60"
									disabled={isSubmitting}
									aria-label={showPassphrase ? "Hide passphrase" : "Show passphrase"}
								>
									{showPassphrase ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
								</button>
							</div>
							{error && <p className="text-sm text-red-400">{error}</p>}
						</div>

						<div className="mt-6 flex gap-3">
							<motion.button
								type="button"
								onClick={() => {
									if (!isSubmitting) onCancel();
								}}
								className="flex-1 btn-ghost"
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								disabled={isSubmitting}
							>
								Cancel
							</motion.button>
							<motion.button
								type="submit"
								className="flex-1 btn-accent"
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								disabled={isSubmitting || !value.trim()}
							>
								{isSubmitting ? "Submitting..." : "Submit"}
							</motion.button>
						</div>
					</motion.form>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
