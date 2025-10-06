"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Favicon from "./Favicon";
import PassphraseModal from "./passphrase-modal";
import { decryptWithEnvelope, decryptSecret } from "@/lib/crypto";

type VaultItem = {
  id: string;
  websiteName: string;
  username?: string;
  url?: string;
  // encryption
  passwordCiphertext: string;
  passwordNonce: string;
  passwordEncryptedDek?: string;
  passwordDekNonce?: string;
};

export default function PasswordCard({ item }: { item: VaultItem }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const domain = item.url ? getDomain(item.url) : null;

  const handleKeyDerived = async (key: Uint8Array) => {
    try {
      let plain: string;
      if (item.passwordEncryptedDek && item.passwordDekNonce) {
        plain = await decryptWithEnvelope(
          {
            ciphertext: item.passwordCiphertext,
            nonce: item.passwordNonce,
            encryptedDek: item.passwordEncryptedDek,
            dekNonce: item.passwordDekNonce,
          },
          key
        );
      } else {
        plain = await decryptSecret(
          {
            ciphertext: item.passwordCiphertext,
            nonce: item.passwordNonce,
          },
          key
        );
      }
      setDecrypted(plain);
      setError(null);
    } catch (e) {
      setError("Failed to decrypt. Check your passphrase.");
    } finally {
      setIsModalOpen(false);
    }
  };

  return (
    <div className="glass-card p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/10">
          {domain ? <Favicon domain={domain} className="w-6 h-6" /> : <span className="text-white/70">🌐</span>}
        </div>
        <div>
          <div className="text-white font-medium">{item.websiteName}</div>
          <div className="text-[var(--aegis-text-muted)] text-sm">{item.username || item.url || ""}</div>
          <div className="text-sm mt-2 font-mono">
            {error ? (
              <span className="text-red-400">{error}</span>
            ) : decrypted ? (
              decrypted
            ) : (
              "••••••••••••"
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center"
        title={decrypted ? "Hide" : "Decrypt"}
      >
        {decrypted ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>

      {isModalOpen && (
        <PassphraseModal onKeyDerived={handleKeyDerived} onCancel={() => setIsModalOpen(false)} />
      )}
    </div>
  );
}

function getDomain(url: string): string | null {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
