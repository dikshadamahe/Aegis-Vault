import { describe, it, expect } from "vitest";
import { deriveKeyFromPassphrase, encryptSecret, decryptSecret } from "../lib/crypto";

describe("crypto round trip", () => {
  it("should encrypt and decrypt correctly", async () => {
    const pass = "Correct Horse Battery Staple!";
    const { key, salt } = await deriveKeyFromPassphrase(pass);
    const secret = "s3cr3t";
    const enc = await encryptSecret(secret, key);
    expect(enc.ciphertext).toBeTruthy();
    expect(enc.nonce).toBeTruthy();
    const dec = await decryptSecret(enc, key);
    expect(dec).toBe(secret);
  });
});
