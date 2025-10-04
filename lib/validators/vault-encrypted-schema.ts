import { z } from "zod";

export const encryptedVaultItemSchema = z.object({
  websiteName: z.string().min(1),
  url: z.union([z.literal(""), z.string().url()]).optional(),
  username: z.string().optional(),
  email: z.union([z.literal(""), z.string().email()]).optional(),
  category: z.string().min(1),
  // encrypted fields
  passwordCiphertext: z.string().min(1),
  passwordNonce: z.string().min(1),
  passwordSalt: z.string().min(1),
  notesCiphertext: z.string().optional(),
  notesNonce: z.string().optional(),
});

export type TEncryptedVaultItem = z.infer<typeof encryptedVaultItemSchema>;

export function assertNoPlaintext(input: unknown): boolean {
  if (!input || typeof input !== "object") return true;
  const anyInput = input as Record<string, unknown>;
  return !("password" in anyInput || "notes" in anyInput);
}
