import { z } from "zod";

export const encryptedVaultItemSchema = z.object({
  websiteName: z.string().min(1),
  url: z.union([z.literal(""), z.string().url()]).optional(),
  username: z.string().optional(),
  email: z.union([z.literal(""), z.string().email()]).optional(),
  // encrypted fields
  passwordCiphertext: z.string().min(1),
  passwordNonce: z.string().min(1),
  passwordEncryptedDek: z.string().min(1),
  passwordDekNonce: z.string().min(1),
  passwordSalt: z.string().min(1).optional(),
  notesCiphertext: z.string().min(1).optional(),
  notesNonce: z.string().min(1).optional(),
  notesEncryptedDek: z.string().min(1).optional(),
  notesDekNonce: z.string().min(1).optional(),
  categoryId: z.string().optional(),
});

export type TEncryptedVaultItem = z.infer<typeof encryptedVaultItemSchema>;

export function assertNoPlaintext(input: unknown): boolean {
  if (!input || typeof input !== "object") return true;
  const anyInput = input as Record<string, unknown>;
  return !("password" in anyInput || "notes" in anyInput);
}
