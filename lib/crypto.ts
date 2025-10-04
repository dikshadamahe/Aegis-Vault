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
  const s = salt ?? sodium.randombytes_buf(16);
  const key = sodium.crypto_pwhash(
    32,
    passphrase,
    s,
    sodium.crypto_pwhash_OPSLIMIT_MODERATE,
    sodium.crypto_pwhash_MEMLIMIT_MODERATE,
    sodium.crypto_pwhash_ALG_ARGON2ID13
  );
  return { key, salt: s };
}

// cross-environment base64 helpers
function toBase64(u8: Uint8Array): string {
  let binary = "";
  const len = u8.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i]);
  // btoa is available in browsers; fallback for Node using Buffer if present
  if (typeof btoa === "function") return btoa(binary);
  const maybeBuffer = (globalThis as unknown as { Buffer?: { from: (i: Uint8Array | string, e?: string) => { toString: (e: string) => string } } }).Buffer;
  if (maybeBuffer) return maybeBuffer.from(u8).toString("base64");
  throw new Error("Base64 encoding not supported in this environment");
}

function fromBase64(b64: string): Uint8Array {
  if (typeof atob === "function") {
    const binary = atob(b64);
    const u8 = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) u8[i] = binary.charCodeAt(i);
    return u8;
  }
  const maybeBuffer = (globalThis as unknown as { Buffer?: { from: (i: string, e: string) => Uint8Array } }).Buffer;
  if (maybeBuffer) return new Uint8Array(maybeBuffer.from(b64, "base64"));
  throw new Error("Base64 decoding not supported in this environment");
}

export async function encryptSecret(plaintext: string, key: Uint8Array): Promise<CipherPayload> {
  await initCrypto();
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const msg = new TextEncoder().encode(plaintext);
  const cipher = sodium.crypto_secretbox_easy(msg, nonce, key);
  return {
    ciphertext: toBase64(cipher),
    nonce: toBase64(nonce),
  };
}

export async function decryptSecret(payload: CipherPayload, key: Uint8Array): Promise<string> {
  await initCrypto();
  const cipher = fromBase64(payload.ciphertext);
  const nonce = fromBase64(payload.nonce);
  const msg = sodium.crypto_secretbox_open_easy(cipher, nonce, key);
  return new TextDecoder().decode(msg);
}
