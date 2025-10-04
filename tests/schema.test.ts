import { describe, it, expect } from "vitest";
import { encryptedVaultItemSchema, assertNoPlaintext } from "../lib/validators/vault-encrypted-schema";

describe("encrypted schema", () => {
  it("accepts encrypted payload", () => {
    const ok = encryptedVaultItemSchema.safeParse({
      websiteName: "example",
      url: "",
      username: "u",
      email: "e@example.com",
      category: "catId",
      passwordCiphertext: "AAA",
      passwordNonce: "BBB",
      passwordSalt: "CCC",
    });
    expect(ok.success).toBe(true);
    expect(assertNoPlaintext({ password: "x" })).toBe(false);
  });
});
