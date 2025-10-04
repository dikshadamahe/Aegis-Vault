"use client";

import { VaultItem } from "@/types/vault";
import Link from "next/link";
import { Button } from "./ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useReducer, useState } from "react";
import { maskPassword } from "@/lib/mask-password";
import { decryptSecret } from "@/lib/crypto";
import { usePassphrase } from "@/providers/passphrase-provider";

interface PasswordContentProps {
  password: VaultItem;
}

const PasswordContent = ({ password }: PasswordContentProps) => {
  const [passwordMask, togglePasswordMask] = useReducer(
    (state) => !state,
    true,
  );
  const { openPassphrase, getKeyForSalt } = usePassphrase();
  const [decrypted, setDecrypted] = useState<string>("");
  const [notesOpen, toggleNotesOpen] = useReducer((s) => !s, false);
  const [notesDecrypted, setNotesDecrypted] = useState<string>("");


  const handleToggle = async () => {
    if (passwordMask) {
      // about to reveal -> decrypt first time
      await openPassphrase({ reason: "Enter passphrase to decrypt" });
      if (password.passwordCiphertext && password.passwordNonce && password.passwordSalt) {
        const key = await getKeyForSalt(password.passwordSalt);
        const plain = await decryptSecret(
          { ciphertext: password.passwordCiphertext, nonce: password.passwordNonce },
          key
        );
        setDecrypted(plain);
      }
    }
    togglePasswordMask();
  };

  return (
    <div className="space-y-0.5 rounded-lg border p-4">
      {password.username ? <p>Username: {password.username}</p> : null}
      {password.email ? (
        <p>
          Email:{" "}
          <Link
            href={`mailto:${password?.email}`}
            className="transition-all duration-300 hover:underline"
          >
            {password?.email}
          </Link>
        </p>
      ) : null}
      <p className="inline-flex items-center">
        Password: {!passwordMask ? decrypted : maskPassword(8)}
        <Button
          data-testid="reveal-password"
          variant="ghost"
          size="sm"
          className="ml-0.5"
          onClick={handleToggle}
          aria-label={passwordMask ? "Reveal Password" : "Hide Password"}
        >
          {passwordMask ? (
            <EyeIcon className="h-4 w-4" />
          ) : (
            <EyeOffIcon className="h-4 w-4" />
          )}
        </Button>
      </p>
      {password.url ? (
        <p>
          URL:{" "}
          <Link
            href={password?.url as string}
            className="transition-all duration-300 hover:underline"
          >
            {password?.url}
          </Link>
        </p>
      ) : null}
      {password.notesCiphertext ? (
        <p className="inline-flex items-center">
          Notes:{" "}
          {!notesOpen ? (
            <span className="ml-1 text-zinc-500">{"(hidden)"}</span>
          ) : (
            <span className="ml-1 whitespace-pre-wrap">{notesDecrypted}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="ml-0.5"
            onClick={async () => {
              if (!notesOpen) {
                await openPassphrase({ reason: "Enter passphrase to decrypt notes" });
                if (password.notesCiphertext && password.notesNonce && password.passwordSalt) {
                  const key = await getKeyForSalt(password.passwordSalt);
                  const plain = await decryptSecret(
                    { ciphertext: password.notesCiphertext, nonce: password.notesNonce },
                    key
                  );
                  setNotesDecrypted(plain);
                }
              }
              toggleNotesOpen();
            }}
          >
            {notesOpen ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
          </Button>
        </p>
      ) : null}
    </div>
  );
};

export default PasswordContent;
