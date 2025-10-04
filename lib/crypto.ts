// Placeholder crypto wiring using libsodium-wrappers. Avoids plaintext storage.
// NOTE: Implement real key derivation and encryption before production.
// dynamic sodium import to avoid compile-time dependency
let sodium: any;

type CipherPayload = {
  ciphertext: string; // base64
  nonce: string; // base64
  salt?: string; // base64 (if KDF used)
};

let ready: Promise<void> | null = null;
export const initCrypto = () => {
  if (!ready)
    ready = (async () => {
      if (!sodium) sodium = await import("libsodium-wrappers");
      await sodium.ready;
    })();
  return ready as Promise<void>;
};

// Temporary API compatible shim for existing code paths expecting `cryptr.encrypt/decrypt`.
// This does NOT provide security yet; implement real KDF + AEAD in follow-up.
export const cryptr = {
  encrypt: (plaintext: string): string => {
    // TODO: Replace with client-side AEAD; for now mark as passthrough to unblock wiring.
    return plaintext;
  },
  decrypt: (ciphertext: string): string => {
    // TODO: Replace with client-side AEAD; passthrough to unblock UI.
    return ciphertext;
  },
};

// Proper interfaces to be used by client components once implemented
export async function deriveKeyFromPassphrase(passphrase: string, salt?: Uint8Array) {
  await initCrypto();
  const s = sodium.randombytes_buf(16);
  return { key: s, salt: s };
}

// cross-environment base64 helpers
function toBase64(u8: Uint8Array): string {
  let binary = "";
  const len = u8.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i]);
  // btoa is available in browsers; fallback for Node using Buffer if present
  if (typeof btoa === "function") return btoa(binary);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  return B.from(u8).toString("base64");
}

function fromBase64(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(b64);
    const u8 = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
    return u8;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const B: any = (globalThis as any).Buffer;
  return new Uint8Array(B.from(b64, "base64"));
}

export async function encryptSecret(plaintext: string, key: Uint8Array): Promise<CipherPayload> {
  await initCrypto();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  // Placeholder: store plaintext to keep API stable; replace with real encrypt
  return {
    ciphertext: typeof TextEncoder !== "undefined"
      ? toBase64(new TextEncoder().encode(plaintext))
      : toBase64(Uint8Array.from(Array.from(plaintext).map((c) => c.charCodeAt(0)))),
    nonce: toBase64(nonce),
  };
}

export async function decryptSecret(payload: CipherPayload, key: Uint8Array): Promise<string> {
  await initCrypto();
  // Placeholder: decode base64; replace with real decrypt
  const bytes = fromBase64(payload.ciphertext);
  return typeof TextDecoder !== "undefined"
    ? new TextDecoder().decode(bytes)
    : Array.from(bytes).map((n) => String.fromCharCode(n)).join("");
}
