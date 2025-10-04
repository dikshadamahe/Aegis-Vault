"use client";

import { Prisma } from "@prisma/client";
import Link from "next/link";
import { Button } from "./ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useReducer, useState } from "react";
import { maskPassword } from "@/lib/mask-password";
import { decryptSecret, deriveKeyFromPassphrase } from "@/lib/crypto";
import { usePassphrase } from "@/providers/passphrase-provider";

interface PasswordContentProps {
  password: Prisma.PasswordGetPayload<{
    include: {
      category: true;
    };
  }>;
}

const PasswordContent = ({ password }: PasswordContentProps) => {
  const [passwordMask, togglePasswordMask] = useReducer(
    (state) => !state,
    true,
  );
  const { setPassphrase } = usePassphrase();
  const [decrypted, setDecrypted] = useState<string>("");
  const [notesOpen, toggleNotesOpen] = useReducer((s) => !s, false);
  const [notesDecrypted, setNotesDecrypted] = useState<string>("");

  const b64ToU8 = (b64: string) => {
    const bin = atob(b64);
    const u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  };

  const handleToggle = async () => {
    if (passwordMask) {
      // about to reveal -> decrypt first time
      const pass = window.prompt("Enter your vault passphrase to decrypt:") || "";
      await setPassphrase(pass);
      if (password.passwordCiphertext && password.passwordNonce && password.passwordSalt) {
        const saltU8 = b64ToU8(password.passwordSalt);
        const { key } = await deriveKeyFromPassphrase(pass, saltU8);
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
          variant="ghost"
          size="sm"
          className="ml-0.5"
          onClick={handleToggle}
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
                const pass = window.prompt("Enter your vault passphrase to decrypt notes:") || "";
                await setPassphrase(pass);
                if (password.notesCiphertext && password.notesNonce && password.passwordSalt) {
                  const saltU8 = b64ToU8(password.passwordSalt);
                  const { key } = await deriveKeyFromPassphrase(pass, saltU8);
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
