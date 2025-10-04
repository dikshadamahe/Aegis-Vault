export type CategoryLite = {
  id: string;
  slug: string;
  name: string;
};

export type VaultItem = {
  id: string;
  websiteName: string;
  email?: string | null;
  username?: string | null;
  url?: string | null;
  category: CategoryLite;
  passwordCiphertext?: string | null;
  passwordNonce?: string | null;
  passwordSalt?: string | null;
  notesCiphertext?: string | null;
  notesNonce?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};
