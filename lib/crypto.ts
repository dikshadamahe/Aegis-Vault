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
      if (!sodium) {
        const mod = await import("libsodium-wrappers");
        // use default when available (recommended), fallback to module
        sodium = (mod as any).default ?? mod;
      }
      await (sodium.ready as Promise<void>);
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
  if (typeof sodium.crypto_pwhash === "function") {
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
  // Fallback for non-browser/test environments: PBKDF2-SHA256
  const te = new TextEncoder();
  const baseKey = await (globalThis.crypto as Crypto).subtle.importKey(
    "raw",
    te.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await (globalThis.crypto as Crypto).subtle.deriveBits(
    { name: "PBKDF2", salt: s, iterations: 100_000, hash: "SHA-256" },
    baseKey,
    256
  );
  return { key: new Uint8Array(bits), salt: s };
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

// ===== ENVELOPE ENCRYPTION: DEK + MEK Architecture =====

type EnvelopePayload = {
  ciphertext: string;     // data encrypted with DEK (base64)
  nonce: string;          // nonce for data encryption (base64)
  encryptedDek: string;   // DEK encrypted with MEK (base64)
  dekNonce: string;       // nonce for DEK encryption (base64)
};

/**
 * Encrypts data using Envelope Encryption:
 * 1. Generate random DEK (Data Encryption Key)
 * 2. Encrypt plaintext with DEK
 * 3. Encrypt DEK with MEK (Master Encryption Key)
 * 4. Return both encrypted data and encrypted DEK
 */
export async function encryptWithEnvelope(plaintext: string, mek: Uint8Array): Promise<EnvelopePayload> {
  await initCrypto();
  
  // Step 1: Generate random DEK for this specific data
  const dek = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
  
  // Step 2: Encrypt plaintext with DEK
  const dataNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const msg = new TextEncoder().encode(plaintext);
  const dataCipher = sodium.crypto_secretbox_easy(msg, dataNonce, dek);
  
  // Step 3: Encrypt DEK with MEK
  const dekNonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const encryptedDek = sodium.crypto_secretbox_easy(dek, dekNonce, mek);
  
  return {
    ciphertext: toBase64(dataCipher),
    nonce: toBase64(dataNonce),
    encryptedDek: toBase64(encryptedDek),
    dekNonce: toBase64(dekNonce),
  };
}

/**
 * Decrypts data using Envelope Encryption:
 * 1. Decrypt DEK using MEK
 * 2. Decrypt data using decrypted DEK
 */
export async function decryptWithEnvelope(payload: EnvelopePayload, mek: Uint8Array): Promise<string> {
  await initCrypto();
  
  // Step 1: Decrypt DEK using MEK
  const encryptedDekBytes = fromBase64(payload.encryptedDek);
  const dekNonce = fromBase64(payload.dekNonce);
  const dek = sodium.crypto_secretbox_open_easy(encryptedDekBytes, dekNonce, mek);
  
  // Step 2: Decrypt data using DEK
  const dataCipher = fromBase64(payload.ciphertext);
  const dataNonce = fromBase64(payload.nonce);
  const msg = sodium.crypto_secretbox_open_easy(dataCipher, dataNonce, dek);
  
  return new TextDecoder().decode(msg);
}
